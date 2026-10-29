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
  jest.mocked(fetchAccounts).mockResolvedValue([])
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
