import { JupiterTransaction } from '../../models'

const mockFetchJson = jest.fn()

jest.mock('../../../../common/network', () => ({ fetchJson: mockFetchJson }))

function tx (id: string, day: string): JupiterTransaction {
  return {
    id,
    type: 'CARD',
    direction: 'DEBIT',
    settlementCurrency: 'USD',
    settlementAmount: '10.00',
    transactionCurrency: 'USD',
    transactionAmount: '10.00',
    onchainSignature: null,
    transactionTimestamp: `2026-03-${day}T12:00:00.000Z`,
    card: null
  }
}

const page = (data: JupiterTransaction[], totalPages: number): unknown => ({
  status: 200, url: '', headers: {}, body: { data, meta: { totalPages } }
})

describe('fetchTransactions — pagination', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetchTransactions } = require('../../fetchApi') as typeof import('../../fetchApi')
  const fromDate = new Date('2026-01-01T00:00:00Z')

  afterEach(() => { jest.clearAllMocks() })

  it('drops a record returned twice by the page-shift race', async () => {
    // A transaction arriving mid-crawl shifts every later page down, so the record
    // on a page boundary comes back on BOTH pages. Emitting it twice would put a
    // duplicate transaction in the ledger (ZenMoney only dedups by a non-null id).
    const a = tx('a', '03')
    const b = tx('b', '02')
    const c = tx('c', '01')
    mockFetchJson
      .mockResolvedValueOnce(page([a, b], 2))
      .mockResolvedValueOnce(page([b, c], 2)) // b repeated

    const result = await fetchTransactions(2026, fromDate)
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('still returns every distinct transaction across pages', async () => {
    mockFetchJson
      .mockResolvedValueOnce(page([tx('a', '03')], 2))
      .mockResolvedValueOnce(page([tx('b', '02')], 2))
    const result = await fetchTransactions(2026, fromDate)
    expect(result.map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('keeps paging past a page that ends before fromDate', async () => {
    // Jupiter does NOT guarantee newest-first ordering. Stopping as soon as a page ends
    // older than fromDate — as this used to — truncates everything behind it the moment
    // one row lands out of order. Here page 1 ends with an out-of-window record while
    // page 2 still holds a wanted one.
    const wanted = tx('wanted', '20')
    const older = { ...tx('older', '01'), transactionTimestamp: '2025-06-01T00:00:00.000Z' }
    mockFetchJson
      .mockResolvedValueOnce(page([tx('a', '25'), older], 2))
      .mockResolvedValueOnce(page([wanted], 2))

    const result = await fetchTransactions(2026, new Date('2026-03-01T00:00:00Z'))
    expect(result.map((t) => t.id)).toContain('wanted')
    expect(mockFetchJson).toHaveBeenCalledTimes(2)
  })

  it('stops at the page cap instead of crawling forever', async () => {
    // an API that never reports totalPages and always returns a full page
    mockFetchJson.mockImplementation(async () => page([tx(String(Math.random()), '01')], 0))
    await fetchTransactions(2026, fromDate)
    expect(mockFetchJson.mock.calls.length).toBeLessThanOrEqual(100)
  })
})
