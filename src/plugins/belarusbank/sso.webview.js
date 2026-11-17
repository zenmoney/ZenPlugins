export default function installAuthCapture ({ origin, bridgeName, device }) {
  if (window.location.origin !== origin || window.top !== window) return
  // Android can install its rejection tracker after the bank's Zone.js and replace Promise.
  // WebView already dispatches browser rejection events; skip this native polyfill on the bank page.
  window.__appZenmoneyPromiseRejectionTrackingInstalled = true
  const bridge = window[bridgeName]
  let preparation
  const preparationPath = '/ibanking/users/auth/login/preparation'
  const parseRequest = (body) => {
    if (typeof body !== 'string') return undefined
    try { return JSON.parse(body) } catch { return undefined }
  }
  const isLoginResponse = (url) => {
    const parsed = new URL(url, window.location.href)
    return parsed.origin === origin && /^\/ibanking\/users\/auth\/login(?:\/[^/]+)?$/.test(parsed.pathname) &&
      !parsed.pathname.endsWith('/preparation')
  }
  // PWA main-FUXOY5FK.js and Android 2026.8.0 main-3XFNAZ2D.js:
  // keep the bank UI/OTP, but register the device using the mobile cold protocol.
  const authUrl = (url) => {
    const parsed = new URL(url, window.location.href)
    if (parsed.origin !== origin || (parsed.pathname !== preparationPath && !isLoginResponse(url))) return undefined
    if (parsed.pathname === preparationPath && parsed.searchParams.get('loginMode') === 'CREDENTIALS') {
      parsed.searchParams.delete('loginMode')
    }
    return parsed
  }
  const mobileBody = (url, body) => {
    if (url.pathname !== preparationPath && url.pathname !== '/ibanking/users/auth/login') return body
    const request = parseRequest(body)
    if (request == null || typeof request !== 'object' || Array.isArray(request)) return body
    const { browser, browserVersion, screenResolution, biometryConfirmationSupported, ...login } = request
    return JSON.stringify({ ...login, ...device })
  }
  const complete = (url, status, body, requestBody) => {
    if (status < 200 || status >= 300) return
    const parsed = new URL(url, window.location.href)
    if (parsed.origin !== origin) return
    const data = body != null && typeof body === 'object' ? body : {}
    if (parsed.pathname === preparationPath) {
      preparation = { requestId: data.requestId, loginRequest: parseRequest(requestBody) }
      return
    }
    if (!isLoginResponse(url)) return
    const loginRequest = parsed.pathname === '/ibanking/users/auth/login'
      ? parseRequest(requestBody)
      : preparation != null && parsed.pathname === `/ibanking/users/auth/login/${encodeURIComponent(preparation.requestId)}`
        ? preparation.loginRequest
        : undefined
    bridge({
      sessionToken: data.sessionToken ?? data.token,
      refreshToken: data.refreshToken,
      tokenType: data.tokenType,
      platformType: 'mobile',
      ...(loginRequest != null ? { loginRequest } : {})
    })
  }
  const requests = new WeakMap()
  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (...args) {
    const url = authUrl(args[1])
    if (url != null) {
      requests.set(this, url)
      args[1] = url.href
    } else requests.delete(this)
    return originalOpen.apply(this, args)
  }
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (requests.has(this) && ['platform-type', 'x-device-print'].includes(name.toLowerCase())) return
    return originalSetRequestHeader.call(this, name, value)
  }
  const originalSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function (...args) {
    const url = requests.get(this)
    if (url != null) {
      originalSetRequestHeader.call(this, 'Platform-Type', 'mobile')
      args[0] = mobileBody(url, args[0])
    }
    this.addEventListener('load', () => {
      const url = this.responseURL
      const parsed = new URL(url, window.location.href)
      if (parsed.origin !== origin || (!isLoginResponse(url) && parsed.pathname !== preparationPath) || this.status < 200 || this.status >= 300) return
      let body
      try {
        body = this.responseType === 'json' ? this.response : JSON.parse(this.responseText)
      } catch {
        // A successful but malformed response must fail token validation in the plugin.
        body = null
      }
      complete(url, this.status, body, args[0])
    }, { once: true })
    originalSend.apply(this, args)
  }
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const input = args[0]
    const url = authUrl(input instanceof Request ? input.url : input)
    let requestBody = args[1]?.body
    if (url != null) {
      const request = new Request(input instanceof Request ? input : url.href, args[1])
      const headers = new Headers(request.headers)
      headers.set('Platform-Type', 'mobile')
      headers.delete('X-Device-Print')
      requestBody = request.body == null ? undefined : mobileBody(url, await request.clone().text())
      // Pass the JSON string explicitly: using Request as RequestInit turns its body into a stream.
      args = [new Request(url.href, {
        method: request.method,
        headers,
        body: requestBody,
        cache: request.cache,
        credentials: request.credentials,
        integrity: request.integrity,
        keepalive: request.keepalive,
        mode: request.mode,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        signal: request.signal
      })]
    }
    const response = await originalFetch.apply(window, args)
    const parsed = new URL(response.url, window.location.href)
    if (response.ok && parsed.origin === origin && (isLoginResponse(response.url) || parsed.pathname === preparationPath)) {
      const body = await response.clone().json().catch(() => null)
      complete(response.url, response.status, body, requestBody)
    }
    return response
  }
}
/* global XMLHttpRequest, Request, Headers */
