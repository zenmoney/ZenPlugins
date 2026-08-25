export {}

const mockLogin = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchConvertCoinUsdtValues = jest.fn()
const mockFetchFlexibleEarnPositions = jest.fn()
const mockFetchEarnUsdtPrices = jest.fn()
const mockFetchUnifiedWallet = jest.fn()
const mockFetchExternalTransfers = jest.fn()
const mockFetchInternalTransfers = jest.fn()
const mockFetchEarnTransfers = jest.fn()
const mockFetchFinancialTransactions = jest.fn()
const mockFetchAuthorizationTransactions = jest.fn()

jest.mock('../api', () => ({
  login: mockLogin,
  fetchAccounts: mockFetchAccounts,
  fetchConvertCoinUsdtValues: mockFetchConvertCoinUsdtValues,
  fetchFlexibleEarnPositions: mockFetchFlexibleEarnPositions,
  fetchEarnUsdtPrices: mockFetchEarnUsdtPrices,
  fetchUnifiedWallet: mockFetchUnifiedWallet,
  fetchExternalTransfers: mockFetchExternalTransfers,
  fetchInternalTransfers: mockFetchInternalTransfers,
  fetchEarnTransfers: mockFetchEarnTransfers,
  fetchFinancialTransactions: mockFetchFinancialTransactions,
  fetchAuthorizationTransactions: mockFetchAuthorizationTransactions
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { scrape } = require('../index') as typeof import('../index')

describe('Bybit scrape balance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.ZenMoney = {
      isAccountSkipped: jest.fn(() => false)
    } as unknown as typeof ZenMoney

    mockLogin.mockResolvedValue({
      credentials: {
        apiKey: 'key',
        apiSecret: 'secret',
        baseUrl: 'https://api.bybit.com'
      }
    })
    mockFetchAccounts.mockResolvedValue([
      { coin: 'USDT', walletBalance: 314.3019, transferBalance: 314.3019 },
      { coin: 'USD', walletBalance: 556.32, transferBalance: 556.32 },
      { coin: 'USDC', walletBalance: 0, transferBalance: 0 }
    ])
    mockFetchConvertCoinUsdtValues.mockResolvedValue(new Map([
      ['USDT', 314.30191018945203],
      ['USDC', 0]
    ]))
    mockFetchFlexibleEarnPositions.mockResolvedValue([
      { coin: 'USDT', amount: 200, availableAmount: 200 }
    ])
    mockFetchEarnUsdtPrices.mockResolvedValue(new Map([['USDT', 1]]))
    mockFetchUnifiedWallet.mockResolvedValue({ totalEquity: 1_070.621910189452 })
    mockFetchExternalTransfers.mockResolvedValue([])
    mockFetchInternalTransfers.mockResolvedValue([])
    mockFetchEarnTransfers.mockResolvedValue([])
    mockFetchFinancialTransactions.mockResolvedValue([])
    mockFetchAuthorizationTransactions.mockResolvedValue([])
  })

  it('keeps Funding and Flexible Earn separate without a duplicate Card balance', async () => {
    const result = await scrape({
      preferences: {
        apiKey: 'key',
        apiSecret: 'secret',
        region: 'global',
        startDate: '2026-01-01T00:00:00.000Z',
        syncCard: false
      },
      fromDate: new Date('2026-08-01T00:00:00.000Z'),
      toDate: new Date('2026-08-20T00:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })

    expect(result.accounts).toMatchObject([
      { id: 'bybit_unified', balance: 1_070.621910189452 },
      { id: 'bybit_funding', balance: 870.6219101894521 },
      { id: 'bybit_flexible_earn', balance: 200 }
    ])
    expect(result.accounts.find(account => account.id === 'bybit_card')).toBeUndefined()
  })
})
