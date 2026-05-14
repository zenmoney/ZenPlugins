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

  it('closes the WebView from cookie-store polling through the actual network helper', async () => {
    const originalSetTimeout = global.setTimeout
    const originalClearTimeout = global.clearTimeout
    const scheduledCallbacks = []

    global.setTimeout = jest.fn((callback) => {
      scheduledCallbacks.push(callback)
      return scheduledCallbacks.length
    })
    global.clearTimeout = jest.fn()

    global.ZenMoney = {
      getCookies: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { domain: 'login.bankhapoalim.co.il', name: 'TS', value: 'poll-ts' },
          { domain: 'login.bankhapoalim.co.il', name: 'XSRF-TOKEN', value: 'poll-xsrf' }
        ]),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      openWebView: jest.fn((url, headers, onRequest, onComplete) => {
        const mode = onRequest({
          url: 'https://static.example.com/challenge',
          headers: {}
        }, (error, result) => onComplete(error, result))
        expect(mode).toBeUndefined()
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
      expect(global.ZenMoney.saveCookies).toHaveBeenCalled()
      expect(global.ZenMoney.getCookies.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(fetchJsonMock).toHaveBeenCalled()
      expect(auth.cookieHeader).toContain('TS=poll-ts')
      expect(auth.cookieHeader).toContain('XSRF-TOKEN=poll-xsrf')
      expect(auth.restContext).toBe('pib')
    } finally {
      global.setTimeout = originalSetTimeout
      global.clearTimeout = originalClearTimeout
    }
  })

  it('recovers after native WebView close when cookies appear only after a delayed flush', async () => {
    const originalSetTimeout = global.setTimeout

    global.setTimeout = jest.fn((callback) => {
      callback()
      return 1
    })

    global.ZenMoney = {
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
