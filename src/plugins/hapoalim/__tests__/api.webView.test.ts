import fetchMock from 'fetch-mock'
import { EventEmitter } from 'events'
import type { WebViewGotoOptions, WebViewNavigationPolicy } from '../../../common/webView'
import { IncompatibleVersionError, UserInteractionError, ZPAPIError } from '../../../errors'

const BASE = 'https://login.bankhapoalim.co.il'
const ACCOUNTS = BASE + '/ServerServices/general/accounts?lang=he'
const PORTAL = BASE + '/portalserver/HomePage'
const originalHost = global.ZenMoney
const originalFetch = global.fetch

interface Auth { cookieHeader: string, xsrfToken: string | null, restContext: string | null, acquiredAt: number }
interface LoginOptions {
  isInBackground?: boolean
  allowInteraction?: boolean
  skipHidden?: boolean
  verify?: (auth: Auth) => Promise<unknown>
  interactionError?: Error
  onAuthUpdate?: (auth: Auth) => Promise<void>
  onInteraction?: () => void
}
interface Api {
  login: (options?: LoginOptions) => Promise<Auth>
  fetchTransactions: (auth: Auth, product: { type: string, id: string }, from: Date, to: Date) => Promise<unknown[]>
  getAuthGateVerifier: (error: unknown) => ((auth: Auth) => Promise<unknown>) | undefined
}
interface ModelResponse { status: number, headers?: Record<string, string>, body?: unknown }

