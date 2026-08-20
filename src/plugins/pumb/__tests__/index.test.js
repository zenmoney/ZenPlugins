const mockLogin = jest.fn()
const mockLogout = jest.fn()
const mockFetchProducts = jest.fn()
const mockFetchTransactions = jest.fn()
const mockConvertAccounts = jest.fn()
const mockConvertTransaction = jest.fn()

jest.mock('../api', () => ({
  login: mockLogin,
  logout: mockLogout,
  fetchProducts: mockFetchProducts,
  fetchTransactions: mockFetchTransactions
}))

jest.mock('../converters', () => ({
  convertAccounts: mockConvertAccounts,
  convertTransaction: mockConvertTransaction
}))

const { scrape } = require('../index')

describe('PUMB scrape', () => {
  let storage

  beforeEach(() => {
    jest.clearAllMocks()
    storage = {
      auth: { schemaVersion: 2, device: { hardwareID: 'legacy-hardware-id' } },
      device: { hardwareID: 'older-hardware-id' }
    }
    global.ZenMoney = {
      locale: null,
      getData: jest.fn((key, fallback) => Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : fallback),
      setData: jest.fn((key, value) => { storage[key] = value }),
      saveData: jest.fn(),
      isAccountSkipped: jest.fn(() => false)
    }
    mockLogout.mockResolvedValue(undefined)
  })

  it('persists successful auth only in index and consumes final convertAccounts links', async () => {
    const legacyAuth = storage.auth
    const legacyDevice = storage.device
    const session = {
      connection: 'connection',
      authState: { schemaVersion: 3, loginHash: 'login-hash', authKey: 'auth-key' }
    }
    const account = {
      id: 'account:101',
      type: 'ccard',
      title: '*1111',
      instrument: 'UAH',
      syncIds: ['UA111'],
      balance: 100
    }
    const loan = {
      id: 'loan:301',
      type: 'loan',
      title: 'Кредит',
      instrument: 'UAH',
      syncIds: ['LN-301'],
      balance: -100,
      startBalance: 100,
      capitalization: true,
      percent: null,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDateOffsetInterval: 'year',
      endDateOffset: 1,
      payoffInterval: 'month',
      payoffStep: 1
    }
    const accountLink = {
      account,
      fetchParams: { sources: [{ type: 'account', accountIds: [101] }] }
    }
    const loanLink = { account: loan, fetchParams: { sources: [] } }
    const rawProducts = { accounts: [{ id: 101 }], deposits: [], loans: [{ loanId: 301 }] }
    const inRangeTransaction = {
      hold: false,
      date: new Date('2026-08-11T10:00:00Z'),
      movements: [{ id: 'transaction-1', account: { id: 'account:101' }, invoice: null, sum: -10, fee: 0 }],
      merchant: null,
      comment: null
    }
    const outOfRangeTransaction = {
      ...inRangeTransaction,
      date: new Date('2026-07-01T10:00:00Z')
    }
    mockLogin.mockResolvedValue(session)
    mockFetchProducts.mockResolvedValue(rawProducts)
    mockConvertAccounts.mockReturnValue([accountLink, loanLink])
    mockFetchTransactions.mockResolvedValue([{ id: 'in-range' }, { id: 'out-of-range' }])
    mockConvertTransaction
      .mockReturnValueOnce(inRangeTransaction)
      .mockReturnValueOnce(outOfRangeTransaction)

    await expect(scrape({
      preferences: { login: '380501234567', password: '1234' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-12T00:00:00Z'),
      isInBackground: false
    })).resolves.toEqual({
      accounts: [account, loan],
      transactions: [inRangeTransaction]
    })

    expect(ZenMoney.locale).toBe('uk')
    expect(mockLogin).toHaveBeenCalledWith(
      { login: '380501234567', password: '1234' },
      false,
      { auth: legacyAuth, legacyDevice }
    )
    expect(storage.auth).toBe(session.authState)
    expect(mockConvertAccounts).toHaveBeenCalledWith(rawProducts)
    expect(mockFetchTransactions).toHaveBeenCalledWith(
      session,
      accountLink.fetchParams,
      new Date('2026-08-01T00:00:00Z'),
      new Date('2026-08-12T00:00:00Z')
    )
    expect(mockFetchTransactions).toHaveBeenCalledTimes(1)
    expect(mockConvertTransaction).toHaveBeenCalledWith({ id: 'in-range' }, accountLink)
    expect(mockLogout).toHaveBeenCalledWith(session)
  })

  it('does not let logout failure hide a completed synchronization', async () => {
    mockLogin.mockResolvedValue({ authState: { schemaVersion: 3 } })
    mockFetchProducts.mockResolvedValue({ accounts: [], deposits: [], loans: [] })
    mockConvertAccounts.mockReturnValue([])
    mockLogout.mockRejectedValue(new Error('close failed'))

    await expect(scrape({
      preferences: { login: '380501234567', password: '1234' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-12T00:00:00Z'),
      isInBackground: false
    })).resolves.toEqual({ accounts: [], transactions: [] })
  })
})
