import { InvalidPreferencesError } from '../../../errors'

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

function cardEntry (overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    txnId: 'TXN',
    orderNo: null,
    side: '1',
    tradeStatus: '0',
    txnCreate: '1789818780000',
    basicAmount: 0,
    basicCurrency: 'USD',
    baseAmount: 0,
    paidAmount: 0,
    paidCurrency: 'CNY',
    transactionAmount: 0,
    transactionCurrency: 'USD',
    transactionCurrencyAmount: 0,
    merchName: 'Alipay*Taxi',
    merchCity: 'Shanghai',
    merchCountry: 'CHN',
    mccCode: 4121,
    merchCategoryDesc: '4121',
    pan4: '1234',
    declinedReason: '0',
    totalFees: 0,
    ...overrides
  }
}

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
  it('does not count parked fiat that an open authorization already spent', async () => {
    // Bybit sells the coin the moment a purchase is authorized and parks the
    // proceeds in Funding, so the wallet still reports them while the very same
    // purchase is imported as a hold.
    mockFetchAuthorizationTransactions.mockResolvedValue([
      cardEntry({ txnId: '2000000000000101', basicAmount: 1.98, transactionAmount: 1.94, totalFees: 0.04, paidAmount: 13 }),
      cardEntry({ txnId: '2000000000000104', basicAmount: 7.77, transactionAmount: 7.62, totalFees: 0.15, paidAmount: 51.1 }),
      cardEntry({ txnId: '2000000000000105', tradeStatus: '1', basicAmount: 2.27, transactionAmount: 2.23, totalFees: 0.04, paidAmount: 14.98 })
    ])

    const result = await scrape({
      preferences: {
        apiKey: 'key',
        apiSecret: 'secret',
        region: 'global',
        startDate: '2026-01-01T00:00:00.000Z',
        syncCard: true,
        cardPaymentSource: 'funding',
        cardConversionFeePercent: '1.41'
      },
      fromDate: new Date('2026-09-18T00:00:00.000Z'),
      toDate: new Date('2026-09-19T12:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })

    // 870.6219101894521 reported, minus the 9.75 still parked for two open holds.
    const funding = result.accounts.find(account => account.id === 'bybit_funding')
    expect(funding?.balance).toBeCloseTo(860.8719101894521, 8)

    // The cleared authorization is not imported and not deducted: its financial
    // record carries a different txnId and arrives on its own.
    expect(result.transactions).toHaveLength(2)
    const taxi = result.transactions.find(transaction => transaction.movements[0].id === '2000000000000104')
    expect(taxi?.hold).toBe(true)
    expect(taxi?.movements[0]).toMatchObject({ sum: -7.62, fee: -0.26 })
  })
  it('leaves Funding alone when the card is not synchronized at all', async () => {
    // No holds are imported, so the parked fiat is not accounted for twice and
    // must stay in the balance.
    mockFetchAuthorizationTransactions.mockResolvedValue([
      cardEntry({ txnId: 'PENDING', basicAmount: 7.77, transactionAmount: 7.62, totalFees: 0.15 })
    ])

    const result = await scrape({
      preferences: { apiKey: 'key', apiSecret: 'secret', region: 'global', startDate: '2026-01-01T00:00:00.000Z', syncCard: false },
      fromDate: new Date('2026-09-18T00:00:00.000Z'),
      toDate: new Date('2026-09-19T12:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })

    expect(mockFetchAuthorizationTransactions).not.toHaveBeenCalled()
    expect(result.accounts.find(account => account.id === 'bybit_funding')?.balance).toBeCloseTo(870.6219101894521, 8)
  })

  it('neither imports nor deducts when the settlement account is skipped', async () => {
    global.ZenMoney = {
      isAccountSkipped: jest.fn((id: string) => id === 'bybit_funding')
    } as unknown as typeof ZenMoney
    mockFetchAuthorizationTransactions.mockResolvedValue([
      cardEntry({ txnId: 'PENDING', basicAmount: 7.77, transactionAmount: 7.62, totalFees: 0.15 })
    ])

    const result = await scrape({
      preferences: { apiKey: 'key', apiSecret: 'secret', region: 'global', startDate: '2026-01-01T00:00:00.000Z', syncCard: true, cardPaymentSource: 'funding' },
      fromDate: new Date('2026-09-18T00:00:00.000Z'),
      toDate: new Date('2026-09-19T12:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })

    expect(result.transactions).toHaveLength(0)
    expect(result.accounts.find(account => account.id === 'bybit_funding')?.balance).toBeCloseTo(870.6219101894521, 8)
  })

  it('debits Flexible Earn for the purchase but corrects Funding, where the fiat is parked', async () => {
    mockFetchAuthorizationTransactions.mockResolvedValue([
      cardEntry({ txnId: 'HOLD-1', basicAmount: 1.98, transactionAmount: 1.94, totalFees: 0.04 }),
      cardEntry({ txnId: 'HOLD-2', basicAmount: 7.77, transactionAmount: 7.62, totalFees: 0.15 })
    ])

    const result = await scrape({
      preferences: { apiKey: 'key', apiSecret: 'secret', region: 'global', startDate: '2026-01-01T00:00:00.000Z', syncCard: true, cardPaymentSource: 'earn' },
      fromDate: new Date('2026-09-18T00:00:00.000Z'),
      toDate: new Date('2026-09-19T12:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })

    expect(result.transactions.map(transaction => transaction.movements[0].account)).toEqual([
      { id: 'bybit_flexible_earn' },
      { id: 'bybit_flexible_earn' }
    ])
    expect(result.accounts.find(account => account.id === 'bybit_flexible_earn')?.balance).toBe(200)
    expect(result.accounts.find(account => account.id === 'bybit_funding')?.balance).toBeCloseTo(860.8719101894521, 8)
  })

  it('rejects a malformed conversion fee before spending a synchronization on it', async () => {
    await expect(scrape({
      preferences: { apiKey: 'key', apiSecret: 'secret', region: 'global', startDate: '2026-01-01T00:00:00.000Z', syncCard: true, cardPaymentSource: 'funding', cardConversionFeePercent: '1e1' },
      fromDate: new Date('2026-09-18T00:00:00.000Z'),
      toDate: new Date('2026-09-19T12:00:00.000Z'),
      isFirstRun: false,
      isInBackground: false
    })).rejects.toBeInstanceOf(InvalidPreferencesError)

    expect(mockFetchAccounts).not.toHaveBeenCalled()
  })
})
