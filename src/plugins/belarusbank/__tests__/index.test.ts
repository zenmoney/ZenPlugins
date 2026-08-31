import { BankMessageError } from '../../../errors'
import { AccountType } from '../../../types/zenmoney'
import type { AuthState, ProductAccount } from '../models'

// Test records are synthetic and must not be copied from real bank data.
const mockAuthenticate = jest.fn()
const mockGetProducts = jest.fn()
const mockGetCardTransactions = jest.fn()
const mockGetGeneralPaymentHistory = jest.fn()
const mockGetStatementTransactions = jest.fn()
let pluginData: Map<string, unknown>

jest.mock('../api', () => ({
  authenticate: mockAuthenticate,
  getProducts: mockGetProducts,
  getCardTransactions: mockGetCardTransactions,
  getGeneralPaymentHistory: mockGetGeneralPaymentHistory,
  getStatementTransactions: mockGetStatementTransactions
}))

const { scrape } = jest.requireActual<typeof import('../index')>('../index')

describe('Belarusbank scrape', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset()
    mockGetProducts.mockReset()
    mockGetCardTransactions.mockReset()
    mockGetGeneralPaymentHistory.mockReset().mockResolvedValue([])
    mockGetStatementTransactions.mockReset().mockResolvedValue([])
    pluginData = new Map<string, unknown>()
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: {
        isAccountSkipped: jest.fn(() => false),
        getData: jest.fn((key: string, defaultValue: unknown) => pluginData.get(key) ?? defaultValue),
        setData: jest.fn((key: string, value: unknown) => pluginData.set(key, value)),
        saveData: jest.fn()
      } as unknown as typeof ZenMoney
    })
  })

  it('loads the full statement first and supplements it with general payment history', async () => {
    const auth: AuthState = {
      login: 'test-login',
      sessionToken: 'session-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer'
    }
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    mockAuthenticate.mockResolvedValue(auth)
    mockGetProducts.mockResolvedValue([card])
    mockGetCardTransactions.mockResolvedValue([])

    await expect(scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2025-01-01T00:00:00Z'),
      toDate: new Date('2026-08-29T00:00:00Z'),
      isFirstRun: true,
      isInBackground: false
    })).resolves.toEqual({
      accounts: [card],
      transactions: []
    })
    expect(mockGetStatementTransactions).toHaveBeenCalledWith(
      auth,
      card,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2026-08-29T00:00:00Z')
    )
    expect(mockGetGeneralPaymentHistory).toHaveBeenCalledWith(
      auth,
      [card],
      new Date('2025-01-01T00:00:00Z'),
      new Date('2026-08-29T00:00:00Z')
    )
    expect(mockGetStatementTransactions.mock.invocationCallOrder[0]).toBeLessThan(mockGetGeneralPaymentHistory.mock.invocationCallOrder[0])
    expect(mockGetCardTransactions).not.toHaveBeenCalled()
    expect(ZenMoney.setData).not.toHaveBeenCalled()
  })

  it('removes the legacy transaction-id state without creating a replacement', async () => {
    pluginData.set('belarusbankTransactionIds', {
      statementIds: ['old-statement-id'],
      historyIds: ['old-history-id']
    })
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([])

    await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-31T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })

    expect(ZenMoney.setData).toHaveBeenCalledTimes(1)
    expect(ZenMoney.setData).toHaveBeenCalledWith('belarusbankTransactionIds', undefined)
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it('adds general payment history without duplicating matching statement operations', async () => {
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    const paymentHistoryDate = new Date('2026-02-05T09:10:21Z')
    const statementDate = new Date('2026-02-05T12:10:21+03:00')
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([card])
    mockGetGeneralPaymentHistory.mockResolvedValue([{
      hold: false,
      date: paymentHistoryDate,
      comment: 'Payment history duplicate',
      merchant: null,
      movements: [{ id: 'payment-duplicate', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
    }, {
      hold: false,
      date: new Date('2026-02-02T11:00:00+03:00'),
      comment: 'Payment history only',
      merchant: null,
      movements: [{ id: 'payment-only', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -7 }]
    }])
    mockGetStatementTransactions.mockResolvedValue([{
      hold: null,
      date: statementDate,
      comment: 'Statement operation',
      merchant: null,
      movements: [{ id: 'card-operation', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
    }])

    const result = await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-02-01T00:00:00Z'),
      toDate: new Date('2026-08-29T00:00:00Z'),
      isFirstRun: true,
      isInBackground: false
    })

    expect(result.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        comment: 'Statement operation',
        movements: [expect.objectContaining({ id: expect.stringMatching(/^[a-f0-9]{32}$/), sum: -20.5 })]
      }),
      expect.objectContaining({ comment: 'Payment history only' })
    ]))
    expect(result.transactions).toHaveLength(2)
    expect(mockGetCardTransactions).not.toHaveBeenCalled()
  })

  it('generates the same id when app history arrives before the statement', async () => {
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    const date = new Date('2026-02-01T10:20:30Z')
    const history = [{
      hold: false,
      date,
      comment: 'Тестовая составная операция',
      merchant: null,
      movements: [{ id: 'rrn-composite', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -2.8 }]
    }, {
      hold: false,
      date,
      comment: 'Другая операция',
      merchant: null,
      movements: [{ id: 'unrelated', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -7 }]
    }]
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([card])
    mockGetGeneralPaymentHistory.mockResolvedValue(history)
    mockGetStatementTransactions.mockResolvedValueOnce([])

    const firstResult = await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-04T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })
    const composite = firstResult.transactions.find((transaction) => transaction.comment === 'Тестовая составная операция')
    expect(firstResult.transactions).toHaveLength(2)
    expect(composite).toMatchObject({
      movements: [{ sum: -2.8 }]
    })
    const compositeId = composite?.movements[0].id
    expect(compositeId).toEqual(expect.stringMatching(/^[a-f0-9]{32}$/))
    expect(compositeId).not.toBe('rrn-composite')

    mockGetStatementTransactions.mockResolvedValueOnce([{
      hold: false,
      date,
      comment: 'USLUGI BANKA БЕЛАРУСЬ',
      merchant: null,
      movements: [{ id: 'statement-id', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -2.8 }]
    }])
    const secondResult = await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-04T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })

    expect(secondResult.transactions).toHaveLength(2)
    expect(secondResult.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        comment: 'USLUGI BANKA БЕЛАРУСЬ',
        movements: [expect.objectContaining({ id: compositeId, sum: -2.8 })]
      }),
      expect.objectContaining({ comment: 'Другая операция' })
    ]))

    mockGetGeneralPaymentHistory.mockResolvedValueOnce([])
    mockGetStatementTransactions.mockResolvedValueOnce([{
      hold: false,
      date,
      comment: 'USLUGI BANKA БЕЛАРУСЬ',
      merchant: null,
      movements: [{ id: 'statement-id', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -2.8 }]
    }])
    const thirdResult = await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-04T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })

    expect(thirdResult.transactions).toHaveLength(1)
    expect(thirdResult.transactions[0].movements[0].id).toBe(compositeId)
  })

  it('generates the same id when the statement arrives before app history', async () => {
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    const date = new Date('2026-02-05T09:10:21Z')
    const statement = {
      hold: false,
      date,
      comment: 'Выписка',
      merchant: null,
      movements: [{ id: 'statement-first', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
    }
    const history = {
      hold: false,
      date,
      comment: 'История приложения',
      merchant: null,
      movements: [{ id: 'history-later', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
    }
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([card])
    mockGetStatementTransactions.mockResolvedValue([statement])
    mockGetGeneralPaymentHistory
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([history])

    const scrapeArgs = {
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-02-01T00:00:00Z'),
      toDate: new Date('2026-02-06T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    }
    const firstResult = await scrape(scrapeArgs)
    const secondResult = await scrape(scrapeArgs)
    const stableId = firstResult.transactions[0].movements[0].id

    expect(stableId).toEqual(expect.stringMatching(/^[a-f0-9]{32}$/))
    expect(stableId).not.toBe('statement-first')
    expect(secondResult.transactions).toHaveLength(1)
    expect(secondResult.transactions[0]).toMatchObject({
      comment: 'Выписка',
      movements: [{ id: stableId, sum: -20.5 }]
    })

    mockGetStatementTransactions.mockResolvedValueOnce([])
    mockGetGeneralPaymentHistory.mockResolvedValueOnce([{
      hold: false,
      date,
      comment: 'История приложения',
      merchant: null,
      movements: [{ id: 'history-later', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
    }])
    const thirdResult = await scrape(scrapeArgs)

    expect(thirdResult.transactions).toHaveLength(1)
    expect(thirdResult.transactions[0]).toMatchObject({
      comment: 'История приложения',
      movements: [{ id: stableId, sum: -20.5 }]
    })
  })

  it('does not merge equal amounts whose operation times differ', async () => {
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([card])
    mockGetStatementTransactions.mockResolvedValue([{
      hold: false,
      date: new Date('2026-02-05T09:10:21Z'),
      comment: 'Выписка',
      merchant: null,
      movements: [{ id: 'statement', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
    }])
    mockGetGeneralPaymentHistory.mockResolvedValue([{
      hold: false,
      date: new Date('2026-02-05T09:10:22Z'),
      comment: 'Другая операция',
      merchant: null,
      movements: [{ id: 'history', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
    }])

    const result = await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-02-01T00:00:00Z'),
      toDate: new Date('2026-02-06T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })

    expect(result.transactions).toHaveLength(2)
  })

  it('keeps source-specific ids when same-second statement operations are ambiguous', async () => {
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    const date = new Date('2026-02-05T09:10:21Z')
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([card])
    mockGetStatementTransactions.mockResolvedValue([
      {
        hold: false,
        date,
        comment: 'Первая операция',
        merchant: null,
        movements: [{ id: 'statement-1', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
      },
      {
        hold: false,
        date,
        comment: 'Вторая операция',
        merchant: null,
        movements: [{ id: 'statement-2', account: { id: 'card-1' }, fee: 0, invoice: null, sum: -20.5 }]
      }
    ])

    const result = await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-02-01T00:00:00Z'),
      toDate: new Date('2026-02-06T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })

    expect(result.transactions).toHaveLength(2)
    expect(result.transactions.map((transaction) => transaction.movements[0].id)).toEqual([
      'statement-1',
      'statement-2'
    ])
  })

  it('does not hide bank errors while loading the primary statement', async () => {
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([card])
    mockGetStatementTransactions.mockRejectedValue(new BankMessageError('Unauthorized'))

    await expect(scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-08-01T00:00:00Z'),
      toDate: new Date('2026-08-29T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })).rejects.toMatchObject({ bankMessage: 'Unauthorized' })
    expect(mockGetCardTransactions).not.toHaveBeenCalled()
  })

  it('loads the entire requested period through the official statement endpoint', async () => {
    const card: ProductAccount = {
      id: 'card-1',
      type: AccountType.ccard,
      title: 'Card',
      instrument: 'BYN',
      balance: 1,
      syncIds: ['card-1'],
      _meta: {
        productId: 'card-1',
        transactionCardId: 'card-1',
        statementProductId: 'card-1',
        productKind: 'card'
      }
    }
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([card])

    await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-01-01T00:00:00Z'),
      toDate: new Date('2026-08-29T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })

    expect(mockGetStatementTransactions).toHaveBeenCalledWith(
      {},
      card,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-08-29T00:00:00Z')
    )
    expect(mockGetCardTransactions).not.toHaveBeenCalled()
  })

  it('merges the debit and credit parts of an own-card currency transfer', async () => {
    const bynCard: ProductAccount = {
      id: 'byn-card',
      type: AccountType.ccard,
      title: 'BYN Card',
      instrument: 'BYN',
      balance: 67.89,
      syncIds: ['byn-card'],
      _meta: {
        productId: 'byn-card',
        transactionCardId: 'byn-card',
        statementProductId: 'byn-card',
        productKind: 'card'
      }
    }
    const rubCard: ProductAccount = {
      id: 'rub-card',
      type: AccountType.ccard,
      title: 'RUB Card',
      instrument: 'RUB',
      balance: 0,
      syncIds: ['rub-card'],
      _meta: {
        productId: 'rub-card',
        transactionCardId: 'rub-card',
        statementProductId: 'rub-card',
        productKind: 'card'
      }
    }
    const date = new Date('2026-02-03T12:34:56+03:00')
    const groupKeys = ['belarusbank:p2p:2026-02-03T09:34:56.000Z:RUB:123.45']
    mockAuthenticate.mockResolvedValue({})
    mockGetProducts.mockResolvedValue([bynCard, rubCard])
    mockGetStatementTransactions.mockImplementation(async (_auth, account: ProductAccount) => account.id === 'byn-card'
      ? [{
          hold: null,
          date,
          groupKeys,
          comment: 'P2P Credit part',
          merchant: null,
          movements: [{
            id: 'income',
            account: { id: 'byn-card' },
            fee: 0,
            invoice: { sum: 123.45, instrument: 'RUB' },
            sum: 67.89
          }]
        }]
      : [{
          hold: null,
          date,
          groupKeys,
          comment: 'P2P Debit part',
          merchant: null,
          movements: [{
            id: 'outcome',
            account: { id: 'rub-card' },
            fee: 0,
            invoice: null,
            sum: -123.45
          }]
        }])

    const result = await scrape({
      preferences: { login: 'test-login', password: 'test-password' },
      fromDate: new Date('2026-02-03T00:00:00Z'),
      toDate: new Date('2026-02-03T23:59:59Z'),
      isFirstRun: false,
      isInBackground: true
    })

    expect(result.transactions).toEqual([expect.objectContaining({
      date,
      comment: 'P2P Debit part',
      movements: [
        expect.objectContaining({ account: { id: 'rub-card' }, invoice: null, sum: -123.45 }),
        expect.objectContaining({ account: { id: 'byn-card' }, invoice: null, sum: 67.89 })
      ]
    })])
    expect(mockGetCardTransactions).not.toHaveBeenCalled()
  })
})
