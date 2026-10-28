export default function installAuthCapture ({ origin, bridgeName }) {
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
      platformType: 'pwa',
      ...(loginRequest != null ? { loginRequest } : {})
    })
  }
  const originalSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function (...args) {
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
    const response = await originalFetch.apply(window, args)
    const parsed = new URL(response.url, window.location.href)
    if (response.ok && parsed.origin === origin && (isLoginResponse(response.url) || parsed.pathname === preparationPath)) {
      const body = await response.clone().json().catch(() => null)
      complete(response.url, response.status, body, args[1]?.body)
    }
    return response
  }
}
/* global XMLHttpRequest */
