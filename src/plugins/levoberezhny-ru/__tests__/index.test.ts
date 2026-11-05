import { AccountType } from '../../../types/zenmoney'

jest.mock('../api', () => ({ login: jest.fn(), fetchAccounts: jest.fn(), fetchTransactions: jest.fn() }))
jest.mock('../certs', () => ({ trustBankCertificates: jest.fn() }))
jest.mock('../converters', () => ({ convertAccounts: jest.fn(), convertTransactions: jest.fn() }))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { scrape } = require('../index') as typeof import('../index')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchAccounts, fetchTransactions, login } = require('../api') as typeof import('../api')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { convertAccounts, convertTransactions } = require('../converters') as typeof import('../converters')

// [model] Confirmed authorization must survive a later scrape failure.
it('[model] persists confirmed auth before propagating the original account failure', async () => {
  const host = { getData: jest.fn(), setData: jest.fn(), saveData: jest.fn(), locale: '' }
  Object.assign(global, { ZenMoney: host })
  const auth = { cookieHeader: 'model-cookie', fingerprint: 'model-device' }
  jest.mocked(login).mockImplementation(async (_preferences, _saved, _background, persist) => {
    persist(auth)
    return { ...auth, persist }
  })
  const failure = new Error('Model account failure')
  jest.mocked(fetchAccounts).mockRejectedValue(failure)
  await expect(scrape({ preferences: { login: 'model', password: 'model' }, fromDate: new Date('2026-01-01Z'), toDate: undefined, isFirstRun: false, isInBackground: false })).rejects.toBe(failure)
  expect(host.setData).toHaveBeenCalledWith('auth', auth)
  expect(host.saveData).toHaveBeenCalledTimes(1)
  expect(host.locale).toBe('ru')
  expect(fetchTransactions).not.toHaveBeenCalled()
  expect(convertAccounts).not.toHaveBeenCalled()
})

// [model] An open checking account must pass through assembly and load its own history once.
it('[model] includes a checking account and its fetch plan without requiring a card', async () => {
  jest.clearAllMocks()
  const host = { getData: jest.fn(), setData: jest.fn(), saveData: jest.fn(), isAccountSkipped: jest.fn().mockReturnValue(false), locale: '' }
  Object.assign(global, { ZenMoney: host })
  const auth = { cookieHeader: 'model-cookie', fingerprint: 'model-device' }
  jest.mocked(login).mockImplementation(async (_preferences, _saved, _background, persist) => ({ ...auth, persist }))
  jest.mocked(fetchAccounts).mockResolvedValue({ accounts: [], deposits: [] })
  const account = { id: 'model-current', type: AccountType.checking as const, title: 'Model current', instrument: 'RUB', syncIds: ['model-number'], archived: false, balance: 100 }
  const params = { accountId: account.id }
  jest.mocked(convertAccounts).mockReturnValue([{ account, fetchParams: params }])
  jest.mocked(fetchTransactions).mockResolvedValue([])
  jest.mocked(convertTransactions).mockReturnValue([])
  const fromDate = new Date('2026-01-01T00:00:00+03:00')
  await expect(scrape({ preferences: { login: 'model', password: 'model' }, fromDate, toDate: undefined, isFirstRun: false, isInBackground: false })).resolves.toEqual({ accounts: [account], transactions: [] })
  expect(fetchTransactions).toHaveBeenCalledTimes(1)
  expect(fetchTransactions).toHaveBeenCalledWith(expect.objectContaining(auth), params, fromDate, undefined)
})

it('[model] preserves savings metadata, fetches selected histories once and excludes skipped history from matching', async () => {
  // Assembly must retain savings and expose only actually fetched counterparts.
  jest.clearAllMocks()
  Object.assign(global, { ZenMoney: { getData: jest.fn(), setData: jest.fn(), saveData: jest.fn(), isAccountSkipped: (id: string) => id === 'model-skipped', locale: '' } })
  const auth = { cookieHeader: 'model-cookie', fingerprint: 'model-device' }
  jest.mocked(login).mockImplementation(async (_preferences, _saved, _background, persist) => ({ ...auth, persist }))
  jest.mocked(fetchAccounts).mockResolvedValue({ accounts: [], deposits: [] })
  const account = { id: 'model-savings', type: AccountType.checking as const, savings: true, title: 'Model savings', instrument: 'RUB', syncIds: ['model-savings-number'], balance: 0, archived: true }
  const skipped = { id: 'model-skipped', type: AccountType.checking as const, title: 'Model skipped', instrument: 'RUB', syncIds: ['model-skipped-number'], balance: 100, archived: false }
  const params = { accountId: account.id, historyAvailable: true }
  jest.mocked(convertAccounts).mockReturnValue([{ account, fetchParams: params }, { account: skipped, fetchParams: { accountId: skipped.id } }])
  const operations = [{ modelHistoryMarker: true }]
  jest.mocked(fetchTransactions).mockResolvedValue(operations)
  jest.mocked(convertTransactions).mockReturnValue([])
  const from = new Date('2026-01-01T00:00:00+03:00')
  await expect(scrape({ preferences: {}, fromDate: from, toDate: undefined, isFirstRun: false, isInBackground: false })).resolves.toEqual({ accounts: [account, skipped], transactions: [] })
  expect(fetchTransactions).toHaveBeenCalledTimes(1)
  expect(fetchTransactions).toHaveBeenCalledWith(expect.objectContaining(auth), params, from, undefined)
  expect(convertTransactions).toHaveBeenCalledWith(operations, account, from, undefined, [account, skipped], operations)
  expect(convertAccounts).toHaveBeenCalledWith({ accounts: [], deposits: [] }, [])
})

