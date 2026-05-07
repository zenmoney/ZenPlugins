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
      ...dataApi.methods
    }

    jest.doMock('../api', () => ({
      __esModule: true,
      fetchAccounts: fetchAccountsMock,
      fetchTransactions: fetchTransactionsMock,
      isLikelyAuthGateError: isLikelyAuthGateErrorMock,
      login: loginMock,
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
})
