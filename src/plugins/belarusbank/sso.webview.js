export default function installAuthCapture ({ origin, bridgeName }) {
  if (window.location.origin !== origin || window.top !== window) return
  // Android can install its rejection tracker after the bank's Zone.js and replace Promise.
  // WebView already dispatches browser rejection events; skip this native polyfill on the bank page.
  window.__appZenmoneyPromiseRejectionTrackingInstalled = true
  const bridge = window[bridgeName]
  const isLoginResponse = (url) => {
    const parsed = new URL(url, window.location.href)
    return parsed.origin === origin && /^\/ibanking\/users\/auth\/login(?:\/[^/]+)?$/.test(parsed.pathname) &&
      !parsed.pathname.endsWith('/preparation')
  }
  const complete = (url, status, body) => {
    if (status < 200 || status >= 300 || !isLoginResponse(url)) return
    const data = body != null && typeof body === 'object' ? body : {}
    bridge({ sessionToken: data.sessionToken ?? data.token, refreshToken: data.refreshToken, tokenType: data.tokenType })
  }
  const originalSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', () => {
      const url = this.responseURL
      if (!isLoginResponse(url) || this.status < 200 || this.status >= 300) return
      let body
      try {
        body = this.responseType === 'json' ? this.response : JSON.parse(this.responseText)
      } catch {
        // A successful but malformed response must fail token validation in the plugin.
        body = null
      }
      complete(url, this.status, body)
    }, { once: true })
    originalSend.apply(this, args)
  }
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const response = await originalFetch.apply(window, args)
    if (response.ok && isLoginResponse(response.url)) {
      const body = await response.clone().json().catch(() => null)
      complete(response.url, response.status, body)
    }
    return response
  }
}
/* global XMLHttpRequest */
