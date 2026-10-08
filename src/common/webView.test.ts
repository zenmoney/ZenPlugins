import { createNavigationPolicy, wrapWebView } from './webView'
import type { WebViewInstance, WebViewNavigation, WebViewNavigationPolicy } from './webView'

// [model] Native navigation dispatch, including goto, owns request logging.
describe('[model] WebView request logging', () => {
  const url = 'https://example.test/login?token=model-secret&requestId=model-id'
  const headers = { Authorization: 'Bearer model-secret', Cookie: 'sid=model-cookie', 'Set-Cookie': 'sid=model-cookie', 'X-Request-ID': 'trace-7' }
  const sanitizeRequestLog = {
    url: { query: { token: true } },
    headers: { authorization: true, cookie: true, 'set-cookie': true }
  }
  const navigation: WebViewNavigation = { url, method: 'POST', headers, source: 'externalRedirect' }
  let debug: jest.SpyInstance

  beforeEach(() => {
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function makeWebView (): {
    webView: WebViewInstance
    nativeGoto: jest.Mock<Promise<void>, []>
    dispatch: (navigation: WebViewNavigation) => ReturnType<WebViewNavigationPolicy>
  } {
    let policy: WebViewNavigationPolicy | null = null
    const native = {
      get navigationPolicy () { return policy },
      set navigationPolicy (value: WebViewNavigationPolicy | null) {
        if (value !== null && typeof value !== 'function') throw new TypeError('Invalid policy')
        policy = value
      },
      goto: jest.fn(async () => { await policy?.({ ...navigation, method: 'GET', source: 'webView' }) })
    }
    const nativeGoto = native.goto
    return { webView: wrapWebView(native as unknown as WebViewInstance), nativeGoto, dispatch: (navigation: WebViewNavigation): ReturnType<WebViewNavigationPolicy> => policy?.(navigation) }
  }

  function expectMaskedRequest (method: string, source: string): void {
    expect(debug).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledWith('request', {
      id: expect.any(String),
      url: 'https://example.test/login?token=<string[12]>&requestId=model-id',
      method,
      source,
      headers: {
        Authorization: '<string[19]>',
        Cookie: '<string[16]>',
        'Set-Cookie': '<string[16]>',
        'X-Request-ID': 'trace-7'
      }
    })
    const output = JSON.stringify(debug.mock.calls)
    expect(output).not.toContain('model-secret')
    expect(output).not.toContain('model-cookie')
    expect(output).toContain('model-id')
    expect(output).toContain('trace-7')
  }

  it('installs a default LOAD policy and logs headers without implicit masks', () => {
    const { dispatch } = makeWebView()
    expect(dispatch(navigation)).toBeUndefined()
    expect(debug).toHaveBeenCalledWith('request', {
      ...navigation,
      id: expect.any(String),
      headers
    })
  })

  it('logs goto only through native policy dispatch and preserves its options', async () => {
    const { webView, nativeGoto } = makeWebView()
    webView.navigationPolicy = createNavigationPolicy(() => undefined, { sanitizeRequestLog })
    const options = Object.freeze({ headers, waitUntil: 'commit' as const, timeout: 0 })
    await webView.goto(url, options)
    expectMaskedRequest('GET', 'webView')
    expect(nativeGoto).toHaveBeenCalledWith(url, options)
    expect(nativeGoto.mock.instances[0]).toBe(webView)
  })

  it('wraps plain and logged handlers once and restores logging after null', () => {
    const { webView, dispatch } = makeWebView()
    const raw = jest.fn(() => true as const)
    webView.navigationPolicy = raw
    expect(dispatch(navigation)).toBe(true)
    expect(raw).toHaveBeenCalledWith(navigation)
    expect(debug).toHaveBeenCalledTimes(1)
    const policy = createNavigationPolicy(raw, { sanitizeRequestLog })
    webView.navigationPolicy = policy
    debug.mockClear()
    void dispatch(navigation)
    expectMaskedRequest('POST', 'externalRedirect')
    webView.navigationPolicy = null
    debug.mockClear()
    expect(dispatch(navigation)).toBeUndefined()
    expect(debug).toHaveBeenCalledTimes(1)
  })

  it('does not stack goto wrappers when wrapping a view again', () => {
    const { webView } = makeWebView()
    const goto = webView.goto
    wrapWebView(webView)
    expect(webView.goto).toBe(goto)
    expect(() => Reflect.set(webView, 'navigationPolicy', false)).toThrow('Invalid policy')
  })

  it.each([false, true])('preserves native navigation headers with logging disabled (wrapped: %p)', wrapped => {
    const handler = jest.fn(() => undefined)
    const policy = createNavigationPolicy(handler, { log: false })
    const { webView, dispatch } = makeWebView()
    webView.navigationPolicy = policy
    const nativeHeaders = Object.freeze({ xTraceId: '  trace-7  ', XTraceId: 'trace-8' })
    const nativeNavigation = { ...navigation, headers: nativeHeaders }
    void (wrapped ? dispatch : policy)(nativeNavigation as unknown as WebViewNavigation)
    const received = handler.mock.calls[0] as unknown as [WebViewNavigation]
    expect(received[0].headers).toBe(nativeHeaders)
    expect(nativeNavigation.headers).toBe(nativeHeaders)
    expect(debug).not.toHaveBeenCalled()
  })

  it('merges goto masks with policy masks without mutating either and restores the policy after completion', async () => {
    const { webView, nativeGoto, dispatch } = makeWebView()
    const base = Object.freeze({ sanitizeRequestLog })
    webView.navigationPolicy = createNavigationPolicy(() => undefined, base)
    const localMask = Object.freeze({ url: Object.freeze({ query: Object.freeze({ requestId: true }) }) })
    const options = Object.freeze({ headers, sanitizeRequestLog: localMask, waitUntil: 'commit' as const })
    await webView.goto(url, options)
    expect(nativeGoto).toHaveBeenCalledWith(url, { headers, waitUntil: 'commit' })
    const output = JSON.stringify(debug.mock.calls)
    expect(output).not.toContain('model-secret')
    expect(output).not.toContain('model-cookie')
    expect(output).not.toContain('model-id')
    expect(output).toContain('trace-7')
    expect(localMask).toEqual({ url: { query: { requestId: true } } })
    expect(base.sanitizeRequestLog).toEqual(sanitizeRequestLog)
    debug.mockClear()
    void dispatch(navigation)
    expectMaskedRequest('POST', 'externalRedirect')
  })

  it('lets explicit goto values override policy settings without affecting later calls', async () => {
    const { webView } = makeWebView()
    webView.navigationPolicy = createNavigationPolicy(() => undefined, { log: false, sanitizeRequestLog })
    await webView.goto(url, { log: true, sanitizeRequestLog: { headers: { 'x-request-id': true } } })
    expect(debug).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(debug.mock.calls)).not.toContain('trace-7')
    debug.mockClear()
    await webView.goto(url)
    expect(debug).not.toHaveBeenCalled()
    webView.navigationPolicy = createNavigationPolicy(() => undefined, {
      sanitizeRequestLog: { ...sanitizeRequestLog, headers: { ...sanitizeRequestLog.headers, 'x-request-id': true } }
    })
    await webView.goto(url, { log: false, sanitizeRequestLog: () => { throw new Error('Disabled mask must not run') } })
    expect(debug).not.toHaveBeenCalled()
    await webView.goto(url, { sanitizeRequestLog: { url: { query: { requestId: true } }, headers: { 'x-request-id': false } } })
    expect(JSON.stringify(debug.mock.calls)).toContain('trace-7')
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-secret')
  })

  it.each([true, false])('keeps only the latest goto scope when the older call settles first: %p', async olderFirst => {
    const { webView, nativeGoto, dispatch } = makeWebView()
    webView.navigationPolicy = createNavigationPolicy(() => undefined, { sanitizeRequestLog })
    let finishFirst!: () => void
    let finishSecond!: () => void
    nativeGoto.mockImplementationOnce(async () => await new Promise<void>(resolve => { finishFirst = resolve }))
    nativeGoto.mockImplementationOnce(async () => await new Promise<void>(resolve => { finishSecond = resolve }))
    const first = webView.goto(url, { log: false })
    const second = webView.goto(url, { sanitizeRequestLog: { url: { query: { requestId: true } } } })
    if (olderFirst) {
      finishFirst()
      await first
      void dispatch(navigation)
      expect(debug).toHaveBeenCalledTimes(1)
      expect(JSON.stringify(debug.mock.calls)).not.toContain('model-id')
      debug.mockClear()
    }
    finishSecond()
    await second
    void dispatch(navigation)
    expectMaskedRequest('POST', 'externalRedirect')
    if (!olderFirst) {
      finishFirst()
      await first
      debug.mockClear()
      void dispatch(navigation)
      expectMaskedRequest('POST', 'externalRedirect')
    }
  })

  it('isolates goto options when two views share the same policy', async () => {
    const first = makeWebView()
    const second = makeWebView()
    const policy = createNavigationPolicy(() => undefined, { sanitizeRequestLog })
    first.webView.navigationPolicy = policy
    second.webView.navigationPolicy = policy
    let finish!: () => void
    first.nativeGoto.mockImplementationOnce(async () => await new Promise<void>(resolve => { finish = resolve }))
    const loading = first.webView.goto(url, { log: false })
    void first.dispatch(navigation)
    expect(debug).not.toHaveBeenCalled()
    await second.webView.goto(url)
    expectMaskedRequest('GET', 'webView')
    finish()
    await loading
  })

  it.each([true, false])('restores policy options after a synchronous goto failure: %p', async synchronous => {
    const { webView, nativeGoto, dispatch } = makeWebView()
    const error = new Error('Model goto failed')
    webView.navigationPolicy = createNavigationPolicy(() => undefined, { sanitizeRequestLog })
    if (synchronous) nativeGoto.mockImplementationOnce((): never => { throw error })
    else nativeGoto.mockRejectedValueOnce(error)
    await expect(webView.goto(url, { log: false })).rejects.toBe(error)
    void dispatch(navigation)
    expectMaskedRequest('POST', 'externalRedirect')
  })

  it('updates default logging options without stacking wrappers', () => {
    const { webView, dispatch } = makeWebView()
    expect(wrapWebView(webView, { sanitizeRequestLog })).toBe(webView)
    wrapWebView(webView)
    void dispatch(navigation)
    expectMaskedRequest('POST', 'externalRedirect')
  })

  it('does not log or evaluate masks when logging is disabled', async () => {
    const { webView } = makeWebView()
    const mask = jest.fn()
    webView.navigationPolicy = createNavigationPolicy(() => undefined, { log: false, sanitizeRequestLog: mask })
    await webView.goto(url)
    expect(debug).not.toHaveBeenCalled()
    expect(mask).not.toHaveBeenCalled()
  })

  it('does not fall back to raw logging when a mask throws', async () => {
    const { webView } = makeWebView()
    const handler = jest.fn()
    const error = new Error('Model mask failure')
    webView.navigationPolicy = createNavigationPolicy(handler, { sanitizeRequestLog: () => { throw error } })
    await expect(webView.goto(url)).rejects.toBe(error)
    expect(handler).not.toHaveBeenCalled()
    expect(debug).not.toHaveBeenCalled()
  })

  it.each([undefined, true, 2] as const)('preserves policy result %p and its unmodified input', action => {
    const handler = jest.fn(() => action)
    const policy = createNavigationPolicy(handler, { sanitizeRequestLog })
    expect(policy(navigation)).toBe(action)
    expectMaskedRequest('POST', 'externalRedirect')
    expect(handler).toHaveBeenCalledWith(navigation)
    expect(navigation.headers).toBe(headers)
  })

  it('preserves the policy promise', async () => {
    const handler = jest.fn(async () => 2 as const)
    const policy = createNavigationPolicy(handler, { log: false })
    const result = policy(navigation)
    expect(result).toBe(handler.mock.results[0].value)
    await expect(result).resolves.toBe(2)
  })

  it('propagates synchronous and asynchronous policy failures', async () => {
    const error = new Error('Model policy failure')
    const sync = createNavigationPolicy(() => { throw error }, { log: false })
    const rejected = createNavigationPolicy(async (): Promise<never> => { throw error }, { log: false })
    expect((): ReturnType<typeof sync> => sync(navigation)).toThrow(error)
    await expect(rejected(navigation)).rejects.toBe(error)
  })
})
