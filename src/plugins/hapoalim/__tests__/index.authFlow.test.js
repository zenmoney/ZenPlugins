/* eslint-disable @typescript-eslint/no-var-requires */
import { makePluginDataApi } from '../../../ZPAPI.pluginData'

describe('hapoalim auth flow', () => {
  const apiAccounts = [{ id: 'api-account' }]
  const convertedProduct = { id: '12-702-277819', type: 'account' }
  const convertedAccount = { id: '12-702-277819', type: 'checking', instrument: 'ILS' }
  const fromDate = new Date('2026-04-01T00:00:00.000Z')
  const toDate = new Date('2026-04-14T00:00:00.000Z')

  let scrape
  let dataApi
  let fetchAccountsMock
  let fetchTransactionsMock
  let loginMock
  let recoverAuthFromCookieStoreMock
  let normalizeStoredAuthMock
  let isLikelyAuthGateErrorMock
  let convertAccountsMock
  let convertTransactionMock
  let adjustTransactionsMock

  function loadScrape (initialData = {}) {
    dataApi = makePluginDataApi(initialData)
    global.ZenMoney = {
      locale: null,
      isAccountSkipped: jest.fn().mockReturnValue(false),
      alert: jest.fn(),
      restoreCookies: jest.fn().mockResolvedValue(undefined),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      ...dataApi.methods
    }

    jest.doMock('../api', () => ({
      __esModule: true,
      fetchAccounts: fetchAccountsMock,
      fetchTransactions: fetchTransactionsMock,
      isLikelyAuthGateError: isLikelyAuthGateErrorMock,
      login: loginMock,
      recoverAuthFromCookieStore: recoverAuthFromCookieStoreMock,
      withSessionDeadline: jest.requireActual('../api').withSessionDeadline,
      isSessionDeadlineError: jest.requireActual('../api').isSessionDeadlineError,
      normalizeStoredAuth: normalizeStoredAuthMock
    }))

    jest.doMock('../converters', () => ({
      __esModule: true,
      convertAccounts: convertAccountsMock,
      convertTransaction: convertTransactionMock
    }))

    jest.doMock('../../../common/transactionGroupHandler', () => ({
      __esModule: true,
      adjustTransactions: adjustTransactionsMock
    }))

    scrape = require('../index').scrape
  }

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    fetchAccountsMock = jest.fn()
    fetchTransactionsMock = jest.fn()
    loginMock = jest.fn()
    recoverAuthFromCookieStoreMock = jest.fn().mockResolvedValue(null)
    normalizeStoredAuthMock = jest.fn(auth => auth)
    isLikelyAuthGateErrorMock = jest.fn(error => error?.isAuthGate === true)
    convertAccountsMock = jest.fn(() => [{ mainProduct: convertedProduct, account: convertedAccount }])
    convertTransactionMock = jest.fn(transaction => transaction)
    adjustTransactionsMock = jest.fn(({ transactions }) => transactions)
  })

  it('reuses stored auth without re-login', async () => {
    const savedAuth = {
      cookieHeader: 'TS=1; XSRF-TOKEN=saved-xsrf',
      xsrfToken: 'saved-xsrf',
      restContext: 'pib',
      acquiredAt: 1
    }

    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockResolvedValue([])

    const result = await scrape({
      preferences: {},
      fromDate,
      toDate,
      isInBackground: false,
      isFirstRun: false
    })

    expect(loginMock).not.toHaveBeenCalled()
    expect(fetchAccountsMock).toHaveBeenCalledTimes(1)
    expect(fetchAccountsMock).toHaveBeenCalledWith(savedAuth)
    expect(fetchTransactionsMock).toHaveBeenCalledWith(savedAuth, convertedProduct, fromDate, toDate)
    expect(result).toEqual({
      accounts: [convertedAccount],
      transactions: []
    })
    expect(dataApi.currentData.auth).toEqual(savedAuth)
  })

  it('clears stale auth and logs in again in foreground', async () => {
    const staleAuth = {
      cookieHeader: 'TS=stale',
      xsrfToken: 'stale-xsrf',
      restContext: 'old',
      acquiredAt: 1
    }
    const freshAuth = {
      cookieHeader: 'TS=fresh; XSRF-TOKEN=fresh-xsrf',
      xsrfToken: 'fresh-xsrf',
      restContext: 'pib',
      acquiredAt: 2
    }
    const authGateError = Object.assign(new Error('expired session'), { isAuthGate: true })

    loadScrape({ auth: staleAuth })
    fetchAccountsMock
      .mockRejectedValueOnce(authGateError)
      .mockResolvedValueOnce(apiAccounts)
    fetchTransactionsMock.mockResolvedValue([])
    loginMock.mockResolvedValue(freshAuth)

    await scrape({
      preferences: {},
      fromDate,
      toDate,
      isInBackground: false,
      isFirstRun: false
    })

    expect(loginMock).toHaveBeenCalledTimes(1)
    expect(fetchAccountsMock).toHaveBeenCalledTimes(2)
    expect(fetchAccountsMock).toHaveBeenNthCalledWith(1, staleAuth)
    expect(fetchAccountsMock).toHaveBeenNthCalledWith(2, freshAuth)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('requires foreground login when background sync has no stored auth', async () => {
    loadScrape({})

    await expect(scrape({
      preferences: {},
      fromDate,
      toDate,
      isInBackground: true,
      isFirstRun: false
    })).rejects.toMatchObject({
      message: expect.stringContaining('foreground')
    })

    expect(loginMock).not.toHaveBeenCalled()
    expect(fetchAccountsMock).not.toHaveBeenCalled()
  })

  it('retries transaction fetch once after foreground re-login', async () => {
    const savedAuth = {
      cookieHeader: 'TS=1; XSRF-TOKEN=saved-xsrf',
      xsrfToken: 'saved-xsrf',
      restContext: 'old',
      acquiredAt: 1
    }
    const freshAuth = {
      cookieHeader: 'TS=2; XSRF-TOKEN=fresh-xsrf',
      xsrfToken: 'fresh-xsrf',
      restContext: 'pib',
      acquiredAt: 2
    }
    const authGateError = Object.assign(new Error('step-up required'), { isAuthGate: true })
    const apiTransaction = { id: 'tx-1' }
    const convertedTransaction = { id: 'tx-1', hold: false }

    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock
      .mockRejectedValueOnce(authGateError)
      .mockResolvedValueOnce([apiTransaction])
    loginMock.mockResolvedValue(freshAuth)
    convertTransactionMock.mockReturnValue(convertedTransaction)

    const result = await scrape({
      preferences: {},
      fromDate,
      toDate,
      isInBackground: false,
      isFirstRun: false
    })

    expect(loginMock).toHaveBeenCalledTimes(1)
    expect(fetchTransactionsMock).toHaveBeenCalledTimes(2)
    expect(fetchTransactionsMock).toHaveBeenNthCalledWith(1, savedAuth, convertedProduct, fromDate, toDate)
    expect(fetchTransactionsMock).toHaveBeenNthCalledWith(2, freshAuth, convertedProduct, fromDate, toDate)
    expect(result).toEqual({
      accounts: [convertedAccount],
      transactions: [convertedTransaction]
    })
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('normalizes repeated auth-gate failure after retry into re-login error', async () => {
    const savedAuth = {
      cookieHeader: 'TS=1; XSRF-TOKEN=saved-xsrf',
      xsrfToken: 'saved-xsrf',
      restContext: 'old',
      acquiredAt: 1
    }
    const freshAuth = {
      cookieHeader: 'TS=2; XSRF-TOKEN=fresh-xsrf',
      xsrfToken: 'fresh-xsrf',
      restContext: 'pib',
      acquiredAt: 2
    }
    const firstAuthGateError = Object.assign(new Error('step-up required'), { isAuthGate: true })
    const secondAuthGateError = Object.assign(new Error('still blocked'), { isAuthGate: true })

    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock
      .mockRejectedValueOnce(firstAuthGateError)
      .mockRejectedValueOnce(secondAuthGateError)
    loginMock.mockResolvedValue(freshAuth)

    await expect(scrape({
      preferences: {},
      fromDate,
      toDate,
      isInBackground: false,
      isFirstRun: false
    })).rejects.toMatchObject({
      message: expect.stringContaining('official bank page')
    })

    expect(loginMock).toHaveBeenCalledTimes(1)
    expect(dataApi.currentData.auth).toBeNull()
  })

  it.each([false, true])('recovers stale auth without opening WebView (background: %s)', async (isInBackground) => {
    const staleAuth = { cookieHeader: 'SMSESSION=stale', restContext: 'old' }
    const recoveredAuth = { cookieHeader: 'SMSESSION=recovered', restContext: 'pib' }
    loadScrape({ auth: staleAuth })
    fetchAccountsMock.mockRejectedValueOnce(Object.assign(new Error('expired'), { isAuthGate: true }))
      .mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockResolvedValue([])
    recoverAuthFromCookieStoreMock.mockResolvedValue(recoveredAuth)
    await scrape({ preferences: {}, fromDate, toDate, isInBackground })
    expect(loginMock).not.toHaveBeenCalled()
    expect(recoverAuthFromCookieStoreMock).toHaveBeenCalledWith(staleAuth, { allowAuthSuspect: !isInBackground })
    expect(fetchAccountsMock).toHaveBeenLastCalledWith(recoveredAuth)
    expect(dataApi.currentData.auth).toEqual(recoveredAuth)
  })

  it('recovers missing auth from cookies before requiring foreground login', async () => {
    const recoveredAuth = { cookieHeader: 'SMSESSION=recovered', restContext: 'pib' }
    loadScrape()
    recoverAuthFromCookieStoreMock.mockResolvedValue(recoveredAuth)
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockResolvedValue([])
    await scrape({ preferences: {}, fromDate, toDate, isInBackground: true })
    expect(loginMock).not.toHaveBeenCalled()
    expect(fetchAccountsMock).toHaveBeenCalledWith(recoveredAuth)
    expect(dataApi.currentData.auth).toEqual(recoveredAuth)
  })

  it.each([false, true])('recovers transaction auth without WebView (background: %s)', async (isInBackground) => {
    const savedAuth = { cookieHeader: 'SMSESSION=saved', restContext: 'pib' }
    const recoveredAuth = { cookieHeader: 'SMSESSION=recovered', restContext: 'pib' }
    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockRejectedValueOnce(Object.assign(new Error('expired'), { isAuthGate: true }))
      .mockResolvedValue([])
    recoverAuthFromCookieStoreMock.mockResolvedValue(recoveredAuth)
    await scrape({ preferences: {}, fromDate, toDate, isInBackground })
    expect(loginMock).not.toHaveBeenCalled()
    expect(fetchTransactionsMock).toHaveBeenLastCalledWith(recoveredAuth, convertedProduct, fromDate, toDate)
    expect(dataApi.currentData.auth).toEqual(recoveredAuth)
  })

  it('preserves fresh auth when account loading fails with a non-auth error after login', async () => {
    const freshAuth = { cookieHeader: 'SMSESSION=fresh', restContext: 'pib' }
    const networkError = new Error('network unavailable')
    loadScrape()
    loginMock.mockResolvedValue(freshAuth)
    fetchAccountsMock.mockRejectedValue(networkError)
    await expect(scrape({ preferences: {}, fromDate, toDate })).rejects.toBe(networkError)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('preserves fresh auth when transaction retry fails with a non-auth error', async () => {
    const savedAuth = { cookieHeader: 'SMSESSION=saved', restContext: 'pib' }
    const freshAuth = { cookieHeader: 'SMSESSION=fresh', restContext: 'pib' }
    const networkError = new Error('network unavailable')
    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockRejectedValueOnce(Object.assign(new Error('expired'), { isAuthGate: true }))
      .mockRejectedValueOnce(networkError)
    loginMock.mockResolvedValue(freshAuth)
    await expect(scrape({ preferences: {}, fromDate, toDate })).rejects.toBe(networkError)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('persists rotated auth across a new plugin instance without another login', async () => {
    const freshAuth = { cookieHeader: 'SMSESSION=fresh', restContext: 'pib' }
    loadScrape()
    loginMock.mockResolvedValue(freshAuth)
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockImplementation(async auth => {
      auth.cookieHeader = 'SMSESSION=rotated'
      return []
    })
    await scrape({ preferences: {}, fromDate, toDate })
    expect(dataApi.saveDataRequested).toBe(true)
    const persistedData = JSON.parse(JSON.stringify(dataApi.currentData))
    jest.resetModules()
    loadScrape(persistedData)
    await scrape({ preferences: {}, fromDate, toDate, isInBackground: true })
    expect(loginMock).toHaveBeenCalledTimes(1)
    expect(fetchAccountsMock.mock.calls[1][0].cookieHeader).toBe('SMSESSION=rotated')
    expect(global.ZenMoney.restoreCookies).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.saveCookies).toHaveBeenCalledTimes(1)
  })

  it('restores cookies before requesting accounts and saves them after transactions', async () => {
    loadScrape({ auth: { cookieHeader: 'SMSESSION=saved' } })
    fetchAccountsMock.mockImplementation(async () => {
      expect(global.ZenMoney.restoreCookies).toHaveBeenCalledTimes(1)
      expect(global.ZenMoney.saveCookies).not.toHaveBeenCalled()
      return apiAccounts
    })
    fetchTransactionsMock.mockImplementation(async () => {
      expect(global.ZenMoney.saveCookies).not.toHaveBeenCalled()
      return []
    })
    await scrape({ preferences: {}, fromDate, toDate, isInBackground: true })
    expect(global.ZenMoney.saveCookies).toHaveBeenCalledTimes(1)
  })

  it('does not loop silent recovery when a background transaction retry is rejected', async () => {
    loadScrape({ auth: { cookieHeader: 'SMSESSION=saved' } })
    const recoveredAuth = { cookieHeader: 'SMSESSION=recovered' }
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockRejectedValue(Object.assign(new Error('step-up'), { isAuthGate: true }))
    recoverAuthFromCookieStoreMock.mockResolvedValue(recoveredAuth)
    await expect(scrape({ preferences: {}, fromDate, toDate, isInBackground: true })).rejects.toMatchObject({
      message: expect.stringContaining('foreground')
    })
    expect(recoverAuthFromCookieStoreMock).toHaveBeenCalledTimes(1)
    expect(fetchTransactionsMock).toHaveBeenCalledTimes(2)
    expect(loginMock).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth).toBeNull()
  })

  it('opens at most one interactive login across accounts and transactions', async () => {
    loadScrape()
    loginMock.mockResolvedValue({ cookieHeader: 'SMSESSION=fresh' })
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockRejectedValue(Object.assign(new Error('step-up'), { isAuthGate: true }))
    await expect(scrape({ preferences: {}, fromDate, toDate })).rejects.toMatchObject({
      message: expect.stringContaining('official bank page')
    })
    expect(loginMock).toHaveBeenCalledTimes(1)
    expect(fetchTransactionsMock).toHaveBeenCalledTimes(1)
    expect(dataApi.currentData.auth).toBeNull()
  })

  it('does not reset auth or open WebView on a silent recovery transport failure', async () => {
    const savedAuth = { cookieHeader: 'SMSESSION=saved' }
    const networkError = new Error('network unavailable')
    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockRejectedValue(Object.assign(new Error('expired'), { isAuthGate: true }))
    recoverAuthFromCookieStoreMock.mockRejectedValue(networkError)
    await expect(scrape({ preferences: {}, fromDate, toDate })).rejects.toBe(networkError)
    expect(dataApi.currentData.auth).toEqual(savedAuth)
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('continues both accounts with the silently recovered session', async () => {
    loadScrape({ auth: { cookieHeader: 'SMSESSION=saved' } })
    const secondProduct = { id: '12-702-277820', type: 'account' }
    const secondAccount = { ...convertedAccount, id: secondProduct.id }
    convertAccountsMock.mockReturnValue([
      { mainProduct: convertedProduct, account: convertedAccount },
      { mainProduct: secondProduct, account: secondAccount }
    ])
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockRejectedValueOnce(Object.assign(new Error('expired'), { isAuthGate: true }))
      .mockResolvedValue([])
    const recoveredAuth = { cookieHeader: 'SMSESSION=recovered' }
    recoverAuthFromCookieStoreMock.mockResolvedValue(recoveredAuth)
    const result = await scrape({ preferences: {}, fromDate, toDate, isInBackground: true })
    expect(result.accounts).toEqual([convertedAccount, secondAccount])
    expect(fetchTransactionsMock).toHaveBeenNthCalledWith(2, recoveredAuth, convertedProduct, fromDate, toDate)
    expect(fetchTransactionsMock).toHaveBeenNthCalledWith(3, recoveredAuth, secondProduct, fromDate, toDate)
    expect(loginMock).not.toHaveBeenCalled()
  })

  it.each(['restore', 'save'])('bounds a pending cookie %s without clearing auth or retrying the native call', async operation => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    const savedAuth = { cookieHeader: 'SMSESSION=saved' }
    loadScrape({ auth: savedAuth })
    const cookieMethod = global.ZenMoney[`${operation}Cookies`]
    cookieMethod.mockReturnValue(new Promise(() => {}))
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockResolvedValue([])
    const outcome = scrape({ preferences: {}, fromDate, toDate, isInBackground: true }).then(result => ({ result }), error => ({ error }))
    try {
      for (let i = 0; i < 80; i++) await Promise.resolve()
      jest.advanceTimersByTime(15000)
      if (operation === 'restore') {
        expect(await outcome).toMatchObject({ error: { message: expect.stringContaining('cookie store restore timed out'), allowRetry: false } })
      } else {
        expect(await outcome).toMatchObject({ result: { accounts: [convertedAccount], transactions: [] } })
      }
      expect(cookieMethod).toHaveBeenCalledTimes(1)
      expect(dataApi.currentData.auth).toEqual(savedAuth)
      expect(loginMock).not.toHaveBeenCalled()
      if (operation === 'restore') {
        expect(fetchAccountsMock).not.toHaveBeenCalled()
        expect(global.ZenMoney.saveCookies).not.toHaveBeenCalled()
      }
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('preserves the original sync error if saving cookies also fails', async () => {
    const savedAuth = { cookieHeader: 'SMSESSION=saved' }
    loadScrape({ auth: savedAuth })
    const networkError = new Error('bank unavailable')
    fetchAccountsMock.mockRejectedValue(networkError)
    global.ZenMoney.saveCookies.mockRejectedValue(new Error('cookie bridge failed'))
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await expect(scrape({ preferences: {}, fromDate, toDate })).rejects.toBe(networkError)
      expect(dataApi.currentData.auth).toEqual(savedAuth)
      expect(warning).toHaveBeenCalledWith('Bank Hapoalim cookie store save failed after sync error')
    } finally {
      warning.mockRestore()
    }
  })

  it('keeps auth on a background 200 HTML maintenance response using the real classifier', async () => {
    const { ParseError } = jest.requireActual('../../../common/network')
    const { isLikelyAuthGateError } = jest.requireActual('../api')
    isLikelyAuthGateErrorMock.mockImplementation(isLikelyAuthGateError)
    const savedAuth = { cookieHeader: 'SMSESSION=saved' }
    const error = new ParseError('HTML instead of JSON', {
      status: 200,
      url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
      headers: { 'content-type': 'text/html' },
      body: '<html>Maintenance</html>'
    })
    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockRejectedValue(error)
    await expect(scrape({ preferences: {}, fromDate, toDate, isInBackground: true })).rejects.toBe(error)
    expect(dataApi.currentData.auth).toEqual(savedAuth)
    expect(recoverAuthFromCookieStoreMock).not.toHaveBeenCalled()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('continues using stored auth after a fast cookie restore rejection', async () => {
    const savedAuth = { cookieHeader: 'SMSESSION=saved' }
    loadScrape({ auth: savedAuth })
    global.ZenMoney.restoreCookies.mockRejectedValue(new Error('native cookie bridge unavailable'))
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockResolvedValue([])
    await expect(scrape({ preferences: {}, fromDate, toDate, isInBackground: true })).resolves.toMatchObject({ accounts: [convertedAccount] })
    expect(fetchAccountsMock).toHaveBeenCalledWith(savedAuth)
    expect(loginMock).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth).toEqual(savedAuth)
  })

  it('returns successfully collected data even when saving cookies rejects', async () => {
    const savedAuth = { cookieHeader: 'SMSESSION=saved' }
    loadScrape({ auth: savedAuth })
    global.ZenMoney.saveCookies.mockRejectedValue(new Error('native cookie bridge unavailable'))
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    fetchTransactionsMock.mockResolvedValue([])
    await expect(scrape({ preferences: {}, fromDate, toDate })).resolves.toEqual({ accounts: [convertedAccount], transactions: [] })
    expect(dataApi.currentData.auth).toEqual(savedAuth)
    expect(global.ZenMoney.saveCookies).toHaveBeenCalledTimes(1)
  })

  it('does not clear stored auth when an ambiguous foreground response leads to a cancelled login', async () => {
    const { ParseError } = jest.requireActual('../../../common/network')
    isLikelyAuthGateErrorMock.mockImplementation(jest.requireActual('../api').isLikelyAuthGateError)
    const savedAuth = { cookieHeader: 'SMSESSION=saved' }
    loadScrape({ auth: savedAuth })
    fetchAccountsMock.mockRejectedValue(new ParseError('HTML', { status: 200, headers: { 'content-type': 'text/html' } }))
    const cancelled = new Error('login cancelled')
    loginMock.mockRejectedValue(cancelled)
    await expect(scrape({ preferences: {}, fromDate, toDate })).rejects.toBe(cancelled)
    expect(loginMock).toHaveBeenCalledTimes(1)
    expect(dataApi.currentData.auth).toEqual(savedAuth)
  })

  it('preserves the original ambiguous transaction error after the single interactive login', async () => {
    const { ParseError } = jest.requireActual('../../../common/network')
    isLikelyAuthGateErrorMock.mockImplementation(jest.requireActual('../api').isLikelyAuthGateError)
    loadScrape()
    const freshAuth = { cookieHeader: 'SMSESSION=fresh', restContext: 'pib' }
    loginMock.mockResolvedValue(freshAuth)
    fetchAccountsMock.mockResolvedValue(apiAccounts)
    const error = new ParseError('maintenance HTML', { status: 200, headers: { 'content-type': 'text/html' } })
    fetchTransactionsMock.mockRejectedValue(error)
    await expect(scrape({ preferences: {}, fromDate, toDate })).rejects.toBe(error)
    expect(loginMock).toHaveBeenCalledTimes(1)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })
})
