import type { WebViewConstructor, WebViewGotoOptions, WebViewNavigationPolicy, WebViewOptions } from './webView'
import fetchCookie from 'fetch-cookie'

const originalZenMoney = global.ZenMoney
const originalFetch = global.fetch
const OriginalHeaders = global.Headers
const constructWebView = jest.fn()
const nativeFetch = jest.fn(async (url: string, options?: unknown) => ({
  url,
  status: 200,
  headers: new OriginalHeaders()
}))
const nativeOpenWebView = jest.fn()
const nativeGoto = jest.fn(async (url: string, options?: unknown) => {})
const getWebViewCookieString = jest.fn(async () => 'model=one')
const setWebViewCookie = jest.fn(async () => {})

class NativeWebView {
  static readonly package = Object.freeze({ name: 'model.webview', version: null, build: 1 })
  static readonly NavigationAction = Object.freeze({ LOAD: undefined, BLOCK: true, OPEN_EXTERNAL: 2 })
  readonly cookieJar = { getCookieString: getWebViewCookieString, setCookie: setWebViewCookie }
  private policy: WebViewNavigationPolicy | null = null

  get navigationPolicy (): WebViewNavigationPolicy | null { return this.policy }
  set navigationPolicy (value: WebViewNavigationPolicy | null) { this.policy = value }

  async goto (url: string, options?: WebViewGotoOptions): Promise<void> {
    await nativeGoto(url, options)
    await this.policy?.({ url, method: 'GET', headers: new OriginalHeaders(options?.headers), source: 'webView' })
  }

  constructor (options?: WebViewOptions) {
    constructWebView(options)
  }
}

function installHost (): void {
  class HostHeaders extends OriginalHeaders {}
  global.ZenMoney = {
    Headers: HostHeaders,
    fetch: nativeFetch,
    openWebView: nativeOpenWebView,
    restoreCookies: jest.fn(),
    saveCookies: jest.fn(),
    WebView: NativeWebView
  } as unknown as typeof ZenMoney
}

