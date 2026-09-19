export {}

const mockFetchCardTransactionsPage = jest.fn()

jest.mock('../../fetchApi', () => ({
  fetchCardTransactionsPage: mockFetchCardTransactionsPage
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchAuthorizationTransactions } = require('../../api') as typeof import('../../api')

const credentials = { apiKey: 'key', apiSecret: 'secret', baseUrl: 'https://api.bybit.com' }
const DAY = 24 * 60 * 60 * 1000
const toDate = new Date('2026-09-19T12:00:00.000Z')

function authorization (txnId: string, ageInDays: number): Record<string, unknown> {
  return {
    txnId,
    orderNo: null,
    side: '1',
    tradeStatus: '0',
    txnCreate: String(toDate.getTime() - ageInDays * DAY),
    basicAmount: 7.77,
    basicCurrency: 'USD',
    baseAmount: 0,
    paidAmount: 51.1,
    paidCurrency: 'CNY',
    transactionAmount: 7.62,
    transactionCurrency: 'USD',
    transactionCurrencyAmount: 7.77,
    merchName: 'Alipay*Taxi',
    merchCity: null,
    merchCountry: null,
    mccCode: null,
    merchCategoryDesc: null,
    pan4: '1234',
    declinedReason: '0',
    totalFees: 0.15
  }
}

describe('authorization query window', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchCardTransactionsPage.mockResolvedValue({
      transactions: [authorization('RECENT', 3), authorization('STALE', 40)],
      page: 1,
      pageSize: 100,
      totalCount: 2
    })
  })

  it('asks for a fixed fourteen-day window, so the balance correction cannot depend on how much history was requested', async () => {
    await fetchAuthorizationTransactions(credentials, toDate)

    expect(mockFetchCardTransactionsPage).toHaveBeenCalledWith(credentials, expect.objectContaining({
      type: 'SIDE_QUERY_AUTH',
      createBeginTime: toDate.getTime() - 14 * DAY,
      createEndTime: toDate.getTime()
    }))
  })

  it('drops authorizations the endpoint returns from outside that window', async () => {
    const result = await fetchAuthorizationTransactions(credentials, toDate)

    // Holds must be subtracted from the balance and imported as the very same
    // set, so a row outside the window may not survive in one of the two.
    expect(result.map(entry => entry.txnId)).toEqual(['RECENT'])
  })
})
