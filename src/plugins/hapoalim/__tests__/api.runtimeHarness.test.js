/* eslint-disable @typescript-eslint/no-var-requires */

describe('hapoalim api runtime harness', () => {
  let login
  let fetchMock
  let fetchJsonMock
  let consoleSpies

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    consoleSpies = ['debug', 'info', 'log', 'warn', 'error'].map(method =>
      jest.spyOn(console, method).mockImplementation(() => {})
    )

    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
      headers: {},
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })
    fetchJsonMock = jest.fn().mockResolvedValue({
      status: 200,
      url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
      headers: {},
      body: [{ accountNumber: '1' }, { accountNumber: '2' }]
    })

    jest.doMock('../../../common/network', () => {
      const actual = jest.requireActual('../../../common/network')
      return {
        ...actual,
        fetch: fetchMock,
        fetchJson: fetchJsonMock,
        ParseError: class ParseError extends Error {}
      }
    })
  })

  afterEach(() => {
    for (const spy of consoleSpies) {
      spy.mockRestore()
    }
  })

  it('closes the configured WebView from cookie-jar polling through the actual network helper', async () => {
    const originalSetTimeout = global.setTimeout
    const originalClearTimeout = global.clearTimeout
    const scheduledCallbacks = []
    let cookieJarReads = 0

    global.setTimeout = jest.fn((callback) => {
      scheduledCallbacks.push(callback)
      return scheduledCallbacks.length
    })
    global.clearTimeout = jest.fn()

    global.ZenMoney = {
      features: {
        webViewConfiguration: true
      },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete, options) => {
        const webView = {
          cookieJar: {
            getCookieString: jest.fn(async (cookieUrl) => {
              if (cookieUrl.includes('/ServerServices/general/accounts')) {
                cookieJarReads++
                return cookieJarReads >= 2
                  ? 'TS=poll-ts; XSRF-TOKEN=poll-xsrf'
                  : ''
              }
              return ''
            })
          }
        }

        Promise.resolve(options.configure(webView))
          .then(async () => {
            const mode = await onRequest({
              url: 'https://static.example.com/challenge',
              headers: {}
            }, (error, result) => onComplete(error, result))
            expect(mode).toBeUndefined()
          })
          .catch(error => onComplete(error))
      })
    }

    login = require('../api').login

    try {
      const authPromise = login()

      expect(scheduledCallbacks).toHaveLength(1)
      await scheduledCallbacks.shift()()
      expect(scheduledCallbacks).toHaveLength(1)
      await scheduledCallbacks.shift()()

      const auth = await authPromise
      expect(fetchJsonMock).toHaveBeenCalled()
      expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
      expect(auth.cookieHeader).toContain('TS=poll-ts')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=poll-xsrf')
      expect(auth.restContext).toBe('pib')
    } finally {
      global.setTimeout = originalSetTimeout
      global.clearTimeout = originalClearTimeout
    }
  })

  it('recovers configured WebView auth after native close when the cookie jar was already captured', async () => {
    global.ZenMoney = {
      features: {
        webViewConfiguration: true
      },
      getCookies: jest.fn().mockResolvedValue([]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete, options) => {
        const webView = {
          cookieJar: {
            getCookieString: jest.fn(async (cookieUrl) => {
              if (cookieUrl.includes('/portalserver/HomePage')) {
                return 'TS=jar-ts; XSRF-TOKEN=jar-xsrf'
              }
              return ''
            })
          }
        }

        Promise.resolve(options.configure(webView))
          .then(async () => {
            await onRequest({
              url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
              headers: {}
            }, () => {})
            onComplete(new Error('WebView closed'))
          })
          .catch(error => onComplete(error))
      })
    }

    login = require('../api').login

    const auth = await login()

    expect(global.ZenMoney.getCookies).not.toHaveBeenCalled()
    expect(fetchJsonMock).toHaveBeenCalled()
    expect(auth.cookieHeader).toContain('TS=jar-ts')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=jar-xsrf')
    expect(auth.restContext).toBe('pib')
  })

  it('keeps the legacy cookie-store recovery path for older app versions', async () => {
    const originalSetTimeout = global.setTimeout

    global.setTimeout = jest.fn((callback) => {
      callback()
      return 1
    })

    global.ZenMoney = {
      features: {},
      getCookies: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'closed-session' },
          { domain: '.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'closed-xsrf' }
        ]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete) => {
        onComplete(new Error('WebView closed'))
      })
    }

    login = require('../api').login

    try {
      const auth = await login()

      expect(global.ZenMoney.saveCookies).toHaveBeenCalled()
      expect(global.ZenMoney.getCookies).toHaveBeenCalledTimes(3)
      expect(fetchJsonMock).toHaveBeenCalled()
      expect(auth.cookieHeader).toContain('SMSESSION=closed-session')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=closed-xsrf')
      expect(auth.restContext).toBe('pib')
    } finally {
      global.setTimeout = originalSetTimeout
    }
  })
})
