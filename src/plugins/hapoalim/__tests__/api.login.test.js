/* eslint-disable @typescript-eslint/no-var-requires */

const WEB_LOGIN_URL = 'https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage'
const PORTAL_URL = 'https://login.bankhapoalim.co.il/portalserver/HomePage'
const ACCOUNTS_URL = 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he'
const STATIC_CHALLENGE_URL = 'https://static.example.com/challenge'

function createWebView (cookieJarByUrl = {}) {
  return {
    cookieJar: {
      getCookieString: jest.fn(async (url) => cookieJarByUrl[url] || '')
    }
  }
}

async function runInterceptSequence (intercept, requests, webView) {
  return await new Promise((resolve, reject) => {
    const close = (error, closeResult) => error ? reject(error) : resolve(closeResult)
    webView.close = close
    ;(async () => {
      for (const request of requests) {
        const result = await intercept.call({ close }, request, webView)
        if (result) {
          resolve(result)
          return
        }
      }
    })().catch(reject)
  })
}

describe('hapoalim api login', () => {
  let login
  let openWebViewAndInterceptRequestMock
  let fetchMock
  let fetchJsonMock
  let consoleSpies

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    consoleSpies = ['debug', 'info', 'log', 'warn', 'error'].map(method =>
      jest.spyOn(console, method).mockImplementation(() => {})
    )

    openWebViewAndInterceptRequestMock = jest.fn(async ({ url, configure, intercept }) => {
      expect(url).toBe(WEB_LOGIN_URL)
      let portalCookiesEnabled = false
      const webView = {
        cookieJar: {
          getCookieString: jest.fn(async (requestUrl) => {
            return portalCookiesEnabled && requestUrl === PORTAL_URL
              ? 'TS=portal-cookie; SMSESSION=portal-session; XSRF-TOKEN=portal-xsrf'
              : ''
          })
        }
      }
      if (configure) {
        await configure(webView)
      }

      return await new Promise((resolve, reject) => {
        const close = (error, closeResult) => error ? reject(error) : resolve(closeResult)
        webView.close = close
        ;(async () => {
          const apiRequestResult = await intercept.call({ close }, {
            url: ACCOUNTS_URL,
            headers: {
              cookie: 'TS=api-cookie; XSRF-TOKEN=api-xsrf'
            }
          }, webView)
          expect(apiRequestResult).toBeNull()

          portalCookiesEnabled = true

          const portalRequestResult = await intercept.call({ close }, {
            url: PORTAL_URL,
            headers: {
              cookie: 'TS=portal-cookie; SMSESSION=portal-session; XSRF-TOKEN=portal-xsrf'
            }
          }, webView)
          expect(portalRequestResult).toBeNull()
        })().catch(reject)
      })
    })

    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      url: PORTAL_URL,
      headers: {},
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })
    fetchJsonMock = jest.fn().mockResolvedValue({
      status: 200,
      url: ACCOUNTS_URL,
      headers: {},
      body: [{ accountNumber: '1' }, { accountNumber: '2' }]
    })

    global.ZenMoney = {
      features: {
        webViewConfiguration: true
      },
      openWebView: jest.fn(),
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined)
    }

    jest.doMock('../../../common/network', () => ({
      __esModule: true,
      fetch: fetchMock,
      fetchJson: fetchJsonMock,
      openWebViewAndInterceptRequest: openWebViewAndInterceptRequestMock,
      ParseError: class ParseError extends Error {}
    }))

    login = require('../api').login
  })

  afterEach(() => {
    for (const spy of consoleSpies) {
      spy.mockRestore()
    }
  })

  it('probes the authenticated portal page after configured WebView login', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      url: PORTAL_URL,
      headers: {
        'set-cookie': 'TS=rotated-cookie; Path=/, XSRF-TOKEN=rotated-xsrf; Path=/'
      },
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })

    const auth = await login()

    expect(openWebViewAndInterceptRequestMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      PORTAL_URL,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Cookie: expect.stringContaining('TS=portal-cookie')
        })
      })
    )
    expect(auth.xsrfToken).toBeTruthy()
    expect(auth.cookieHeader).toContain('SMSESSION=portal-session')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=')
  })

  it('completes configured WebView login from the WebView cookie jar when request headers are empty', async () => {
    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ configure, intercept }) => {
      const webView = createWebView({
        [PORTAL_URL]: 'SMSESSION=jar-session; XSRF-TOKEN=jar-xsrf'
      })
      if (configure) {
        await configure(webView)
      }

      return await runInterceptSequence(intercept, [
        {
          url: PORTAL_URL,
          headers: {}
        }
      ], webView)
    })

    const auth = await login()

    expect(auth).toMatchObject({
      xsrfToken: 'jar-xsrf',
      restContext: 'pib'
    })
    expect(auth.cookieHeader).toContain('SMSESSION=jar-session')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=jar-xsrf')
    expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
  })

  it('closes configured WebView login from cookie-jar polling without a success url', async () => {
    const originalSetTimeout = global.setTimeout
    const originalClearTimeout = global.clearTimeout
    const scheduledCallbacks = []

    global.setTimeout = jest.fn((callback) => {
      scheduledCallbacks.push(callback)
      return scheduledCallbacks.length
    })
    global.clearTimeout = jest.fn()

    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ configure, intercept }) => {
      const webView = createWebView({
        [ACCOUNTS_URL]: 'TS=poll-ts; XSRF-TOKEN=poll-xsrf'
      })
      if (configure) {
        await configure(webView)
      }

      return await new Promise((resolve, reject) => {
        const close = (error, closeResult) => error ? reject(error) : resolve(closeResult)
        webView.close = close
        Promise.resolve(intercept.call({ close }, {
          url: STATIC_CHALLENGE_URL,
          headers: {}
        }, webView)).catch(reject)
      })
    })

    try {
      const authPromise = login()

      expect(scheduledCallbacks).toHaveLength(1)
      await scheduledCallbacks.shift()()

      const auth = await authPromise
      expect(auth).toMatchObject({
        xsrfToken: 'poll-xsrf',
        restContext: 'pib'
      })
      expect(auth.cookieHeader).toContain('TS=poll-ts')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=poll-xsrf')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      global.setTimeout = originalSetTimeout
      global.clearTimeout = originalClearTimeout
    }
  })

  it('recovers configured WebView login after native close when auth was already captured from the cookie jar', async () => {
    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ configure, intercept }) => {
      const webView = createWebView({
        [PORTAL_URL]: 'TS=captured-ts; XSRF-TOKEN=captured-xsrf'
      })
      if (configure) {
        await configure(webView)
      }

      await intercept.call({ close: jest.fn() }, {
        url: PORTAL_URL,
        headers: {}
      }, webView)

      throw new Error('WebView closed')
    })

    const auth = await login()

    expect(auth.cookieHeader).toContain('TS=captured-ts')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=captured-xsrf')
    expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
  })

  it('retries configured WebView auth after close before falling back to the global cookie store', async () => {
    const originalSetTimeout = global.setTimeout
    global.setTimeout = jest.fn((callback) => {
      callback()
      return 1
    })

    fetchJsonMock
      .mockResolvedValueOnce({
        status: 403,
        url: ACCOUNTS_URL,
        headers: {},
        body: { error: { errCode: 'STEPUPOTP' } }
      })
      .mockResolvedValueOnce({
        status: 403,
        url: ACCOUNTS_URL,
        headers: {},
        body: { error: { errCode: 'STEPUPOTP' } }
      })
      .mockResolvedValue({
        status: 200,
        url: ACCOUNTS_URL,
        headers: {},
        body: [{ accountNumber: '1' }]
      })

    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ configure, intercept }) => {
      const webView = createWebView({
        [PORTAL_URL]: 'TS=retry-ts; XSRF-TOKEN=retry-xsrf'
      })
      if (configure) {
        await configure(webView)
      }

      await intercept.call({ close: jest.fn() }, {
        url: PORTAL_URL,
        headers: {}
      }, webView)

      throw new Error('WebView closed')
    })

    try {
      const auth = await login()

      expect(auth.cookieHeader).toContain('TS=retry-ts')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=retry-xsrf')
      expect(fetchJsonMock).toHaveBeenCalledTimes(3)
      expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
    } finally {
      global.setTimeout = originalSetTimeout
    }
  })

  it('does not accept configured WebView cookies until accounts access is verified', async () => {
    fetchJsonMock.mockResolvedValue({
      status: 403,
      url: ACCOUNTS_URL,
      headers: {},
      body: { error: { errCode: 'STEPUPOTP' } }
    })

    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ configure, intercept }) => {
      const webView = createWebView({
        [PORTAL_URL]: 'SMSESSION=request-session; XSRF-TOKEN=request-xsrf'
      })
      if (configure) {
        await configure(webView)
      }

      await intercept.call({ close: jest.fn() }, {
        url: PORTAL_URL,
        headers: {}
      }, webView)

      throw new Error('WebView still open')
    })

    await expect(login()).rejects.toMatchObject({
      message: 'Could not complete Bank Hapoalim web login. Finish the bank login in the opened page and retry sync.'
    })

    expect(fetchJsonMock).toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logs configured WebView diagnostics when login fails', async () => {
    fetchJsonMock.mockResolvedValue({
      status: 403,
      url: ACCOUNTS_URL,
      headers: {},
      body: { error: { errCode: 'STEPUPOTP' } }
    })

    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ configure, intercept }) => {
      const webView = createWebView({
        [PORTAL_URL]: 'TS=failed-ts; XSRF-TOKEN=failed-xsrf'
      })
      if (configure) {
        await configure(webView)
      }

      await intercept.call({ close: jest.fn() }, {
        url: PORTAL_URL,
        headers: {}
      }, webView)

      throw new Error('WebView closed')
    })

    await expect(login()).rejects.toMatchObject({
      message: 'Could not complete Bank Hapoalim web login. Finish the bank login in the opened page and retry sync.'
    })

    expect(console.warn).toHaveBeenCalledWith('interactive web login failed', expect.objectContaining({
      flow: 'configured-webview',
      sawAuthenticatedPortalRequest: true,
      auth: expect.objectContaining({
        cookieNames: expect.arrayContaining(['TS', 'XSRF-TOKEN'])
      }),
      error: 'WebView closed'
    }))
  })

  it('falls back to the global cookie store when configured WebView login closes before cookie-jar capture', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'store-session' },
      { domain: '.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'store-xsrf' }
    ])
    openWebViewAndInterceptRequestMock.mockRejectedValueOnce(new Error('WebView closed'))

    const auth = await login()

    expect(global.ZenMoney.getCookies).toHaveBeenCalled()
    expect(auth.cookieHeader).toContain('SMSESSION=store-session')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=store-xsrf')
  })

  it('keeps the legacy WebView path for older app versions', async () => {
    global.ZenMoney.features = {}
    global.ZenMoney.getCookies.mockResolvedValue([
      { domain: 'login.bankhapoalim.co.il', name: 'TS', value: 'legacy-ts' },
      { domain: 'login.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'legacy-xsrf' }
    ])
    openWebViewAndInterceptRequestMock.mockRejectedValueOnce(new Error('WebView closed'))

    const auth = await login()

    expect(openWebViewAndInterceptRequestMock.mock.calls[0][0]).not.toHaveProperty('configure')
    expect(auth.cookieHeader).toContain('TS=legacy-ts')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=legacy-xsrf')
  })
})
