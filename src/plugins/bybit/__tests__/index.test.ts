export {}

const mockLogin = jest.fn()
const mockFetchAccounts = jest.fn()
const mockFetchConvertCoinUsdtValues = jest.fn()
const mockFetchFlexibleEarnPositions = jest.fn()
const mockFetchFinancialTransactions = jest.fn()
const mockFetchAuthorizationTransactions = jest.fn()

jest.mock('../api', () => ({
  login: mockLogin,
  fetchAccounts: mockFetchAccounts,
  fetchConvertCoinUsdtValues: mockFetchConvertCoinUsdtValues,
  fetchFlexibleEarnPositions: mockFetchFlexibleEarnPositions,
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
      },
      cardBalanceCoins: new Set(['USDT', 'USDC', 'USD'])
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
    mockFetchFinancialTransactions.mockResolvedValue([])
    mockFetchAuthorizationTransactions.mockResolvedValue([])
  })

  it('uses only Funding assets for the card balance', async () => {
    const result = await scrape({
      preferences: {
        apiKey: 'key',
        apiSecret: 'secret',
        baseUrl: 'https://api.bybit.com',
        startDate: '2026-01-01T00:00:00.000Z',
        cardBalanceCoins: 'USDT, USDC'
      },
      fromDate: new Date('2026-08-01T00:00:00.000Z'),
      toDate: new Date('2026-08-20T00:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })

    expect(result.accounts[0].balance).toBeCloseTo(870.6219101894521)
    expect(mockFetchFlexibleEarnPositions).not.toHaveBeenCalled()
  })
})
