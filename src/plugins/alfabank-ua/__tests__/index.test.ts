const mockLogin = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchTransactions = jest.fn()
const mockConvertAccounts = jest.fn()
jest.mock('../api', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  fetchAccounts: (...args: unknown[]) => mockFetchAccounts(...args),
  fetchTransactions: (...args: unknown[]) => mockFetchTransactions(...args),
  generateDevice: jest.fn()
}))
jest.mock('../converters', () => ({
  convertAccounts: (...args: unknown[]) => mockConvertAccounts(...args),
  convertTransaction: jest.fn(),
  duplicatesTransactions: (transactions: unknown[]) => transactions
}))

const { scrape }: { scrape: (args: { preferences: object, fromDate: Date, toDate: Date, isInBackground?: boolean }) => Promise<unknown> } = jest.requireActual('../index')

// [model] Generic scheduling and auth persistence use domain plans, not fabricated bank responses.
it('[model] persists auth before concurrent history loading and preserves the original failure', async () => {
  const setData = jest.fn()
  const saveData = jest.fn()
  const auth = { device: {}, accessToken: 'confirmed-token' }
  Object.assign(global, { ZenMoney: { getData: jest.fn(() => null), setData, saveData, isAccountSkipped: jest.fn(() => false) } })
  mockLogin.mockImplementation(async (_preferences: unknown, _auth: unknown, _background: unknown, onAuth: (auth: unknown) => void) => onAuth(auth))
  mockFetchAccounts.mockResolvedValue([])
  mockConvertAccounts.mockReturnValue(['one', 'two'].map(id => ({ account: { id, instrument: 'UAH' }, product: { id } })))
  const failure = new Error('History failed')
  let active = 0
  let peak = 0
  mockFetchTransactions.mockImplementation(async () => {
    expect(setData).toHaveBeenLastCalledWith('auth', auth)
    expect(saveData).toHaveBeenCalledTimes(1)
    active++
    peak = Math.max(active, peak)
    await Promise.resolve()
    active--
    throw failure
  })
  await expect(scrape({ preferences: {}, fromDate: new Date(0), toDate: new Date(1), isInBackground: false })).rejects.toBe(failure)
  expect(peak).toBe(2)
  expect(ZenMoney.locale).toBe('uk')
})

export {}
