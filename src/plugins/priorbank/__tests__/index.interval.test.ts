import type { ExtendedTransaction, Transaction } from '../../../types/zenmoney'

jest.mock('../prior', () => ({
  assertResponseSuccess: jest.fn(),
  getCards: jest.fn(async () => ({ body: { result: [] } })),
  getCardDesc: jest.fn(async () => ({ body: { result: [] } }))
}))
jest.mock('../converters', () => ({
  convertAccounts: jest.fn(() => []),
  chooseDistinctCards: jest.fn(() => []),
  convertTransactions: jest.fn()
}))

const { convertTransactions }: { convertTransactions: jest.Mock<ExtendedTransaction[], unknown[]> } = jest.requireMock('../converters')
const { scrape }: {
  scrape: (args: { preferences: { login: string }, fromDate: Date | null, toDate: Date | null }) => Promise<{ transactions: Transaction[] }>
} = jest.requireActual('../index')

// Model invariant: converted domain records are filtered inclusively before transfer grouping.
// These records model the converter boundary; they are not bank payloads or protocol evidence.
describe('[model] Priorbank requested interval', () => {
  const previousHost = Object.getOwnPropertyDescriptor(global, 'ZenMoney')

  beforeEach(() => {
    Object.defineProperty(global, 'ZenMoney', { configurable: true, value: { getData: (key: string) => key === 'registered' } })
  })

  afterEach(() => {
    jest.clearAllMocks()
    if (previousHost === undefined) Reflect.deleteProperty(global, 'ZenMoney')
    else Object.defineProperty(global, 'ZenMoney', previousHost)
  })

  it('keeps both exact bounds and excludes operations outside them on a repeated run', async () => {
    const before: ExtendedTransaction = { date: new Date('2026-01-01T23:59:59+03:00'), hold: false, movements: [{ id: null, account: { id: 'account' }, sum: -1, invoice: null, fee: 0 }], merchant: null, comment: 'before' }
    const start: ExtendedTransaction = { date: new Date('2026-01-02T00:00:00+03:00'), hold: false, movements: [{ id: null, account: { id: 'account' }, sum: -2, invoice: null, fee: 0 }], merchant: null, comment: 'start' }
    const end: ExtendedTransaction = { date: new Date('2026-01-03T00:00:00+03:00'), hold: true, movements: [{ id: null, account: { id: 'account' }, sum: -3, invoice: null, fee: 0 }], merchant: null, comment: 'end' }
    const after: ExtendedTransaction = { date: new Date('2026-01-03T00:00:01+03:00'), hold: true, movements: [{ id: null, account: { id: 'account' }, sum: -4, invoice: null, fee: 0 }], merchant: null, comment: 'after' }
    convertTransactions.mockReturnValue([before, start, end, after])

    const result = await scrape({ preferences: { login: 'synthetic' }, fromDate: start.date, toDate: end.date })

    expect(result.transactions).toEqual([start, end])
  })

  it('keeps an included transfer half when the other half is outside the interval, without an implicit upper cutoff', async () => {
    const before: ExtendedTransaction = { date: new Date('2026-01-01T23:59:59+03:00'), hold: false, movements: [{ id: null, account: { id: 'from' }, sum: -5, invoice: null, fee: 0 }], merchant: null, comment: 'before', groupKeys: ['modeled-transfer'] }
    const included: ExtendedTransaction = { date: new Date('2026-01-02T00:00:00+03:00'), hold: false, movements: [{ id: null, account: { id: 'to' }, sum: 5, invoice: null, fee: 0 }], merchant: null, comment: 'included', groupKeys: ['modeled-transfer'] }
    const future: ExtendedTransaction = { date: new Date('2100-01-01T00:00:00+03:00'), hold: true, movements: [{ id: null, account: { id: 'to' }, sum: -1, invoice: null, fee: 0 }], merchant: null, comment: 'future' }
    convertTransactions.mockReturnValue([before, included, future])

    const result = await scrape({ preferences: { login: 'synthetic' }, fromDate: included.date, toDate: null })

    expect(result.transactions).toEqual([
      { date: new Date('2026-01-02T00:00:00+03:00'), hold: false, movements: [{ id: null, account: { id: 'to' }, sum: 5, invoice: null, fee: 0 }], merchant: null, comment: 'included' },
      future
    ])
  })

  it('rejects an invalid converted date instead of silently filtering away financial data', async () => {
    convertTransactions.mockReturnValue([{ date: new Date(Number.NaN), hold: false, movements: [{ id: null, account: { id: 'account' }, sum: -1, invoice: null, fee: 0 }], merchant: null, comment: null }])

    await expect(scrape({ preferences: { login: 'synthetic' }, fromDate: new Date('2026-01-02T00:00:00+03:00'), toDate: null })).rejects.toThrow('Invalid transaction date')
  })
})