// [model] Fake native entrypoints verify TLS defaults at the plugin/host boundary.
describe('[model] WebView constructor and TLS defaults', () => {
  let WebView: WebViewConstructor
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    installHost()
    jest.requireActual('../polyfills/fetch')
    WebView = jest.requireActual<typeof import('./webView')>('./webView').WebView
  })

  afterEach(() => {
    global.ZenMoney = originalZenMoney
    global.fetch = originalFetch
    global.Headers = OriginalHeaders
    jest.restoreAllMocks()
  })

  it('passes options through when no CA has been registered', () => {
    const options = Object.freeze({ userAgent: 'model', inspectable: true })
    const page = new WebView(options)
    expect(constructWebView).toHaveBeenCalledWith(options)
    expect(page).toBeInstanceOf(NativeWebView)
    expect(page).toBeInstanceOf(WebView)
  })

  it('works without loading the fetch polyfill and leaves the host constructor untouched', () => {
    jest.resetModules()
    installHost()
    const { WebView } = jest.requireActual<typeof import('./webView')>('./webView')
    const page = new WebView()
    expect(page).toBeInstanceOf(NativeWebView)
    expect(Reflect.get(ZenMoney, 'WebView')).toBe(NativeWebView)
    expect('createNavigationPolicy' in NativeWebView).toBe(false)
  })

  it('inherits accumulated global CA without modifying caller options or including client PFX', () => {
    ZenMoney.trustCertificates(['model-ca-1'])
    ZenMoney.trustCertificates(['model-ca-2'])
    // @ts-expect-error Legacy PFX registration is internal to the fetch polyfill.
    ZenMoney.setClientPfx(new Uint8Array([1]), 'example.test')
    const options = Object.freeze({ userAgent: 'model', inspectable: true })
    const page = new WebView(options)
    expect(constructWebView).toHaveBeenCalledWith({
      ...options,
      tls: { ca: ['model-ca-1', 'model-ca-2'] }
    })
    expect(options).toEqual({ userAgent: 'model', inspectable: true })
    expect(page).toBeInstanceOf(WebView)
  })

  it.each([undefined, null])('inherits global CA when options are %p', options => {
    ZenMoney.trustCertificates(['model-ca'])
    const page = Reflect.construct(WebView, [options])
    expect(constructWebView).toHaveBeenCalledWith({ tls: { ca: ['model-ca'] } })
    expect(page).toBeInstanceOf(NativeWebView)
  })

  it('keeps explicitly supplied CA and other options unchanged', () => {
    ZenMoney.trustCertificates(['model-global-ca'])
    const options = Object.freeze({
      inspectable: true,
      tls: Object.freeze({ ca: Object.freeze(['model-local-ca']) })
    })
    const page = new WebView(options)
    expect(constructWebView).toHaveBeenCalledWith(options)
    expect(constructWebView.mock.calls[0][0]).toBe(options)
    expect(page).toBeInstanceOf(NativeWebView)
  })

  it('takes a CA snapshot for each new session', () => {
    ZenMoney.trustCertificates(['model-ca-1'])
    const first = new WebView()
    ZenMoney.trustCertificates(['model-ca-2'])
    const second = new WebView()
    expect(constructWebView.mock.calls).toEqual([
      [{ tls: { ca: ['model-ca-1'] } }],
      [{ tls: { ca: ['model-ca-1', 'model-ca-2'] } }]
    ])
    expect(first).not.toBe(second)
  })

  it.each([{}, { ca: [] }])('treats explicit TLS options %p as an override', tls => {
    ZenMoney.trustCertificates(['model-global-ca'])
    const options = Object.freeze({ tls })
    const page = new WebView(options)
    expect(constructWebView.mock.calls[0][0]).toBe(options)
    expect(page).toBeInstanceOf(NativeWebView)
  })

  it.each(['invalid', [], { tls: null }])('passes input %p through for native validation', options => {
    ZenMoney.trustCertificates(['model-global-ca'])
    Reflect.construct(WebView, [options])
    expect(constructWebView.mock.calls[0][0]).toBe(options)
  })

  it('preserves constructor metadata and subclass construction', () => {
    expect(WebView.package).toBe(NativeWebView.package)
    expect(WebView.NavigationAction).toBe(NativeWebView.NavigationAction)
    class PluginWebView extends WebView {}
    const page = new PluginWebView()
    expect(page).toBeInstanceOf(PluginWebView)
    expect(page).toBeInstanceOf(NativeWebView)
  })

  it('logs goto through the policy and preserves native navigation options', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const page = new WebView()
    await page.goto('https://example.test', { waitUntil: 'commit' })
    expect(nativeGoto).toHaveBeenCalledWith('https://example.test', { waitUntil: 'commit' })
    expect(debug).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledWith('request', expect.objectContaining({ url: 'https://example.test', source: 'webView' }))
  })

  it('exposes the policy factory on the WebView constructor', () => {
    const handler = jest.fn(() => WebView.NavigationAction.BLOCK)
    const policy = WebView.createNavigationPolicy(handler, { log: false })
    const page = new WebView()
    page.navigationPolicy = policy
    const navigation = {
      url: 'https://example.test',
      method: 'GET',
      headers: {},
      source: 'webView' as const
    }
    expect(page.navigationPolicy(navigation)).toBe(true)
    expect(handler).toHaveBeenCalledWith(navigation)
    expect('createNavigationPolicy' in WebView).toBe(true)
    expect('createNavigationPolicy' in NativeWebView).toBe(false)
    expect(Reflect.get(ZenMoney, 'WebView')).toBe(NativeWebView)
    class PluginWebView extends WebView {}
    expect(PluginWebView.createNavigationPolicy).toBe(WebView.createNavigationPolicy)
  })

  it('propagates native constructor failures unchanged', () => {
    const error = new Error('Model native initialization failure')
    constructWebView.mockImplementationOnce(() => { throw error })
    expect(() => new WebView()).toThrow(error)
  })

  it('preserves CA and PFX defaults for fetch and legacy openWebView', async () => {
    const pfx = new Uint8Array([1])
    ZenMoney.trustCertificates(['model-ca'])
    // @ts-expect-error Legacy PFX registration is internal to the fetch polyfill.
    ZenMoney.setClientPfx(pfx, 'example.test')
    await global.fetch('https://example.test', { credentials: 'omit' })
    const tls = { ca: ['model-ca'], pfx: [pfx] }
    expect(nativeFetch).toHaveBeenCalledWith('https://example.test', expect.objectContaining({ tls }))
    const callback = jest.fn()
    // @ts-expect-error The host's legacy entrypoint is intentionally hidden from public types.
    ZenMoney.openWebView('https://example.test', null, null, callback)
    expect(nativeOpenWebView).toHaveBeenCalledWith('https://example.test', null, null, callback, { tls })
  })

  it('shares public certificate registration with HTTP and modern WebView defaults', async () => {
    const { addTrustedCertificates } = jest.requireActual<typeof import('./network/tls')>('./network/tls')
    expect(ZenMoney.trustCertificates).toBe(addTrustedCertificates)
    await addTrustedCertificates(Object.freeze(['model-public-ca']))
    ZenMoney.trustCertificates(['model-legacy-ca'])
    const page = new WebView()
    expect(page).toBeInstanceOf(NativeWebView)
    expect(constructWebView).toHaveBeenCalledWith({ tls: { ca: ['model-public-ca', 'model-legacy-ca'] } })
    await global.fetch('https://example.test', { credentials: 'omit' })
    expect(nativeFetch).toHaveBeenCalledWith('https://example.test', expect.objectContaining({
      tls: { ca: ['model-public-ca', 'model-legacy-ca'], pfx: [] }
    }))
  })

  it('does not introduce WebView on hosts without a native constructor', () => {
    jest.resetModules()
    installHost()
    Reflect.deleteProperty(global.ZenMoney, 'WebView')
    jest.requireActual('../polyfills/fetch')
    WebView = jest.requireActual<typeof import('./webView')>('./webView').WebView
    expect('WebView' in ZenMoney).toBe(false)
    const { IncompatibleVersionError } = jest.requireActual<typeof import('../errors')>('../errors')
    expect(() => new WebView()).toThrow(IncompatibleVersionError)
  })

  it('uses the WebView cookie jar directly with fetch-cookie', async () => {
    const page = new WebView()
    const fetch = fetchCookie(nativeFetch, page.cookieJar)
    nativeFetch.mockResolvedValueOnce({
      url: 'https://example.test',
      status: 200,
      headers: new OriginalHeaders({ 'set-cookie': 'model=two; Path=/' })
    })
    await fetch('https://example.test')
    expect(fetch.cookieJar).toBe(page.cookieJar)
    expect(getWebViewCookieString).toHaveBeenCalledWith('https://example.test')
    expect(nativeFetch).toHaveBeenCalledWith('https://example.test', expect.objectContaining({ headers: { cookie: 'model=one' } }))
    expect(setWebViewCookie).toHaveBeenCalledWith('model=two; Path=/', 'https://example.test', { ignoreError: true })
  })
})
