/* eslint-disable @typescript-eslint/no-var-requires */

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

    openWebViewAndInterceptRequestMock = jest.fn(async ({ url, intercept }) => {
      expect(url).toBe('https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage')

      const apiRequestResult = intercept({
        url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
        headers: {
          cookie: 'TS=api-cookie; XSRF-TOKEN=api-xsrf'
        }
      })
      expect(apiRequestResult).toBeNull()

      return await new Promise((resolve, reject) => {
        const portalRequestResult = intercept.call({
          close: (error, closeResult) => error ? reject(error) : resolve(closeResult)
        }, {
          url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
          headers: {
            cookie: 'TS=portal-cookie; SMSESSION=portal-session; XSRF-TOKEN=portal-xsrf'
          }
        })

        expect(portalRequestResult).toBeNull()
      })
    })

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

    global.ZenMoney = {
      openWebView: jest.fn(),
      getCookies: jest.fn().mockResolvedValue([])
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

  it('waits for an authenticated portal request, restores rest context and refreshes cookies from response headers', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
      headers: {
        'set-cookie': 'TS=rotated-cookie; Path=/, XSRF-TOKEN=rotated-xsrf; Path=/'
      },
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })

    const auth = await login()

    expect(openWebViewAndInterceptRequestMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://login.bankhapoalim.co.il/portalserver/HomePage',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Cookie: expect.stringContaining('TS=portal-cookie')
        })
      })
    )
    expect(auth).toMatchObject({
      xsrfToken: 'rotated-xsrf',
      restContext: 'pib'
    })
    expect(auth.cookieHeader).toContain('TS=rotated-cookie')
    expect(auth.cookieHeader).toContain('SMSESSION=portal-session')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=rotated-xsrf')
  })

  it('completes web login from ZenMoney cookie store when intercepted request has no cookie header', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'store-session' },
      { domain: 'login.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'store-xsrf' },
      { domain: 'example.com', name: 'ignored', value: 'ignored' }
    ])
    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ intercept }) => {
      return await new Promise((resolve, reject) => {
        const result = intercept.call({
          close: (error, closeResult) => error ? reject(error) : resolve(closeResult)
        }, {
          url: 'https://login.bankhapoalim.co.il/ng-portals/rb/he/homepage',
          headers: {}
        })

        if (result) {
          resolve(result)
        }
      })
    })

    const auth = await login()

    expect(global.ZenMoney.getCookies).toHaveBeenCalled()
    expect(auth).toMatchObject({
      xsrfToken: 'store-xsrf',
      restContext: 'pib'
    })
    expect(auth.cookieHeader).toContain('SMSESSION=store-session')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=store-xsrf')
    expect(auth.cookieHeader).not.toContain('ignored=ignored')
  })

  it('recovers web login from ZenMoney cookie store after the WebView is closed', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'closed-session' },
      { domain: '.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'closed-xsrf' }
    ])
    openWebViewAndInterceptRequestMock.mockRejectedValueOnce(new Error('WebView closed'))

    const auth = await login()

    expect(global.ZenMoney.getCookies).toHaveBeenCalled()
    expect(auth).toMatchObject({
      xsrfToken: 'closed-xsrf',
      restContext: 'pib'
    })
    expect(auth.cookieHeader).toContain('SMSESSION=closed-session')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=closed-xsrf')
  })

  it('closes web login from cookie store polling without a success url', async () => {
    const originalSetTimeout = global.setTimeout
    const originalClearTimeout = global.clearTimeout
    const scheduledCallbacks = []
    global.setTimeout = jest.fn((callback) => {
      scheduledCallbacks.push(callback)
      return scheduledCallbacks.length
    })
    global.clearTimeout = jest.fn()

    global.ZenMoney.getCookies
      .mockResolvedValueOnce([
        { domain: '.bankhapoalim.co.il', name: 'visid_incap_2405249', value: 'anti-bot' }
      ])
      .mockResolvedValueOnce([
        { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'poll-session' },
        { domain: '.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'poll-xsrf' }
      ])

    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ intercept }) => {
      return await new Promise((resolve, reject) => {
        const result = intercept.call({
          close: (error, closeResult) => error ? reject(error) : resolve(closeResult)
        }, {
          url: 'https://login.bankhapoalim.co.il/ng-portals/auth/he/',
          headers: {}
        })

        if (result) {
          resolve(result)
        }
      })
    })

    try {
      const authPromise = login()

      expect(scheduledCallbacks).toHaveLength(1)
      await scheduledCallbacks.shift()()
      expect(scheduledCallbacks).toHaveLength(1)
      await scheduledCallbacks.shift()()

      const auth = await authPromise
      expect(auth).toMatchObject({
        xsrfToken: 'poll-xsrf',
        restContext: 'pib'
      })
      expect(auth.cookieHeader).toContain('SMSESSION=poll-session')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=poll-xsrf')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      global.setTimeout = originalSetTimeout
      global.clearTimeout = originalClearTimeout
    }
  })

  it('does not recover web login from unauthenticated anti-bot cookies only', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { domain: '.bankhapoalim.co.il', name: 'visid_incap_2405249', value: 'anti-bot' },
      { domain: '.bankhapoalim.co.il', name: 'incap_ses_3302_2405249', value: 'anti-bot' }
    ])
    openWebViewAndInterceptRequestMock.mockRejectedValueOnce(new Error('WebView closed'))

    await expect(login()).rejects.toMatchObject({
      message: 'Could not complete Bank Hapoalim web login. Finish the bank login in the opened page and retry sync.'
    })

    expect(global.ZenMoney.getCookies).toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not recover web login from session cookies until accounts access is verified', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([
      { domain: '.bankhapoalim.co.il', name: 'SMSESSION', value: 'stale-session' },
      { domain: '.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'stale-xsrf' }
    ])
    fetchJsonMock.mockResolvedValue({
      status: 403,
      url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
      headers: {},
      body: { error: { errCode: 'STEPUPOTP' } }
    })
    openWebViewAndInterceptRequestMock.mockRejectedValueOnce(new Error('WebView closed'))

    await expect(login()).rejects.toMatchObject({
      message: 'Could not complete Bank Hapoalim web login. Finish the bank login in the opened page and retry sync.'
    })

    expect(global.ZenMoney.getCookies).toHaveBeenCalled()
    expect(fetchJsonMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not complete request-cookie login until accounts access is verified', async () => {
    global.ZenMoney.getCookies.mockResolvedValue([])
    fetchJsonMock.mockResolvedValue({
      status: 403,
      url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
      headers: {},
      body: { error: { errCode: 'STEPUPOTP' } }
    })
    openWebViewAndInterceptRequestMock.mockImplementationOnce(async ({ intercept }) => {
      const result = intercept.call({
        close: () => {
          throw new Error('WebView should not close before accounts access is verified')
        }
      }, {
        url: 'https://login.bankhapoalim.co.il/ng-portals/rb/he/homepage',
        headers: {
          cookie: 'SMSESSION=request-session; XSRF-TOKEN=request-xsrf'
        }
      })
      expect(result).toBeNull()
      await Promise.resolve()
      throw new Error('WebView still open')
    })

    await expect(login()).rejects.toMatchObject({
      message: 'Could not complete Bank Hapoalim web login. Finish the bank login in the opened page and retry sync.'
    })

    expect(fetchJsonMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
