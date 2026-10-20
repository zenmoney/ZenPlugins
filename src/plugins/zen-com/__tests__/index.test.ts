import { accountsResponse } from '../__fixtures__/accounts'
import { expectedAccounts } from '../__fixtures__/expected-accounts'
import page1 from '../__fixtures__/mobile-history-page1.json'
import expectedTransactions from '../__fixtures__/mobile-expected-transactions.json'
import get from '../../../types/get'
import { arrayAt } from '../validation'
import type { PersistMobileAuth } from '../mobile'

const mockMobileLogin = jest.fn()
const mockAccounts = jest.fn()
const mockHistory = jest.fn()
const mockSaveData = jest.fn<Promise<void>, []>()
jest.mock('../mobile', () => ({ loginMobile: (...args: unknown[]) => mockMobileLogin(...args) }))
jest.mock('../api', () => ({
  fetchAccounts: (...args: unknown[]) => mockAccounts(...args),
  fetchTransactions: (...args: unknown[]) => mockHistory(...args)
}))
const { scrape } = jest.requireActual<typeof import('../index')>('../index')

// Model host persistence/selection and error propagation. Financial inputs and
// expected complete results are independently checked captured source evidence.
describe('ZEN.COM mobile-only entrypoint [model]', () => {
  const session = { deviceId: 'model-device', accessToken: 'model-token' }
  const auth = { version: 1 as const, deviceId: session.deviceId, loginToken: session.accessToken, passcode: 'model-passcode' }
  let skipped: Set<string>
  beforeEach(() => {
    jest.resetAllMocks()
    mockSaveData.mockResolvedValue(undefined)
    skipped = new Set()
    global.ZenMoney = {
      getData: jest.fn(() => null),
      setData: jest.fn(),
      saveData: mockSaveData,
      isAccountSkipped: jest.fn((id: string) => skipped.has(id))
    } as unknown as typeof ZenMoney
    mockMobileLogin.mockImplementation(async (_saved: unknown, _background: boolean, persist: PersistMobileAuth) => {
      await persist(auth)
      return session
    })
    mockAccounts.mockResolvedValue(arrayAt(accountsResponse, 'accounts'))
    mockHistory.mockResolvedValue(arrayAt(page1, 'historyEntries'))
  })
  const run = async (preferences: Record<string, unknown> = {}, isInBackground = false): ReturnType<typeof scrape> => await scrape({ fromDate: new Date('2026-01-01T00:00:00Z'), preferences, isFirstRun: false, isInBackground })

  it.each([{}, { useMobileAuth: false }, { useMobileAuth: true }])('uses only mobile authorization, including obsolete preferences %p', async preferences => {
    await run(preferences)
    expect(mockMobileLogin).toHaveBeenCalledWith(null, false, expect.any(Function))
    expect(ZenMoney.getData).toHaveBeenCalledTimes(1)
    expect(ZenMoney.getData).toHaveBeenCalledWith('mobileAuth')
    expect(mockAccounts).toHaveBeenCalledWith(session)
  })

  it('persists rotated authorization before account loading and preserves a later bank error', async () => {
    const error = new Error('Model account failure after mobile authentication')
    mockAccounts.mockImplementation(async () => {
      expect(ZenMoney.setData).toHaveBeenCalledWith('mobileAuth', auth)
      expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
      throw error
    })
    await expect(run()).rejects.toBe(error)
    expect(mockHistory).not.toHaveBeenCalled()
  })

  it('awaits native persistence before loading financial data', async () => {
    let saved = false
    mockSaveData.mockImplementation(async () => { await Promise.resolve(); saved = true })
    mockAccounts.mockImplementation(async () => {
      expect(saved).toBe(true)
      return arrayAt(accountsResponse, 'accounts')
    })
    await run()
  })

  it('keeps persistence failures visible and sends no financial request', async () => {
    const error = new Error('Model native persistence failure')
    jest.mocked(ZenMoney.saveData).mockImplementation(() => { throw error })
    await expect(run()).rejects.toBe(error)
    expect(mockAccounts).not.toHaveBeenCalled()
    expect(mockHistory).not.toHaveBeenCalled()
  })

  it('returns the complete captured first-page result with MCC and one shared history fetch', async () => {
    const result = await run()
    expect(result.accounts).toEqual(expectedAccounts)
    expect(result.transactions.map(tx => ({ ...tx, date: tx.date.toISOString() }))).toEqual(expectedTransactions)
    expect(mockHistory).toHaveBeenCalledTimes(1)
    expect(mockHistory.mock.calls[0][0]).toEqual(session)
    expect(ZenMoney.locale).toBe('en')
  })

  it('keeps account metadata and skips history when every account is excluded', async () => {
    skipped = new Set(expectedAccounts.map(account => account.id))
    expect(await run()).toEqual({ accounts: expectedAccounts, transactions: [] })
    expect(mockHistory).not.toHaveBeenCalled()
  })

  it('keeps a bank-confirmed exchange affecting a selected account even when the other account is skipped', async () => {
    skipped = new Set(expectedAccounts.filter(account => account.instrument !== 'USD').map(account => account.id))
    const result = await run()
    expect(result.accounts).toEqual(expectedAccounts)
    expect(result.transactions.map(tx => ({ ...tx, date: tx.date.toISOString() }))).toEqual(arrayAt({ expectedTransactions }, 'expectedTransactions').filter(tx => arrayAt(tx, 'movements').some(m => get(m, 'account.id') === expectedAccounts.find(a => a.instrument === 'USD')?.id)))
    expect(mockHistory).toHaveBeenCalledTimes(1)
  })

  it('propagates unknown login errors without loading or replacing state', async () => {
    const error = new Error('Model mobile login failure')
    mockMobileLogin.mockRejectedValue(error)
    await expect(run({}, true)).rejects.toBe(error)
    expect(mockAccounts).not.toHaveBeenCalled()
    expect(ZenMoney.setData).not.toHaveBeenCalled()
  })
})
