/* eslint-disable @typescript-eslint/no-var-requires */
import { makePluginDataApi } from '../../../ZPAPI.pluginData'

// [model] Domain objects and mocked auth failures verify entrypoint persistence and UI bounds,
// not bank payload classification or financial conversion.
describe('[model] hapoalim auth orchestration', () => {
  const savedAuth = { cookieHeader: 'SMSESSION=saved', xsrfToken: null, restContext: 'pib', acquiredAt: 1 }
  const freshAuth = { cookieHeader: 'SMSESSION=fresh', restContext: 'pib', acquiredAt: 2 }
  const account = { id: 'model-account', type: 'checking', instrument: 'ILS' }
  const product = { id: account.id, type: 'account' }
  const options = { preferences: {}, fromDate: new Date('2026-10-01T00:00:00Z'), toDate: new Date('2026-10-09T00:00:00Z') }
  let dataApi
  let scrape
  let fetchAccounts
  let fetchTransactions
  let login
  let recover
  let withAuthUpdates
  let errors

  function load (auth = savedAuth) {
    dataApi = makePluginDataApi({ auth })
    global.ZenMoney = {
      ...dataApi.methods,
      restoreCookies: jest.fn().mockResolvedValue(undefined),
      saveCookies: jest.fn().mockResolvedValue(undefined),
      isAccountSkipped: jest.fn().mockReturnValue(false),
      alert: jest.fn()
    }
    scrape = require('../index').scrape
  }

  beforeEach(() => {
    jest.resetModules()
    errors = jest.requireActual('../../../errors')
    const actual = jest.requireActual('../api')
    fetchAccounts = jest.fn().mockResolvedValue([{ id: 'model-api-account' }])
    fetchTransactions = jest.fn().mockResolvedValue([])
    recover = jest.fn().mockResolvedValue(null)
    withAuthUpdates = jest.fn(async (auth, onUpdate, fn) => await fn(auth))
    login = jest.fn(async options => {
      if (options.isInBackground) throw new errors.UserInteractionError()
      if (!options.allowInteraction) throw new Error('Model interactive budget exhausted')
      options.onInteraction()
      await options.onAuthUpdate(freshAuth)
      return freshAuth
    })
    jest.doMock('../api', () => ({
      ...actual,
      fetchAccounts,
      fetchTransactions,
      login,
      withAuthUpdates,
      recoverAuthFromCookieStore: recover,
      isLikelyAuthGateError: error => error?.isAuthGate === true
    }))
    jest.doMock('../converters', () => ({
      convertAccounts: () => [{ mainProduct: product, account }],
      convertTransaction: transaction => transaction
    }))
    jest.doMock('../../../common/transactionGroupHandler', () => ({
      adjustTransactions: ({ transactions }) => transactions
    }))
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('reuses stored auth and returns the complete assembled result', async () => {
    load()
    expect(await scrape(options)).toEqual({ accounts: [account], transactions: [] })
    expect(fetchAccounts).toHaveBeenCalledWith(savedAuth)
    expect(fetchTransactions).toHaveBeenCalledWith(savedAuth, product, options.fromDate, options.toDate)
    expect(login).not.toHaveBeenCalled()
    expect(global.ZenMoney.locale).toBe('he')
  })

  it.each([false, true])('uses verified cookie recovery before WebView (background: %s)', async isInBackground => {
    load(null)
    recover.mockResolvedValue(freshAuth)
    expect(await scrape({ ...options, isInBackground })).toEqual({ accounts: [account], transactions: [] })
    expect(login).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('passes background state into hidden native recovery and preserves its signal', async () => {
    load(null)
    await expect(scrape({ ...options, isInBackground: true })).rejects.toBeInstanceOf(errors.UserInteractionError)
    expect(login).toHaveBeenCalledWith(expect.objectContaining({ isInBackground: true, allowInteraction: true }))
    expect(fetchAccounts).not.toHaveBeenCalled()
  })

  it('accepts hidden native recovery in background', async () => {
    load(null)
    login.mockImplementation(async options => {
      await options.onAuthUpdate(freshAuth)
      return freshAuth
    })
    expect(await scrape({ ...options, isInBackground: true })).toEqual({ accounts: [account], transactions: [] })
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('retries a confirmed rejection once after foreground login', async () => {
    load()
    const rejected = Object.assign(new Error('Model confirmed auth rejection'), { isAuthGate: true })
    fetchAccounts.mockRejectedValueOnce(rejected)
    expect(await scrape(options)).toEqual({ accounts: [account], transactions: [] })
    expect(login).toHaveBeenCalledTimes(1)
    expect(fetchAccounts).toHaveBeenNthCalledWith(2, freshAuth)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('retains an unknown failure and the stored session without a new login', async () => {
    load()
    const error = new Error('Model unknown protocol failure')
    fetchAccounts.mockRejectedValue(error)
    await expect(scrape(options)).rejects.toBe(error)
    expect(recover).not.toHaveBeenCalled()
    expect(login).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth).toEqual(savedAuth)
  })

  it('preserves a recovery transport failure without starting login', async () => {
    load()
    fetchAccounts.mockRejectedValue(Object.assign(new Error('Model auth rejection'), { isAuthGate: true }))
    const error = new Error('Model recovery transport failure')
    recover.mockRejectedValue(error)
    await expect(scrape(options)).rejects.toBe(error)
    expect(login).not.toHaveBeenCalled()
    expect(dataApi.currentData.auth).toEqual(savedAuth)
  })

  it('persists new login auth before subsequent account loading fails', async () => {
    load(null)
    const error = new Error('Model history unavailable')
    fetchAccounts.mockImplementation(async () => {
      expect(dataApi.currentData.auth).toEqual(freshAuth)
      throw error
    })
    await expect(scrape(options)).rejects.toBe(error)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('persists a confirmed rotation immediately, even before the workflow fails', async () => {
    load()
    const error = new Error('Model later request failure')
    withAuthUpdates.mockImplementation(async (auth, onUpdate) => {
      await onUpdate(freshAuth)
      expect(dataApi.currentData.auth).toEqual(freshAuth)
      throw error
    })
    await expect(scrape(options)).rejects.toBe(error)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('does not repeat interactive login across account and history retries', async () => {
    load(null)
    fetchTransactions.mockRejectedValue(Object.assign(new Error('Model history auth rejection'), { isAuthGate: true }))
    await expect(scrape(options)).rejects.toThrow('interactive budget')
    expect(login).toHaveBeenCalledTimes(2)
    expect(login).toHaveBeenNthCalledWith(2, expect.objectContaining({ allowInteraction: false }))
  })

  it('does not loop after a rejected recovered candidate', async () => {
    load()
    const rejected = Object.assign(new Error('Model repeated rejection'), { isAuthGate: true })
    fetchAccounts.mockRejectedValue(rejected)
    recover.mockResolvedValue(freshAuth)
    await expect(scrape(options)).rejects.toBe(rejected)
    expect(recover).toHaveBeenCalledTimes(1)
    expect(login).toHaveBeenCalledTimes(1)
    expect(fetchAccounts).toHaveBeenCalledTimes(3)
  })

  it.each(['restore', 'save'])('propagates a cookie %s failure without discarding auth', async stage => {
    load()
    const error = new Error('Model cookie persistence failure')
    global.ZenMoney[stage === 'restore' ? 'restoreCookies' : 'saveCookies'].mockRejectedValue(error)
    await expect(scrape(options)).rejects.toBe(error)
    expect(dataApi.currentData.auth).toEqual(savedAuth)
    expect(login).not.toHaveBeenCalled()
    if (stage === 'restore') expect(fetchAccounts).not.toHaveBeenCalled()
  })

  it('preserves the original workflow failure when cookie saving also fails', async () => {
    load()
    const original = new Error('Model primary workflow failure')
    fetchAccounts.mockRejectedValue(original)
    global.ZenMoney.saveCookies.mockRejectedValue(new Error('Model secondary save failure'))
    await expect(scrape(options)).rejects.toBe(original)
  })

  it('keeps verified auth on cancellation during a later phase of login', async () => {
    load(null)
    const canceled = new errors.TemporaryError('בדיקת ביטול')
    login.mockImplementation(async options => {
      await options.onAuthUpdate(freshAuth)
      throw canceled
    })
    await expect(scrape(options)).rejects.toBe(canceled)
    expect(dataApi.currentData.auth).toEqual(freshAuth)
  })

  it('does not show the first-run advice in background', async () => {
    load()
    await scrape({ ...options, isInBackground: true, isFirstRun: true })
    expect(global.ZenMoney.alert).not.toHaveBeenCalled()
  })

  it.each([false, true])('bounds a hung auth save and preserves primary failures (%s)', async primaryFailure => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    load()
    const primary = new Error('Model primary account failure')
    if (primaryFailure) fetchAccounts.mockRejectedValue(primary)
    else withAuthUpdates.mockImplementation(async (auth, onUpdate) => { await onUpdate(freshAuth); return [] })
    global.ZenMoney.saveData = jest.fn(() => new Promise(() => {}))
    const outcome = scrape(options).catch(error => error)
    for (let round = 0; round < 4; round++) {
      for (let i = 0; i < 60; i++) await Promise.resolve()
      jest.advanceTimersByTime(15000)
    }
    for (let i = 0; i < 60; i++) await Promise.resolve()
    const error = await outcome
    if (primaryFailure) expect(error).toBe(primary)
    else expect(error).toMatchObject({ message: 'Bank Hapoalim auth state save timed out' })
    expect(global.ZenMoney.saveCookies).toHaveBeenCalledTimes(1)
    expect(login).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })
})
