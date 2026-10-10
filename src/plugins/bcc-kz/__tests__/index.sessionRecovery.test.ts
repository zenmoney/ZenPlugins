export {}

const mockFetchAccounts = jest.fn()
const mockFetchTransactions = jest.fn()
const mockLogin = jest.fn()

interface Auth { accessToken?: string, sessionCode?: string, device: { deviceId: string } }
interface RecoveryOptions { onAuth: () => void, isInBackground: boolean }
const actualApi: {
  SessionExpiredError: new () => Error
  withAuthRecovery: (preferences: unknown, auth: Auth, action: () => Promise<unknown>, options: RecoveryOptions, deps: { login: typeof mockLogin }) => Promise<unknown>
} = jest.requireActual('../api')

jest.mock('../api', () => ({
  ...actualApi,
  fetchAccounts: mockFetchAccounts,
  fetchTransactions: mockFetchTransactions,
  setLanguageCookie: jest.fn(),
  setMbsessionCookie: jest.fn(),
  withAuthRecovery: async (preferences: unknown, auth: Auth, action: () => Promise<unknown>, options: RecoveryOptions) =>
    await actualApi.withAuthRecovery(preferences, auth, action, options, { login: mockLogin })
}))

const accounts = [{ id: 'first', instrument: 'KZT' }, { id: 'second', instrument: 'KZT' }]
jest.mock('../converters', () => ({
  convertAccounts: () => accounts.map(account => ({ product: { id: account.id }, accounts: [account] }))
}))
const { scrape }: { scrape: (options: unknown) => Promise<unknown> } = jest.requireActual('../index')
const options = { preferences: {}, fromDate: new Date('2026-10-01Z'), toDate: new Date('2026-10-08Z'), isInBackground: false }

describe('[model] complete scrape recovery and immediate auth persistence', () => {
  // Domain stubs isolate retry/persistence ordering from bank account formats.
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchAccounts.mockResolvedValue([])
    const auth: Auth = { accessToken: 'expired', sessionCode: 'expired-session', device: { deviceId: 'saved-device' } }
    mockLogin.mockImplementation(async () => { auth.accessToken = 'renewed'; auth.sessionCode = 'renewed-session' })
    ;(global as { ZenMoney?: unknown }).ZenMoney = {
      getData: () => auth, setData: jest.fn(), saveData: jest.fn(), isAccountSkipped: () => false
    }
  })

  it('discards the failed attempt and returns each account once after recovery', async () => {
    mockFetchTransactions.mockResolvedValueOnce([]).mockRejectedValueOnce(new actualApi.SessionExpiredError()).mockResolvedValue([])
    expect(await scrape(options)).toEqual({ accounts, transactions: [] })
    expect(mockFetchAccounts).toHaveBeenCalledTimes(2)
    expect(mockFetchTransactions).toHaveBeenCalledTimes(4)
    expect(ZenMoney.setData).toHaveBeenCalledWith('auth', { accessToken: 'renewed', sessionCode: 'renewed-session', device: { deviceId: 'saved-device' } })
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it('persists the renewed session before a later unknown statement failure', async () => {
    const failure = new Error('unrecognized statement failure')
    mockFetchTransactions.mockRejectedValueOnce(new actualApi.SessionExpiredError()).mockImplementation(async () => {
      expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
      throw failure
    })
    await expect(scrape(options)).rejects.toBe(failure)
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })
})
