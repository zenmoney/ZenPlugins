import fetchMock from 'fetch-mock'
import { cookieJar, fetch } from '../../../common/network'

const { installNetworkCapture } = jest.requireActual<{
  installNetworkCapture: (options: {
    transport: { enqueue: (type: string, payload: unknown) => void }
    config: { enabled: boolean, maxBodyBytes: number }
  }) => void
}>('../captureNetwork')

// [model] Bootloader capture must retain the hosted fetch polyfill's shared cookie jar.
describe('[model] Bootloader shared cookie jar', () => {
  const originalFetch = global.fetch
  const originalZenMoney = global.ZenMoney
  const OriginalHeaders = global.Headers
  const url = 'https://example.test/model'

  beforeEach(() => {
    jest.resetModules()
    fetchMock.get(url, { body: 'model response', headers: { 'set-cookie': 'session=two; Path=/' } })
    class HostHeaders extends OriginalHeaders {}
    global.ZenMoney = {
      fetch: global.fetch,
      Headers: HostHeaders,
      openWebView: jest.fn(),
      saveCookies: jest.fn(),
      restoreCookies: jest.fn()
    } as unknown as typeof ZenMoney
    jest.requireActual('../../../polyfills/fetch')
  })

  afterEach(() => {
    fetchMock.restore()
    global.fetch = originalFetch
    global.ZenMoney = originalZenMoney
    global.Headers = OriginalHeaders
  })

  it.each([true, false])('preserves cookie access and HTTP round trips (capture: %p)', async enabled => {
    const jarDescriptor = Object.getOwnPropertyDescriptor(global.fetch, 'cookieJar')
    await cookieJar.setCookie('session=one; Path=/', url)
    const enqueue = jest.fn()
    installNetworkCapture({ transport: { enqueue }, config: { enabled, maxBodyBytes: 1024 } })
    expect(await cookieJar.getCookieString(url)).toBe('session=one')
    expect(Object.getOwnPropertyDescriptor(global.fetch, 'cookieJar')).toEqual(jarDescriptor)
    expect((await fetch(url, { log: false })).body).toBe('model response')
    const headers = new OriginalHeaders(fetchMock.lastOptions(url)?.headers as HeadersInit)
    expect(headers.get('cookie')).toBe('session=one')
    expect(await cookieJar.getCookieString(url)).toBe('session=two')
    expect(await ZenMoney.getCookies()).toEqual([expect.objectContaining({ name: 'session', value: 'two' })])
    expect(enqueue.mock.calls.map(call => call[0])).toEqual(enabled
      ? ['network:request', 'network:response', 'network:response-body']
      : [])
    await cookieJar.removeAllCookies()
    expect(await ZenMoney.getCookies()).toEqual([])
  })
})
