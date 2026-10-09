import { openWebViewAndInterceptRequest, RequestInterceptMode } from './index'
import { IncompatibleVersionError } from '../../errors'
import { wrapWebView } from '../webView'
import type { WebViewInstance, WebViewNavigation, WebViewNavigationPolicy } from '../webView'
import type { InterceptedRequest } from './index'

// [model] The native legacy adapter configures its session before assigning a policy.
describe('[model] legacy WebView logging', () => {
  const originalZenMoney = global.ZenMoney
  const navigation: WebViewNavigation = {
    url: 'https://example.test/callback?code=model-code&requestId=trace-7',
    method: 'GET',
    headers: { Cookie: 'sid=model-cookie', Authorization: 'Bearer model-token', xTraceId: '  trace-7  ', XTraceId: 'trace-8' },
    source: 'webView'
  }
  const sanitizeRequestLog = {
    url: { query: { code: true } },
    headers: { cookie: true, authorization: true }
  }
  let interceptedAction: unknown
  let debug: jest.SpyInstance

  beforeEach(() => {
    interceptedAction = undefined
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    global.ZenMoney = originalZenMoney
    jest.restoreAllMocks()
  })

  function installHost (modern: boolean, alreadyWrapped = false): void {
    global.ZenMoney = {
      features: { webViewConfiguration: modern },
      openWebView: (
        url: string,
        headers: unknown,
        intercept: (navigation: WebViewNavigation, done: (error: unknown, result?: unknown) => void) => unknown,
        done: (error: unknown, result?: unknown) => void,
        options: { configure: (page: unknown) => Promise<void> }
      ) => {
        void (async () => {
          let policy: WebViewNavigationPolicy | null = null
          const page = modern
            ? {
                get navigationPolicy () { return policy },
                set navigationPolicy (value: WebViewNavigationPolicy | null) { policy = value }
              }
            : {}
          if (alreadyWrapped) wrapWebView(page as WebViewInstance)
          await options.configure(page)
          if (modern) {
            page.navigationPolicy = (request): ReturnType<WebViewNavigationPolicy> => intercept(request, done) as ReturnType<WebViewNavigationPolicy>
            await page.navigationPolicy(navigation)
          } else {
            interceptedAction = intercept(navigation, done)
          }
        })().catch(error => done(error))
      }
    } as unknown as typeof ZenMoney
  }

  it.each([[false, false], [true, false], [true, true]])('logs once with explicit masks (modern: %p, wrapped: %p)', async (modern, wrapped) => {
    installHost(modern, wrapped)
    const configure = jest.fn(async () => {})
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      sanitizeRequestLog,
      configure,
      intercept: () => ({ code: 'model-code' })
    })).resolves.toEqual({ code: 'model-code' })
    expect(configure).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledWith('request', {
      id: expect.any(String),
      url: 'https://example.test/callback?code=<string[10]>&requestId=trace-7',
      method: 'GET',
      headers: { Cookie: '<string[16]>', Authorization: '<string[18]>', xTraceId: '  trace-7  ', XTraceId: 'trace-8' },
      ...(modern ? { source: 'webView' } : {})
    })
    const output = JSON.stringify(debug.mock.calls)
    expect(output).not.toContain('model-code')
    expect(output).not.toContain('model-cookie')
    expect(output).not.toContain('model-token')
    expect(output).toContain('trace-7')
  })

  it.each([false, true])('honors log: false (modern: %p)', async modern => {
    installHost(modern)
    const mask = jest.fn()
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      log: false,
      sanitizeRequestLog: mask,
      intercept: () => 'complete'
    })).resolves.toBe('complete')
    expect(debug).not.toHaveBeenCalled()
    expect(mask).not.toHaveBeenCalled()
  })

  it.each([false, true])('does not add implicit masks (modern: %p)', async modern => {
    installHost(modern)
    await openWebViewAndInterceptRequest({ url: navigation.url, intercept: () => 'complete' })
    expect(debug).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledWith('request', expect.objectContaining({
      url: navigation.url,
      headers: navigation.headers
    }))
  })

  it('preserves asynchronous completion and interceptor errors', async () => {
    installHost(true)
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      log: false,
      intercept: async () => 'complete'
    })).resolves.toBe('complete')
    const error = new Error('Model interceptor failure')
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      log: false,
      intercept: async () => { throw error }
    })).rejects.toBe(error)
  })

  it('keeps legacy navigation decisions synchronous and supports explicit completion and modes', async () => {
    installHost(false)
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      log: false,
      intercept: function () {
        this.mode = RequestInterceptMode.OPEN_AS_DEEP_LINK
        this.close(null, 'complete')
      }
    })).resolves.toBe('complete')
    expect(interceptedAction).toBe(RequestInterceptMode.OPEN_AS_DEEP_LINK)
  })

  it('rejects async interception on older hosts and returns synchronous BLOCK', async () => {
    installHost(false)
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      log: false,
      intercept: async () => 'complete'
    })).rejects.toBeInstanceOf(IncompatibleVersionError)
    expect(interceptedAction).toBe(RequestInterceptMode.BLOCK)
  })

  it('propagates mask failures without logging the raw request', async () => {
    installHost(true)
    const error = new Error('Model mask failure')
    const intercept = jest.fn(() => 'complete')
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      sanitizeRequestLog: () => { throw error },
      intercept
    })).rejects.toBe(error)
    expect(intercept).not.toHaveBeenCalled()
    expect(debug).not.toHaveBeenCalled()
  })

  it('preserves legacy plain-object headers before interception when logging is disabled', async () => {
    const headers = { Authorization: 'model-token', 'X-Trace': 'trace-7' }
    global.ZenMoney = {
      openWebView: (
        url: string,
        _headers: unknown,
        intercept: (request: unknown, done: (error: unknown, result?: unknown) => void) => unknown,
        done: (error: unknown, result?: unknown) => void
      ) => intercept({ url, headers }, done)
    } as unknown as typeof ZenMoney
    let received: InterceptedRequest | undefined
    await expect(openWebViewAndInterceptRequest({
      url: navigation.url,
      log: false,
      intercept: request => { received = request; return 'complete' }
    })).resolves.toBe('complete')
    expect(received?.headers).toBe(headers)
    expect(headers).toEqual({ Authorization: 'model-token', 'X-Trace': 'trace-7' })
    expect(debug).not.toHaveBeenCalled()
  })
})
