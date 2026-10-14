import fetchMock from 'fetch-mock'
import { readFileSync } from 'fs'
import { join } from 'path'
import { scrape } from '../index'
import { convertAccounts } from '../converters'
import get, { getArray } from '../../../types/get'
import { AuthState } from '../models'

const products: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/products.json'), 'utf8'))
const accountEmpty: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/empty-account-history.json'), 'utf8'))
const accountBalances = JSON.parse(readFileSync(join(__dirname, 'fixtures/account-balances.json'), 'utf8')) as Array<{ accountId: number, response: unknown }>
const empty: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/empty-statement.json'), 'utf8'))
const balances = JSON.parse(readFileSync(join(__dirname, 'fixtures/balances.json'), 'utf8')) as Array<{ accountId: number, response: unknown }>
const evidence: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/auth.json'), 'utf8'))
const auth = getArray({ evidence }, 'evidence') as Array<{ response: unknown }>
const session: AuthState = { version: 1, deviceId: '00000000-0000-4000-8000-000000000000', token: 'test-token', otpVerified: true }
const preferences = { phone: '79990000000', password: 'password', countryCode: 'RU' }
const args = { preferences, fromDate: new Date('2021-02-06T00:00:00+06:00'), isFirstRun: false, isInBackground: false }
let storage: unknown
let saved: unknown
let accountHistoryFailure: Error | undefined

beforeEach(() => {
  storage = session
  saved = null
  accountHistoryFailure = undefined
  global.ZenMoney = {
    device: { manufacturer: 'Apple', model: 'iPhone', os: { name: 'ios', version: '27.0' } },
    getData: jest.fn(() => storage),
    setData: jest.fn((_key, value: unknown) => { storage = value }),
    saveData: jest.fn(() => { saved = storage }),
    isAccountSkipped: jest.fn(() => false),
    readLine: jest.fn().mockResolvedValue('000000')
  } as unknown as typeof ZenMoney
  fetchMock.catch({ throws: new Error('Unexpected model request') })
  fetchMock.post('https://bakai24.bakai.kg/v2/account.get_list', { body: products })
  fetchMock.post('https://bakai24.bakai.kg/v2/account.history', async () => {
    if (accountHistoryFailure != null) throw accountHistoryFailure
    return { body: get(accountEmpty, 'response') }
  })
  for (const balance of [...balances, ...accountBalances]) {
    fetchMock.mock((url, options) => url.endsWith('/account.get_balance') && JSON.parse(String(options.body)).id === balance.accountId, { body: balance.response })
  }
})
afterEach(() => fetchMock.restore())

describe('[model] scrape orchestration with observed response envelopes', () => {
  // Reusing the real empty-history envelope models scheduling, not actual empty history on every card.
  it('returns complete card metadata, uses each history plan once and retains skipped cards', async () => {
    jest.mocked(ZenMoney.isAccountSkipped).mockImplementation(id => id === '1003')
    fetchMock.post('https://bakai24.bakai.kg/v2/card.online_statement', { body: get(empty, 'response') })
    await expect(scrape(args)).resolves.toEqual({ accounts: convertAccounts(getArray(products, 'list')).map(plan => plan.account), transactions: [] })
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/card.online_statement')).toHaveLength(2)
    expect(ZenMoney.locale).toBe('ru')
    expect(saved).toEqual(session)
  })

  it('rejects the entire scrape when a history request fails and preserves confirmed authorization', async () => {
    const failure = new Error('Model history failure')
    fetchMock.post('https://bakai24.bakai.kg/v2/card.online_statement', { throws: failure })
    await expect(scrape(args)).rejects.toBe(failure)
    expect(storage).toEqual(session)
  })

  it('loads each standalone ledger once while retaining skipped cards without requesting their history', async () => {
    jest.mocked(ZenMoney.isAccountSkipped).mockImplementation(id => ['1000', '1003', '1006'].includes(id))
    await expect(scrape(args)).resolves.toEqual({ accounts: convertAccounts(getArray(products, 'list')).map(plan => plan.account), transactions: [] })
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/account.history')).toHaveLength(2)
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/card.online_statement')).toHaveLength(0)
  })

  it('rejects successful earlier card data when a later account ledger fails', async () => {
    fetchMock.post('https://bakai24.bakai.kg/v2/card.online_statement', { body: get(empty, 'response') })
    const failure = new Error('Model account-ledger transport failure')
    accountHistoryFailure = failure
    await expect(scrape(args)).rejects.toBe(failure)
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/card.online_statement')).toHaveLength(3)
  })

  it('persists supplied authorization for a later background run without the development override', async () => {
    // Model Bootloader supplying getData while native storage initially has no auth.
    storage = null
    jest.mocked(ZenMoney.getData).mockImplementation(() => session)
    fetchMock.post('https://bakai24.bakai.kg/v2/card.online_statement', { body: get(empty, 'response') })
    await scrape(args)
    expect(saved).toEqual(session)
    jest.mocked(ZenMoney.getData).mockImplementation(() => storage)
    await expect(scrape({ ...args, isInBackground: true })).resolves.toEqual({
      accounts: convertAccounts(getArray(products, 'list')).map(plan => plan.account), transactions: []
    })
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(fetchMock.calls('https://bakai24.bakai.kg/v2/auth')).toHaveLength(0)
  })

  it('persists new authorization before a subsequent history failure', async () => {
    storage = null
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/get_login', { body: auth[0].response })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/auth', { body: auth[1].response })
    fetchMock.postOnce('https://bakai24.bakai.kg/v2/verify_otp', { body: auth[2].response })
    const failure = new Error('Model failure after authorization')
    fetchMock.post('https://bakai24.bakai.kg/v2/card.online_statement', { throws: failure })
    await expect(scrape({ ...args, isFirstRun: true })).rejects.toBe(failure)
    expect(saved).toEqual({ version: 1, deviceId: expect.any(String), token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', otpVerified: true })
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(4)
  })
})