it('[model] remembers synced deposits and returns the same account as archived after closure', async () => {
  // Local lifecycle after the bank-conversion boundary; no synthetic bank records.
  jest.clearAllMocks()
  const state = new Map<string, unknown>()
  const host = {
    getData: jest.fn((key: string) => state.get(key)),
    setData: jest.fn((key: string, value: unknown) => state.set(key, value)),
    saveData: jest.fn(),
    isAccountSkipped: jest.fn().mockReturnValue(false),
    locale: ''
  }
  Object.assign(global, { ZenMoney: host })
  jest.mocked(login).mockImplementation(async (_preferences, _saved, _background, persist) => ({ cookieHeader: 'model-cookie', fingerprint: 'model-device', persist }))
  jest.mocked(fetchAccounts).mockResolvedValue({ accounts: [], deposits: [] })
  const open = { id: 'model-deposit', type: AccountType.checking as const, savings: true, title: 'Model deposit', instrument: 'RUB', syncIds: ['model-deposit-number'], balance: 100, archived: false }
  const closed = { id: 'model-deposit', type: AccountType.checking as const, savings: true, title: 'Model deposit', instrument: 'RUB', syncIds: ['model-deposit-number'], balance: null, archived: true }
  jest.mocked(convertAccounts).mockReturnValueOnce([{ account: open, fetchParams: { accountId: open.id, historyAvailable: true } }]).mockReturnValueOnce([{ account: closed, fetchParams: { accountId: closed.id, historyAvailable: false } }])
  jest.mocked(fetchTransactions).mockResolvedValue([])
  jest.mocked(convertTransactions).mockReturnValue([])
  const args = { preferences: {}, fromDate: new Date('2026-01-01T00:00:00+03:00'), toDate: undefined, isFirstRun: false, isInBackground: false }
  await expect(scrape(args)).resolves.toEqual({ accounts: [open], transactions: [] })
  expect(state.get('syncedDepositIds')).toEqual(['model-deposit'])
  await expect(scrape(args)).resolves.toEqual({ accounts: [closed], transactions: [] })
  expect(convertAccounts).toHaveBeenNthCalledWith(2, { accounts: [], deposits: [] }, ['model-deposit'])
  expect(state.get('syncedDepositIds')).toEqual(['model-deposit'])

  const failure = new Error('Model history failure')
  jest.mocked(convertAccounts).mockReturnValue([{ account: { ...open, id: 'model-new-deposit' }, fetchParams: { accountId: 'model-new-deposit' } }])
  jest.mocked(fetchTransactions).mockRejectedValueOnce(failure)
  host.setData.mockClear()
  await expect(scrape(args)).rejects.toBe(failure)
  expect(host.setData).not.toHaveBeenCalled()
  expect(state.get('syncedDepositIds')).toEqual(['model-deposit'])
})

// [model] Native deposit metadata must survive assembly and its ID must be remembered.
it('[model] loads deposit history without generating planned interest transactions', async () => {
  jest.clearAllMocks()
  const host = { getData: jest.fn(), setData: jest.fn(), saveData: jest.fn(), isAccountSkipped: jest.fn().mockReturnValue(false), locale: '' }
  Object.assign(global, { ZenMoney: host })
  jest.mocked(login).mockImplementation(async (_preferences, _saved, _background, persist) => ({ cookieHeader: 'model-cookie', fingerprint: 'model-device', persist }))
  jest.mocked(fetchAccounts).mockResolvedValue({ accounts: [], deposits: [] })
  const account = {
    id: 'model-native-deposit',
    type: AccountType.deposit as const,
    title: 'Model deposit',
    instrument: 'RUB',
    syncIds: ['model-number'],
    balance: 1000,
    archived: false,
    startDate: new Date('2026-11-03T17:00:00Z'),
    startBalance: 1000,
    percent: 7,
    capitalization: false,
    endDateOffsetInterval: 'day' as const,
    endDateOffset: 91,
    payoffInterval: 'month' as const,
    payoffStep: 1
  }
  const params = { accountId: account.id, historyAvailable: true }
  jest.mocked(convertAccounts).mockReturnValue([{ account, fetchParams: params }])
  jest.mocked(fetchTransactions).mockResolvedValue([])
  jest.mocked(convertTransactions).mockReturnValue([])
  const from = new Date('2026-11-03T21:00:00Z')
  await expect(scrape({ preferences: {}, fromDate: from, toDate: undefined, isFirstRun: false, isInBackground: false })).resolves.toEqual({ accounts: [account], transactions: [] })
  expect(fetchTransactions).toHaveBeenCalledWith(expect.objectContaining({ cookieHeader: 'model-cookie' }), params, from, undefined)
  expect(host.setData).toHaveBeenCalledWith('syncedDepositIds', ['model-native-deposit'])
})
