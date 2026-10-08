import type { SerializedCookie } from 'tough-cookie'

const originalZenMoney = global.ZenMoney
const originalFetch = global.fetch
const OriginalHeaders = global.Headers

// [model] One jar handles HTTP cookies and legacy calls; native cookie persistence is staged until saveData.
describe('[model] shared fetch cookie jar', () => {
  let network: typeof import('./index')
  let persisted: SerializedCookie[]
  let staged: boolean
  let host: {
    __cookies: unknown
    saveCookies: () => void | Promise<void>
    restoreCookies: () => void | Promise<void>
    saveData: () => void | Promise<void>
  }
  const nativeFetch = jest.fn(async (url: string, options?: { headers: Headers }) => ({
    url,
    status: 200,
    headers: new OriginalHeaders(),
    text: async () => 'model response'
  }))

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    persisted = []
    staged = false
    class HostHeaders extends OriginalHeaders {}
    host = {
      __cookies: [],
      saveCookies () { staged = true },
      restoreCookies () {
        if (!staged) this.__cookies = structuredClone(persisted)
      },
      saveData () {
        if (staged) persisted = structuredClone(this.__cookies) as SerializedCookie[]
        staged = false
      }
    }
    global.ZenMoney = Object.assign(host, {
      Headers: HostHeaders,
      fetch: nativeFetch,
      openWebView: jest.fn()
    }) as unknown as typeof ZenMoney
    // Importing the contract before polyfill installation must not capture a different jar.
    network = jest.requireActual<typeof import('./index')>('./index')
    jest.requireActual('../../polyfills/fetch')
  })

  afterEach(() => {
    global.ZenMoney = originalZenMoney
    global.fetch = originalFetch
    global.Headers = OriginalHeaders
    jest.restoreAllMocks()
  })

  it('shares request, response and legacy cookies while retaining standard jar operations', async () => {
    const { cookieJar, fetch } = network
    await cookieJar.setCookie('session=one; Path=/; Secure', 'https://example.test')
    expect(await ZenMoney.getCookies()).toEqual([expect.objectContaining({ name: 'session', value: 'one' })])
    nativeFetch.mockResolvedValueOnce({
      url: 'https://example.test',
      status: 200,
      headers: new OriginalHeaders({ 'set-cookie': 'session=two; Path=/; Secure' }),
      text: async () => 'model response'
    })
    await fetch('https://example.test', { log: false })
    expect(nativeFetch.mock.calls[0][1]?.headers.get('cookie')).toBe('session=one')
    expect(await cookieJar.getCookieString('https://example.test')).toBe('session=two')
    await ZenMoney.setCookie('example.test', 'legacy', 'three')
    expect((await cookieJar.getCookies('https://example.test')).map(cookie => cookie.key)).toEqual(['session', 'legacy'])
    expect((await cookieJar.serialize()).cookies).toHaveLength(2)
    expect(cookieJar.getCookieStringSync('http://example.test')).toBe('legacy=three')
    expect(await cookieJar.getCookieString('https://other.test')).toBe('')
    await cookieJar.removeAllCookies()
    expect(await ZenMoney.getCookies()).toEqual([])
  })

  it('does not replace an explicit Cookie header but still stores response cookies', async () => {
    await network.cookieJar.setCookie('session=jar; Path=/', 'https://example.test')
    nativeFetch.mockResolvedValueOnce({
      url: 'https://example.test',
      status: 200,
      headers: new OriginalHeaders({ 'set-cookie': 'session=response; Path=/' }),
      text: async () => 'model response'
    })
    await network.fetch('https://example.test', { headers: { Cookie: 'explicit=one' }, log: false })
    expect(nativeFetch.mock.calls[0][1]?.headers.get('cookie')).toBe('explicit=one')
    expect(await network.cookieJar.getCookieString('https://example.test')).toBe('session=response')
  })

  it('stages a snapshot with saveCookies and persists it only at saveData', async () => {
    const { cookieJar, restoreCookies } = network
    await cookieJar.setCookie('session=one; Path=/', 'https://example.test')
    await ZenMoney.saveCookies()
    expect(persisted).toEqual([])
    await cookieJar.setCookie('session=two; Path=/', 'https://example.test')
    ZenMoney.saveData()
    expect(persisted).toEqual([expect.objectContaining({ key: 'session', value: 'one' })])
    await restoreCookies()
    expect(await cookieJar.getCookieString('https://example.test')).toBe('session=one')
  })

  it('persists cookies before resolving without a separate saveData call', async () => {
    const { cookieJar, saveCookies, restoreCookies } = network
    await cookieJar.setCookie('saved=one; Path=/', 'https://example.test')
    await saveCookies()
    expect(persisted).toEqual([expect.objectContaining({ key: 'saved', value: 'one' })])
    await cookieJar.setCookie('saved=two; Path=/', 'https://example.test')
    await restoreCookies()
    expect(await cookieJar.getCookieString('https://example.test')).toBe('saved=one')
  })

  it('waits for cookie storage before saving plugin data', async () => {
    let finishCookies: () => void = () => { throw new Error('Cookie storage has not started') }
    const started = new Promise<void>(resolve => {
      host.saveCookies = async () => await new Promise<void>(_resolve => {
        finishCookies = _resolve
        resolve()
      })
    })
    const saveData = jest.spyOn(host, 'saveData')
    const saving = network.saveCookies()
    await started
    expect(saveData).not.toHaveBeenCalled()
    finishCookies()
    await saving
    expect(saveData).toHaveBeenCalledTimes(1)
  })

  it.each(['sync', 'async'])('propagates %s data persistence failures', async mode => {
    const error = new Error('Model data persistence failure')
    host.saveData = mode === 'sync'
      ? () => { throw error }
      : async () => { throw error }
    await expect(network.saveCookies()).rejects.toBe(error)
  })

  it('restores the saved set without retaining cookies created after the snapshot', async () => {
    const { cookieJar, saveCookies, restoreCookies } = network
    await cookieJar.setCookie('saved=one; Path=/', 'https://example.test')
    await saveCookies()
    await cookieJar.setCookie('temporary=two; Path=/', 'https://example.test')
    await restoreCookies()
    expect(await cookieJar.getCookieString('https://example.test')).toBe('saved=one')
    await cookieJar.removeAllCookies()
    await saveCookies()
    await cookieJar.setCookie('temporary=three; Path=/', 'https://example.test')
    await restoreCookies()
    expect(await cookieJar.getCookieString('https://example.test')).toBe('')
  })

  it('propagates persistence failures', async () => {
    const { saveCookies, restoreCookies } = network
    const error = new Error('Model persistence failure')
    const saveData = jest.spyOn(host, 'saveData')
    host.saveCookies = async () => { throw error }
    await expect(saveCookies()).rejects.toBe(error)
    expect(saveData).not.toHaveBeenCalled()
    host.restoreCookies = () => { throw error }
    await expect(restoreCookies()).rejects.toBe(error)
  })

  it.each([null, {}, { key: 'missing-domain' }])('rejects malformed cookie %p without changing working cookies or logging them', async invalid => {
    const { cookieJar, restoreCookies } = network
    persisted = [{ key: 'saved', value: 'model-secret', domain: 'example.test', path: '/' }, invalid] as unknown as SerializedCookie[]
    const warn = jest.spyOn(console, 'warn')
    await cookieJar.setCookie('working=one; Path=/', 'https://example.test')
    await expect(restoreCookies()).rejects.toBeInstanceOf(Error)
    expect(await cookieJar.getCookieString('https://example.test')).toBe('working=one')
    expect(warn).not.toHaveBeenCalled()
  })

  it('checks capabilities lazily and follows replacement fetch jars', async () => {
    const { cookieJar } = network
    const { CookieJar } = jest.requireActual<typeof import('tough-cookie')>('tough-cookie')
    const nextJar = new CookieJar()
    Object.defineProperty(originalFetch, 'cookieJar', { value: nextJar, configurable: true })
    try {
      global.fetch = originalFetch
      await cookieJar.setCookie('next=one; Path=/', 'https://example.test')
      expect(await nextJar.getCookieString('https://example.test')).toBe('next=one')
    } finally {
      Reflect.deleteProperty(originalFetch, 'cookieJar')
    }
    const { IncompatibleVersionError } = jest.requireActual<typeof import('../../errors')>('../../errors')
    expect(() => { void cookieJar.getCookieString('https://example.test') }).toThrow(IncompatibleVersionError)
    Reflect.deleteProperty(global, 'ZenMoney')
    await expect(network.saveCookies()).rejects.toBeInstanceOf(IncompatibleVersionError)
    await expect(network.restoreCookies()).rejects.toBeInstanceOf(IncompatibleVersionError)
  })
})