// [model] Fake native sessions and HTTP envelopes test lifecycle, persistence and isolation;
// they do not establish Hapoalim response formats or real Android cookie sharing.
describe('[model] Hapoalim typed WebView lifecycle', () => {
  let api: Api
  let nativeCookies: string
  let pageUrl: string | null
  let view: NativeWebView
  let cookieRead: jest.Mock<Promise<string>, [string]>
  let show: jest.Mock<Promise<void>, []>
  let goto: jest.Mock<Promise<void>, [string, WebViewGotoOptions?]>
  let close: jest.Mock<Promise<void>, []>
  let nativeIsClosed: jest.Mock<Promise<boolean>, []>
  let debug: jest.SpyInstance
  let accountsResponse: jest.Mock<ModelResponse | Promise<ModelResponse>, []>
  let portalResponse: jest.Mock<ModelResponse | Promise<ModelResponse>, []>

  class NativeWebView extends EventEmitter {
    static readonly NavigationAction = { LOAD: undefined, BLOCK: true, OPEN_EXTERNAL: 2 }
    private policy: WebViewNavigationPolicy | null = null
    readonly cookieJar = { getCookieString: async (url: string): Promise<string> => await cookieRead(url), setCookie: async (): Promise<void> => {} }
    get navigationPolicy (): WebViewNavigationPolicy | null { return this.policy }
    set navigationPolicy (value: WebViewNavigationPolicy | null) { this.policy = value }
    readonly show = async (): Promise<void> => await show()
    readonly close = async (): Promise<void> => await close()
    readonly isClosed = async (): Promise<boolean> => await nativeIsClosed()
    readonly url = async (): Promise<string | null> => pageUrl
    async goto (url: string, options?: WebViewGotoOptions): Promise<void> {
      const decision = this.policy?.({ url, method: 'GET', headers: {}, source: 'webView' })
      expect(decision).toBeUndefined()
      await goto(url, options)
    }

    constructor () {
      super()
      // Record the host-created instance to inspect its native event subscriptions.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      view = this
    }
  }

  async function flush (milliseconds = 0): Promise<void> {
    await new Promise<void>(resolve => setImmediate(resolve))
    for (let i = 0; i < 60; i++) await Promise.resolve()
    jest.advanceTimersByTime(milliseconds)
    for (let i = 0; i < 60; i++) await Promise.resolve()
    jest.advanceTimersByTime(0)
    for (let i = 0; i < 60; i++) await Promise.resolve()
  }

  function requestCount (): number {
    // Installed fetch-mock v5 returns grouped calls; its bundled typings describe v7.
    return (fetchMock.calls() as unknown as { matched: unknown[] }).matched.length
  }

  async function finish<T> (promise: Promise<T>): Promise<T> {
    for (let i = 0; i < 5; i++) await flush()
    return await promise
  }

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance', 'nextTick', 'setImmediate'] })
    jest.setSystemTime(new Date('2026-10-09T12:00:00Z'))
    nativeCookies = ''
    pageUrl = BASE + '/ng-portals/auth/he/'
    cookieRead = jest.fn(async (_url: string) => nativeCookies)
    show = jest.fn(async () => {})
    goto = jest.fn(async (_url: string, _options?: WebViewGotoOptions) => { nativeCookies = 'SMSESSION=model-session; XSRF-TOKEN=model-xsrf'; pageUrl = PORTAL })
    close = jest.fn(async () => { view.emit('close') })
    nativeIsClosed = jest.fn(async () => false)
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    global.ZenMoney = { WebView: NativeWebView } as unknown as typeof ZenMoney
    accountsResponse = jest.fn(async () => ({ status: 200, body: [] }))
    portalResponse = jest.fn(async () => ({ status: 200, body: 'restContext: "/pib"' }))
    fetchMock.get(ACCOUNTS, async () => await accountsResponse())
    fetchMock.get(PORTAL, async () => await portalResponse())
    api = jest.requireActual<Api>('../api')
  })

  afterEach(() => {
    const timerCount = jest.getTimerCount()
    fetchMock.restore()
    global.fetch = originalFetch
    global.ZenMoney = originalHost
    jest.restoreAllMocks()
    jest.useRealTimers()
    expect(timerCount).toBe(0)
  })

  it('uses the native constructor, verifies accounts and owns cleanup', async () => {
    const auth = await finish(api.login())
    expect(auth).toEqual({ cookieHeader: nativeCookies, xsrfToken: 'model-xsrf', restContext: 'pib', acquiredAt: Date.now() })
    expect(show).toHaveBeenCalledTimes(1)
    expect(goto).toHaveBeenCalledWith(expect.stringContaining('getLogonPage'), expect.objectContaining({ waitUntil: 'commit', timeout: 30000 }))
    expect(cookieRead).toHaveBeenCalledWith(ACCOUNTS)
    expect(close).toHaveBeenCalledTimes(1)
    expect(nativeIsClosed).not.toHaveBeenCalled()
    expect(view.listenerCount('close')).toBe(0)
  })

  it.each([false, true])('recovers native cookies while hidden (background: %s)', async isInBackground => {
    nativeCookies = 'SMSESSION=hidden-session; XSRF-TOKEN=hidden-token'
    const persisted = jest.fn(async () => {})
    const auth = await finish(api.login({ isInBackground, onAuthUpdate: persisted }))
    expect(auth.cookieHeader).toBe(nativeCookies)
    expect(show).not.toHaveBeenCalled()
    expect(goto).not.toHaveBeenCalled()
    expect(persisted).toHaveBeenNthCalledWith(1, expect.objectContaining({ restContext: null, cookieHeader: nativeCookies }))
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('raises the background control signal before cold login or navigation', async () => {
    const outcome = api.login({ isInBackground: true }).catch((error: unknown) => error)
    expect(await finish(outcome)).toBeInstanceOf(UserInteractionError)
    expect(show).not.toHaveBeenCalled()
    expect(goto).not.toHaveBeenCalled()
    expect(requestCount()).toBe(0)
  })

  it('does not repeat an already used interactive flow', async () => {
    const outcome = api.login({ allowInteraction: false }).catch((error: unknown) => error)
    expect(await finish(outcome)).toBeInstanceOf(Error)
    expect(show).not.toHaveBeenCalled()
    expect(goto).not.toHaveBeenCalled()
  })

  it('reports a missing WebView API only when login needs to construct it', async () => {
    global.ZenMoney = {} as unknown as typeof ZenMoney
    await expect(api.login()).rejects.toBeInstanceOf(IncompatibleVersionError)
  })

  it.each([401, 403, 429, 503])('does not start cold login after unknown HTTP %s', async status => {
    nativeCookies = 'SMSESSION=hidden'
    accountsResponse.mockReturnValue({ status, body: {} })
    const outcome = api.login().catch((error: unknown) => error)
    const error = await finish(outcome)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(show).not.toHaveBeenCalled()
    expect(goto).not.toHaveBeenCalled()
  })

  it('falls through from a confirmed login redirect to foreground login', async () => {
    nativeCookies = 'SMSESSION=expired'
    accountsResponse.mockReturnValueOnce({ status: 302, headers: { location: BASE + '/ng-portals/auth/he/' } })
    const auth = await finish(api.login())
    expect(auth.cookieHeader).toContain('model-session')
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('releases navigation even while accounts verification is unresolved', async () => {
    let resolveResponse: ((response: { status: number, body: unknown[] }) => void) | undefined
    accountsResponse.mockImplementation(async () => await new Promise(resolve => { resolveResponse = resolve }))
    const result = api.login()
    await flush()
    expect(goto).toHaveBeenCalledTimes(1)
    expect(view.navigationPolicy?.({ url: PORTAL, method: 'GET', headers: {}, source: 'webView' })).toBeUndefined()
    expect(close).not.toHaveBeenCalled()
    resolveResponse?.({ status: 200, body: [] })
    await finish(result)
  })

  it.each(['cookies', 'accounts', 'navigation', 'presentation'])('bounds hung %s and discards late results', async stage => {
    let resolveLate: (() => void) | undefined
    const late = new Promise<void>(resolve => { resolveLate = resolve })
    const persisted = jest.fn(async () => {})
    if (stage === 'cookies') cookieRead.mockImplementation(async () => { await late; return 'SMSESSION=late' })
    if (stage === 'accounts') accountsResponse.mockImplementation(async () => { await late; return { status: 200, body: [] } })
    if (stage === 'navigation') goto.mockImplementation(async () => { await late })
    if (stage === 'presentation') show.mockImplementation(async () => { await late })
    const outcome = api.login({ onAuthUpdate: persisted }).catch((error: unknown) => error)
    await flush()
    await flush(stage === 'navigation' ? 30000 : 15000)
    expect(await finish(outcome)).toBeInstanceOf(Error)
    expect(close).toHaveBeenCalledTimes(1)
    expect(persisted).not.toHaveBeenCalled()
    const requestsBeforeLateResult = requestCount()
    resolveLate?.()
    await flush()
    expect(requestCount()).toBe(requestsBeforeLateResult)
    expect(persisted).not.toHaveBeenCalled()
  })

  it('bounds the complete user login wait and detaches the close listener', async () => {
    goto.mockImplementation(async () => {})
    const outcome = api.login().catch((error: unknown) => error)
    await flush()
    for (let i = 0; i < 600; i++) await flush(1000)
    const error = await finish(outcome)
    expect(error).toMatchObject({ message: 'Bank Hapoalim WebView login timed out' })
    expect(close).toHaveBeenCalledTimes(1)
    expect(view.listenerCount('close')).toBe(0)
  })

  it('keeps an already started HTTP verification alive after a committed page closes', async () => {
    let resolveLate: (() => void) | undefined
    const late = new Promise<void>(resolve => { resolveLate = resolve })
    accountsResponse.mockImplementation(async () => { await late; return { status: 200, body: [] } })
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ onAuthUpdate: persisted })
    await flush()
    view.emit('close')
    resolveLate?.()
    const auth = await finish(outcome)
    expect(auth.cookieHeader).toContain('SMSESSION=model-session')
    expect(persisted).toHaveBeenCalledWith(expect.objectContaining({ cookieHeader: auth.cookieHeader }))
    expect(fetchMock.called(PORTAL)).toBe(true)
  })

  it.each(['hidden', 'navigation'])('keeps an unexpected %s close reportable', async phase => {
    let resolveLate: (() => void) | undefined
    const late = new Promise<void>(resolve => { resolveLate = resolve })
    if (phase === 'hidden') cookieRead.mockImplementation(async () => { await late; return '' })
    if (phase === 'navigation') goto.mockImplementation(async () => { await late })
    const outcome = api.login().catch((error: unknown) => error)
    await flush()
    view.emit('close')
    const error = await finish(outcome)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    resolveLate?.()
    await flush()
  })

  it('preserves verified auth when close interrupts the final native-cookie read', async () => {
    let resolveLate: ((cookies: string) => void) | undefined
    cookieRead.mockResolvedValueOnce('').mockImplementationOnce(async () => nativeCookies)
      .mockImplementationOnce(async () => await new Promise<string>(resolve => { resolveLate = resolve }))
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ onAuthUpdate: persisted })
    await flush()
    expect(cookieRead).toHaveBeenCalledTimes(3)
    view.emit('close')
    const auth = await finish(outcome)
    expect(auth.cookieHeader).toContain('SMSESSION=model-session')
    const count = persisted.mock.calls.length
    resolveLate?.('SMSESSION=late')
    await flush()
    expect(persisted).toHaveBeenCalledTimes(count)
    expect(auth.cookieHeader).not.toContain('late')
  })

  it('does not call native close again after a successful closed-page verification', async () => {
    let resolveResponse: ((response: ModelResponse) => void) | undefined
    accountsResponse.mockImplementation(async () => await new Promise<ModelResponse>(resolve => { resolveResponse = resolve }))
    close.mockRejectedValue(new Error('already closed'))
    const outcome = api.login()
    await flush()
    view.emit('close')
    resolveResponse?.({ status: 200, body: [] })
    expect(await finish(outcome)).toMatchObject({ cookieHeader: expect.stringContaining('model-session') })
    expect(close).not.toHaveBeenCalled()
  })

  it('persists portal cookie rotation before a later discovery request fails', async () => {
    portalResponse.mockResolvedValue({ status: 200, headers: { 'set-cookie': 'SMSESSION=portal-rotated; Path=/' }, body: 'no context' })
    fetchMock.get(BASE + '/ng-portals-bt/rb/he/homepage', { status: 500, body: 'model failure' })
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ onAuthUpdate: persisted }).catch((error: unknown) => error)
    expect(await finish(outcome)).toBeInstanceOf(Error)
    expect(persisted).toHaveBeenCalledWith(expect.objectContaining({ cookieHeader: expect.stringContaining('SMSESSION=portal-rotated') }))
  })

  it('backs off a persistent portal gate and immediately retries a changed session', async () => {
    accountsResponse.mockResolvedValue({ status: 401, body: { error: { errCode: 'STEPUPOTP' } } })
    const outcome = api.login()
    await flush()
    for (let i = 0; i < 90; i++) await flush(1000)
    expect(accountsResponse.mock.calls.length).toBeLessThanOrEqual(8)
    const count = accountsResponse.mock.calls.length
    nativeCookies = 'SMSESSION=changed; XSRF-TOKEN=changed'
    accountsResponse.mockResolvedValue({ status: 200, body: [] })
    await flush(1000)
    expect(await finish(outcome)).toMatchObject({ cookieHeader: nativeCookies })
    expect(accountsResponse).toHaveBeenCalledTimes(count + 1)
  })

  it('does not probe a new session until the bank reaches an authenticated portal URL', async () => {
    goto.mockImplementation(async () => { nativeCookies = 'SMSESSION=partial'; pageUrl = BASE + '/ng-portals/auth/he/' })
    const outcome = api.login()
    await flush()
    expect(accountsResponse).not.toHaveBeenCalled()
    pageUrl = PORTAL
    await flush(1000)
    expect((await finish(outcome)).cookieHeader).toContain('SMSESSION=partial')
    expect(accountsResponse).toHaveBeenCalledTimes(1)
  })

  it.each([false, true])('bypasses rejected hidden auth for operation-specific step-up (background: %s)', async isInBackground => {
    nativeCookies = 'SMSESSION=accounts-only'
    const outcome = api.login({ skipHidden: true, isInBackground }).catch((error: unknown) => error)
    const result = await finish(outcome)
    if (isInBackground) {
      expect(result).toBeInstanceOf(UserInteractionError)
      expect(show).not.toHaveBeenCalled()
      expect(accountsResponse).not.toHaveBeenCalled()
    } else {
      expect(result).toMatchObject({ cookieHeader: expect.stringContaining('SMSESSION=model-session') })
      expect(show).toHaveBeenCalledTimes(1)
      expect(accountsResponse).toHaveBeenCalledTimes(1)
    }
  })

  it.each([false, true])('waits for the actual challenged request, regardless of cookie rotation (%s)', async rotate => {
    nativeCookies = 'SMSESSION=rejected; XSRF-TOKEN=rejected-xsrf'
    goto.mockImplementation(async () => { pageUrl = PORTAL })
    let allowed = false
    const requestIds: string[] = []
    const history = jest.fn(() => allowed
      ? { status: 200, body: { transactions: [] } }
      : { status: 401, body: { error: { errCode: 'STEPUPOTP' } } })
    fetchMock.post((url: string) => url.startsWith(BASE + '/pib/current-account/transactions?'), (_url, options) => {
      const headers = options.headers as Record<string, string>
      requestIds.push(headers.uuid)
      expect(headers.pageUuid).toBe('/current-account/transactions')
      expect(options.body).toBe('[]')
      return history()
    })
    const rejected = await api.fetchTransactions({ cookieHeader: nativeCookies, xsrfToken: 'rejected-xsrf', restContext: 'pib', acquiredAt: 1 },
      { type: 'account', id: 'model-account' }, new Date('2026-10-01'), new Date('2026-10-09')).catch((error: unknown) => error)
    const verify = api.getAuthGateVerifier(rejected)
    expect(typeof verify).toBe('function')
    const persisted = jest.fn(async () => {})
    const result = api.login({ skipHidden: true, verify, onAuthUpdate: persisted })
    await flush()
    if (rotate) nativeCookies = 'SMSESSION=replaced; XSRF-TOKEN=replaced-xsrf'
    await flush(1000)
    expect(history.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(persisted).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    allowed = true
    await flush(31000)
    expect((await finish(result)).cookieHeader).toBe(nativeCookies)
    expect(close).toHaveBeenCalledTimes(1)
    expect(new Set(requestIds).size).toBe(requestIds.length)
    const markers = jest.mocked(console.log).mock.calls.filter(([message]) => message === 'Bank Hapoalim step-up: waiting for bank confirmation')
    expect(markers).toHaveLength(1)
    expect(JSON.stringify(markers)).not.toMatch(/rejected-xsrf|SMSESSION=rejected/)
  })

  it('preserves accepted HTTP proof when a hidden view closes during portal discovery', async () => {
    nativeCookies = 'SMSESSION=hidden; XSRF-TOKEN=hidden-xsrf'
    portalResponse.mockImplementation(async () => { view.emit('close'); return { status: 200, body: 'restContext: "/pib"' } })
    const persisted = jest.fn(async () => {})
    const auth = await finish(api.login({ onAuthUpdate: persisted }))
    expect(auth.restContext).toBe('pib')
    expect(persisted).toHaveBeenNthCalledWith(1, expect.objectContaining({ cookieHeader: nativeCookies }))
    expect(show).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    expect(view.listenerCount('close')).toBe(0)
  })

  it('settles a hidden in-flight HTTP proof after a native close', async () => {
    nativeCookies = 'SMSESSION=hidden'
    accountsResponse.mockImplementation(async () => { view.emit('close'); return { status: 200, body: [] } })
    expect((await finish(api.login())).restContext).toBe('pib')
    expect(show).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    expect(view.listenerCount('close')).toBe(0)
  })

  it('persists a 404 portal cookie rotation before trying the next official portal', async () => {
    nativeCookies = 'SMSESSION=hidden'
    portalResponse.mockResolvedValue({ status: 404, headers: { 'set-cookie': 'SMSESSION=rotated404; Path=/' }, body: '' })
    const persisted = jest.fn(async (_auth: Auth) => {})
    fetchMock.get(BASE + '/ng-portals-bt/rb/he/homepage', (_url, options) => {
      expect((options.headers as Record<string, string>).Cookie).toBe('SMSESSION=rotated404')
      expect(persisted).toHaveBeenLastCalledWith(expect.objectContaining({ cookieHeader: 'SMSESSION=rotated404' }))
      return { status: 200, body: 'restContext: "/pib"' }
    })
    const auth = await finish(api.login({ onAuthUpdate: persisted }))
    expect(auth).toMatchObject({ cookieHeader: 'SMSESSION=rotated404', restContext: 'pib' })
  })

  it('replays the exact failed portal read through its captured auth gate verifier', async () => {
    portalResponse.mockResolvedValueOnce({ status: 302, headers: { location: '/ng-portals/auth/he/' }, body: '' })
      .mockResolvedValueOnce({ status: 200, body: 'restContext: "/pib"' })
    const error = await finish(api.login().catch((error: unknown) => error))
    expect(error).toMatchObject({ responseSummary: { status: 302, isLoginPage: true } })
    const verify = api.getAuthGateVerifier(error)
    if (verify == null) throw new Error('model portal verifier missing')
    await expect(verify({ cookieHeader: 'SMSESSION=portal-replay', xsrfToken: null, restContext: null, acquiredAt: 1 })).resolves.toMatchObject({ status: 200 })
    expect(portalResponse).toHaveBeenCalledTimes(2)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('retains the original auth diagnostic when interaction is unavailable', async () => {
    const original = new Error('model original auth diagnostic')
    expect(await finish(api.login({ allowInteraction: false, interactionError: original }).catch((error: unknown) => error))).toBe(original)
    expect(show).not.toHaveBeenCalled()
  })

  it.each([401, 503])('does not hide an unknown challenged-request HTTP %s behind login', async status => {
    nativeCookies = 'SMSESSION=hidden'
    let response: ModelResponse = { status: 401, body: { error: { errCode: 'STEPUPOTP' } } }
    fetchMock.post((url: string) => url.startsWith(BASE + '/pib/current-account/transactions?'), () => response)
    const rejected = await api.fetchTransactions({ cookieHeader: nativeCookies, xsrfToken: null, restContext: 'pib', acquiredAt: 1 },
      { type: 'account', id: 'model-account' }, new Date('2026-10-01'), new Date('2026-10-09')).catch((error: unknown) => error)
    response = { status, body: {} }
    const persisted = jest.fn(async () => {})
    const error = await finish(api.login({ verify: api.getAuthGateVerifier(rejected), onAuthUpdate: persisted }).catch((error: unknown) => error))
    expect(error).toMatchObject({ responseSummary: { status } })
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(show).not.toHaveBeenCalled()
    expect(persisted).not.toHaveBeenCalled()
  })

  it('bounds a challenged HTTP proof and ignores its late cookie rotation', async () => {
    nativeCookies = 'SMSESSION=hidden'
    let resolveLate: ((response: ModelResponse) => void) | undefined
    let pending = false
    fetchMock.post((url: string) => url.startsWith(BASE + '/pib/current-account/transactions?'), async () => {
      if (pending) return await new Promise<ModelResponse>(resolve => { resolveLate = resolve })
      return { status: 401, body: { error: { errCode: 'STEPUPOTP' } } }
    })
    const rejected = await api.fetchTransactions({ cookieHeader: nativeCookies, xsrfToken: null, restContext: 'pib', acquiredAt: 1 },
      { type: 'account', id: 'model-account' }, new Date('2026-10-01'), new Date('2026-10-09')).catch((error: unknown) => error)
    pending = true
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ verify: api.getAuthGateVerifier(rejected), onAuthUpdate: persisted }).catch((error: unknown) => error)
    await flush()
    await flush(15000)
    expect(await finish(outcome)).toBeInstanceOf(Error)
    expect(persisted).not.toHaveBeenCalled()
    const count = requestCount()
    resolveLate?.({ status: 200, headers: { 'set-cookie': 'SMSESSION=late; Path=/' }, body: { transactions: [] } })
    await flush()
    expect(requestCount()).toBe(count)
    expect(persisted).not.toHaveBeenCalled()
    expect(view.listenerCount('close')).toBe(0)
  })

  it('reports closing a committed login while waiting without a proof in flight', async () => {
    goto.mockImplementation(async () => { pageUrl = BASE + '/ng-portals/auth/he/' })
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ onAuthUpdate: persisted }).catch((error: unknown) => error)
    await flush()
    view.emit('close')
    const error = await finish(outcome)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(accountsResponse).not.toHaveBeenCalled()
    expect(persisted).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    expect(view.listenerCount('close')).toBe(0)
  })

  it('rejects a snapshot replaced during verification and verifies the replacement', async () => {
    let probes = 0
    accountsResponse.mockImplementation(() => {
      probes++
      if (probes === 1) nativeCookies = 'SMSESSION=replaced; XSRF-TOKEN=replaced-token'
      return { status: 200, body: [] }
    })
    const persisted = jest.fn(async () => {})
    const result = api.login({ onAuthUpdate: persisted })
    await flush()
    await flush(1000)
    const auth = await finish(result)
    expect(auth.cookieHeader).toContain('SMSESSION=replaced')
    expect(probes).toBe(2)
    expect(JSON.stringify(persisted.mock.calls)).not.toContain('model-session')
  })

  it('retains server-rotated auth while non-session native cookies change', async () => {
    accountsResponse.mockImplementation(() => {
      nativeCookies += '; TS=rotated'
      return { status: 200, headers: { 'set-cookie': 'SMSESSION=server-rotated; Path=/; Secure' }, body: [] }
    })
    const auth = await finish(api.login())
    expect(auth.cookieHeader).toContain('SMSESSION=server-rotated')
  })

  it.each([false, true])('re-verifies a replaced hidden session without presenting login (background: %s)', async isInBackground => {
    nativeCookies = 'SMSESSION=initial; XSRF-TOKEN=initial-token'
    accountsResponse.mockImplementationOnce(() => {
      nativeCookies = 'SMSESSION=replacement; XSRF-TOKEN=replacement-token'
      return { status: 200, body: [] }
    })
    const persisted = jest.fn(async () => {})
    const auth = await finish(api.login({ isInBackground, onAuthUpdate: persisted }))
    expect(auth.cookieHeader).toContain('SMSESSION=replacement')
    expect(accountsResponse).toHaveBeenCalledTimes(2)
    expect(show).not.toHaveBeenCalled()
    expect(goto).not.toHaveBeenCalled()
    expect(JSON.stringify(persisted.mock.calls)).not.toContain('SMSESSION=initial')
  })

  it('bounds repeated hidden session replacement without falling back to cold login', async () => {
    nativeCookies = 'SMSESSION=initial'
    accountsResponse.mockImplementation(() => {
      nativeCookies += '-next'
      return { status: 200, body: [] }
    })
    const outcome = api.login().catch((error: unknown) => error)
    expect(await finish(outcome)).toMatchObject({ message: expect.stringContaining('kept changing') })
    expect(accountsResponse).toHaveBeenCalledTimes(3)
    expect(show).not.toHaveBeenCalled()
  })

  it('closes even if detaching a listener fails', async () => {
    const error = new Error('native event bridge failed')
    jest.spyOn(NativeWebView.prototype, 'off').mockImplementation(() => { throw error })
    const outcome = api.login().catch((error: unknown) => error)
    expect(await finish(outcome)).toBe(error)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('bounds native cleanup and preserves verified auth', async () => {
    close.mockImplementation(async () => await new Promise(() => {}))
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ onAuthUpdate: persisted }).catch((error: unknown) => error)
    await flush()
    for (let i = 0; i < 5; i++) await flush()
    expect(persisted).toHaveBeenCalled()
    await flush(15000)
    expect(await finish(outcome)).toMatchObject({ message: 'Bank Hapoalim WebView close timed out' })
  })

  it('retries a rejected close once after yielding without discarding verified auth', async () => {
    close.mockRejectedValueOnce(new Error('model pending native policy'))
    const persisted = jest.fn(async () => {})
    expect((await finish(api.login({ onAuthUpdate: persisted }))).cookieHeader).toContain('SMSESSION=model-session')
    expect(close).toHaveBeenCalledTimes(2)
    expect(persisted).toHaveBeenCalled()
    expect(view.listenerCount('close')).toBe(0)
  })

  it('accepts confirmed native closure without relying on a detached event listener', async () => {
    close.mockRejectedValueOnce(new Error('model native close tore down the view but rejected'))
    nativeIsClosed.mockResolvedValue(true)
    expect((await finish(api.login())).cookieHeader).toContain('SMSESSION=model-session')
    expect(close).toHaveBeenCalledTimes(1)
    expect(nativeIsClosed).toHaveBeenCalledTimes(1)
    expect(view.listenerCount('close')).toBe(0)
  })

  it('logs a sanitized retry timeout while preserving the original close diagnostic', async () => {
    const initial = new Error('model first close rejected')
    close.mockRejectedValueOnce(initial).mockImplementationOnce(async () => await new Promise(() => {}))
    const outcome = api.login().catch((error: unknown) => error)
    await flush()
    await flush(15000)
    expect(await finish(outcome)).toBe(initial)
    expect(close).toHaveBeenCalledTimes(2)
    expect(console.warn).toHaveBeenCalledWith('Bank Hapoalim WebView close retry failed', {
      stage: 'retrying close', errorType: 'Error', timedOut: true
    })
    expect(view.listenerCount('close')).toBe(0)
  })

  it.each(['rejection', 'malformed', 'timeout'])('preserves the first close error when isClosed fails: %s', async mode => {
    const initial = new Error('model first close rejected')
    close.mockRejectedValueOnce(initial)
    if (mode === 'rejection') nativeIsClosed.mockRejectedValueOnce(new Error('MODEL_PRIVATE_NATIVE_DIAGNOSTIC'))
    if (mode === 'malformed') nativeIsClosed.mockResolvedValueOnce(null as unknown as boolean)
    if (mode === 'timeout') nativeIsClosed.mockImplementationOnce(async () => await new Promise(() => {}))
    const outcome = api.login().catch((error: unknown) => error)
    await flush()
    if (mode === 'timeout') await flush(15000)
    expect(await finish(outcome)).toBe(initial)
    expect(close).toHaveBeenCalledTimes(1)
    expect(nativeIsClosed).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith('Bank Hapoalim WebView close retry failed', {
      stage: 'reading closed state', errorType: 'Error', timedOut: mode === 'timeout'
    })
    expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('MODEL_PRIVATE_NATIVE_DIAGNOSTIC')
    expect(view.listenerCount('close')).toBe(0)
  })

  it('retains persisted auth when the global login deadline interrupts completion', async () => {
    goto.mockImplementation(async () => { pageUrl = BASE + '/ng-portals/auth/he/' })
    portalResponse.mockImplementation(async () => await new Promise(() => {}))
    const snapshots: Auth[] = []
    const outcome = api.login({
      onAuthUpdate: async auth => {
        snapshots.push({ ...auth })
      }
    }).catch((error: unknown) => error)
    await flush()
    for (let second = 0; second < 598; second++) await flush(1000)
    nativeCookies = 'SMSESSION=verified-near-deadline'
    pageUrl = PORTAL
    await flush(1000)
    await flush()
    await flush()
    expect(snapshots).toEqual([expect.objectContaining({ cookieHeader: nativeCookies })])
    await flush(1000)
    const error = await finish(outcome)
    expect(error).toMatchObject({ message: 'Bank Hapoalim WebView login timed out' })
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(snapshots).toHaveLength(1)
    expect(portalResponse).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
    expect(view.listenerCount('close')).toBe(0)
    // Native HTTP is not cancellable; its separate bounded deadline must drain
    // without a late persistence callback or another portal request.
    await flush(15000)
    expect(snapshots).toHaveLength(1)
    expect(portalResponse).toHaveBeenCalledTimes(1)
  })

  it('does not discover or persist a portal context after the global deadline even if native HTTP settles later', async () => {
    goto.mockImplementation(async () => { pageUrl = BASE + '/ng-portals/auth/he/' })
    let resolvePortal: ((response: ModelResponse) => void) | undefined
    portalResponse.mockImplementation(async () => await new Promise<ModelResponse>(resolve => { resolvePortal = resolve }))
    const snapshots: Auth[] = []
    const outcome = api.login({ onAuthUpdate: async auth => { snapshots.push({ ...auth }) } }).catch((error: unknown) => error)
    await flush()
    for (let second = 0; second < 598; second++) await flush(1000)
    nativeCookies = 'SMSESSION=verified-near-deadline'
    pageUrl = PORTAL
    await flush(1000)
    await flush()
    expect(snapshots).toHaveLength(1)
    await flush(1000)
    expect(await finish(outcome)).toMatchObject({ message: 'Bank Hapoalim WebView login timed out' })
    if (resolvePortal == null) throw new Error('model portal request did not start')
    resolvePortal({ status: 404, headers: { 'set-cookie': 'SMSESSION=late-response; Path=/' }, body: '' })
    await flush()
    expect(snapshots).toEqual([expect.objectContaining({ cookieHeader: 'SMSESSION=verified-near-deadline' })])
    expect(portalResponse).toHaveBeenCalledTimes(1)
    expect(fetchMock.called(BASE + '/ng-portals-bt/rb/he/homepage')).toBe(false)
    expect(close).toHaveBeenCalledTimes(1)
    expect(view.listenerCount('close')).toBe(0)
  })

  it('bounds step-up request replays throughout the ten-minute wait', async () => {
    nativeCookies = 'SMSESSION=waiting'
    goto.mockImplementation(async () => { pageUrl = PORTAL })
    fetchMock.post((url: string) => url.startsWith(BASE + '/pib/current-account/transactions?'), { status: 401, body: { error: { errCode: 'STEPUPOTP' } } })
    const rejected = await api.fetchTransactions({ cookieHeader: nativeCookies, xsrfToken: null, restContext: 'pib', acquiredAt: 1 },
      { type: 'account', id: 'model-account' }, new Date('2026-10-01'), new Date('2026-10-09')).catch((error: unknown) => error)
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ skipHidden: true, verify: api.getAuthGateVerifier(rejected), onAuthUpdate: persisted }).catch((error: unknown) => error)
    await flush()
    for (let second = 0; second < 600; second++) await flush(1000)
    expect(await finish(outcome)).toMatchObject({ message: 'Bank Hapoalim WebView login timed out' })
    expect(accountsResponse.mock.calls.length).toBeGreaterThan(15)
    expect(accountsResponse.mock.calls.length).toBeLessThanOrEqual(25)
    expect(persisted).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)
    expect(view.listenerCount('close')).toBe(0)
  })

  it('preserves a physical persistence failure and skips further discovery', async () => {
    const error = new Error('saveData failed')
    const outcome = api.login({ onAuthUpdate: async () => { throw error } }).catch((error: unknown) => error)
    expect(await finish(outcome)).toBe(error)
    expect(fetchMock.called(PORTAL)).toBe(false)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('persists verified auth before portal discovery fails', async () => {
    portalResponse.mockImplementation(async () => await new Promise(() => {}))
    const persisted = jest.fn(async () => {})
    const outcome = api.login({ onAuthUpdate: persisted }).catch((error: unknown) => error)
    await flush()
    expect(persisted).toHaveBeenCalledTimes(1)
    await flush(15000)
    expect(await finish(outcome)).toBeInstanceOf(Error)
    expect(persisted.mock.calls[0]).toEqual([expect.objectContaining({ cookieHeader: nativeCookies })])
  })

  it.each([false, true])('reports cleanup failures without replacing a prior failure (%s)', async priorFailure => {
    const cleanup = new Error('native close failed')
    const initial = new Error('native navigation failed')
    close.mockRejectedValue(cleanup)
    if (priorFailure) goto.mockRejectedValue(initial)
    const outcome = api.login().catch((error: unknown) => error)
    expect(await finish(outcome)).toBe(priorFailure ? initial : cleanup)
    expect(close).toHaveBeenCalledTimes(2)
    expect(view.listenerCount('close')).toBe(0)
  })

  it('does not log cookie values or auth-bearing navigation queries', async () => {
    goto.mockImplementation(async () => {
      nativeCookies = 'SMSESSION=SECRET_SESSION; XSRF-TOKEN=SECRET_XSRF'
      pageUrl = PORTAL
      await view.navigationPolicy?.({ url: PORTAL + '?token=SECRET_QUERY', method: 'GET', headers: { cookie: nativeCookies }, source: 'webView' })
    })
    await finish(api.login())
    expect(debug).toHaveBeenCalled()
    const logs = JSON.stringify(debug.mock.calls.concat(jest.mocked(console.log).mock.calls, jest.mocked(console.warn).mock.calls))
    expect(logs).not.toMatch(/SECRET_SESSION|SECRET_XSRF|SECRET_QUERY/)
  })
})
