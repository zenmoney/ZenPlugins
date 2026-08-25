const mockLogin = jest.fn()
const mockFetchProducts = jest.fn()
const mockFetchTransactions = jest.fn()
const mockConvertAccounts = jest.fn()
const mockConvertTransaction = jest.fn()
const mockAdjustTransactions = jest.fn(({ transactions }) => transactions)

jest.mock('../api', () => ({
  login: mockLogin,
  fetchProducts: mockFetchProducts,
  fetchTransactions: mockFetchTransactions
}))
jest.mock('../converters', () => ({
  convertAccounts: mockConvertAccounts,
  convertTransaction: mockConvertTransaction
}))
jest.mock('../../../common/transactionGroupHandler', () => ({
  adjustTransactions: mockAdjustTransactions
}))

const { scrape } = require('../index')

describe('UKRSIB scrape orchestration', () => {
  beforeEach(() => {
    const storage = { auth: { old: true }, device: { old: true } }
    global.ZenMoney = {
      locale: null,
      getData: jest.fn(key => storage[key]),
      setData: jest.fn((key, value) => { storage[key] = value }),
      saveData: jest.fn(),
      isAccountSkipped: jest.fn(() => false)
    }
    const session = {
      authState: { authorization: 'authorization', device: { deviceId: 'device-id' } },
      isInBackground: false
    }
    const plans = [{
      account: { id: 'account-1', instrument: 'UAH' },
      fetchParams: { productIds: ['account-1'], cardIds: [] }
    }]
    mockLogin.mockResolvedValue(session)
    mockFetchProducts.mockResolvedValue({ accounts: [], cards: [], deposits: [], loans: [] })
    mockConvertAccounts.mockReturnValue(plans)
    mockFetchTransactions.mockResolvedValue([{ id: 'transaction-1' }])
    mockConvertTransaction.mockReturnValue({
      date: new Date('2026-08-01T00:00:00Z'),
      hold: false,
      movements: [{ id: 'transaction-1', account: { id: 'account-1' }, invoice: null, sum: 1, fee: 0 }],
      merchant: null,
      comment: null
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('uses Ukrainian UI, persists hot-auth state and fetches the global history once', async () => {
    const result = await scrape({
      preferences: { login: '+380991112233', password: 'password' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-02T00:00:00Z'),
      isInBackground: false
    })

    expect(ZenMoney.locale).toBe('uk')
    expect(mockLogin).toHaveBeenCalledWith(expect.any(Object), false, {
      auth: { old: true },
      device: { old: true }
    })
    expect(mockFetchTransactions).toHaveBeenCalledTimes(1)
    expect(ZenMoney.setData).toHaveBeenCalledWith('auth', expect.objectContaining({ authorization: 'authorization' }))
    expect(mockAdjustTransactions).toHaveBeenCalledWith(expect.objectContaining({
      accounts: [{ id: 'account-1', instrument: 'UAH' }]
    }))
    expect(result.transactions).toHaveLength(1)
  })
})
