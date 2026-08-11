const mockLogin = jest.fn()
const mockLogout = jest.fn()
const mockFetchProducts = jest.fn()
const mockFetchTransactions = jest.fn()
const mockConvertAccount = jest.fn()
const mockConvertDeposit = jest.fn()
const mockConvertLoan = jest.fn()
const mockConvertTransaction = jest.fn()

jest.mock('../api', () => ({
  login: mockLogin,
  logout: mockLogout,
  fetchProducts: mockFetchProducts,
  fetchTransactions: mockFetchTransactions
}))

jest.mock('../converters', () => ({
  convertAccount: mockConvertAccount,
  convertDeposit: mockConvertDeposit,
  convertLoan: mockConvertLoan,
  convertTransaction: mockConvertTransaction
}))

const { scrape } = require('../index')

describe('PUMB scrape', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.ZenMoney = {
      getData: jest.fn(() => null),
      setData: jest.fn(),
      saveData: jest.fn(),
      isAccountSkipped: jest.fn(() => false)
    }
  })

  it('supports both product-account and product-accounts converter links', async () => {
    const session = { connection: 'connection' }
    const uahAccount = {
      id: '101-UAH',
      type: 'ccard',
      title: 'UAH',
      instrument: 'UAH',
      syncIds: ['UAH'],
      balance: 100
    }
    const usdAccount = {
      id: '101-USD',
      type: 'ccard',
      title: 'USD',
      instrument: 'USD',
      syncIds: ['USD'],
      balance: 10
    }
    const depositAccount = {
      id: '201',
      type: 'deposit',
      title: 'Deposit',
      instrument: 'UAH',
      syncIds: ['201'],
      balance: 1000
    }
    mockLogin.mockResolvedValue(session)
    mockLogout.mockResolvedValue(undefined)
    mockFetchProducts.mockResolvedValue({
      accounts: [{ id: 101 }],
      deposits: [{ id: 201 }],
      loans: []
    })
    mockConvertAccount.mockReturnValue({
      product: { id: 101, type: 'account' },
      accounts: [uahAccount, usdAccount]
    })
    mockConvertDeposit.mockReturnValue({
      product: { id: 201, type: 'deposit' },
      account: depositAccount
    })
    mockFetchTransactions.mockResolvedValue([{ id: 'raw-transaction' }])
    mockConvertTransaction.mockReturnValue({
      hold: false,
      date: new Date('2026-08-11T10:00:00Z'),
      movements: [{
        id: 'transaction-1',
        account: { id: '101-UAH' },
        invoice: null,
        sum: -10,
        fee: 0
      }],
      merchant: null,
      comment: null
    })

    await expect(scrape({
      preferences: { login: '+380501234567', password: '1234' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-11T00:00:00Z'),
      isInBackground: false
    })).resolves.toEqual({
      accounts: [uahAccount, usdAccount, depositAccount],
      transactions: [{
        hold: false,
        date: new Date('2026-08-11T10:00:00Z'),
        movements: [{
          id: 'transaction-1',
          account: { id: '101-UAH' },
          invoice: null,
          sum: -10,
          fee: 0
        }],
        merchant: null,
        comment: null
      }]
    })

    expect(mockLogin).toHaveBeenCalledWith({ login: '+380501234567', password: '1234' }, false)
    expect(mockFetchTransactions).toHaveBeenCalledWith(
      session,
      { id: 101, type: 'account' },
      new Date('2026-08-01T00:00:00Z'),
      new Date('2026-08-11T00:00:00Z')
    )
    expect(mockConvertTransaction).toHaveBeenCalledWith(
      { id: 'raw-transaction' },
      [uahAccount, usdAccount]
    )
    expect(mockLogout).toHaveBeenCalledWith(session)
  })
})
