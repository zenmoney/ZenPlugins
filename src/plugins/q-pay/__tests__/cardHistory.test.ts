import { Transaction } from '../../../types/zenmoney'
import { convertCardHistory } from '../converters'

describe('[model] Q-Pay best-effort card history', () => {
  afterEach(() => { jest.restoreAllMocks() })

  // Inject a local conversion failure at the callback boundary. Domain results
  // and opaque source tokens exercise continuation without inventing API data.
  it('keeps successful transactions before and after a failed record without leaking its data', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const first: Transaction = {
      hold: false,
      date: new Date('2026-01-01T00:00:00Z'),
      movements: [{ id: 'model-first', account: { id: 'model-card' }, sum: -1, fee: 0, invoice: null }],
      merchant: null,
      comment: null
    }
    const last: Transaction = {
      hold: false,
      date: new Date('2026-01-02T00:00:00Z'),
      movements: [{ id: 'model-last', account: { id: 'model-card' }, sum: -2, fee: 0, invoice: null }],
      merchant: null,
      comment: null
    }
    const convert = jest.fn<Transaction | null, [unknown]>()
      .mockReturnValueOnce(first)
      .mockImplementationOnce(() => { throw new Error('model-private-token') })
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(last)

    expect(convertCardHistory(['first', 'model-private-source', 'empty', 'last'], convert)).toEqual([first, last])
    expect(warn.mock.calls).toEqual([[
      'Q-Pay skipped a card transaction after a conversion error',
      { index: 1 }
    ]])
  })
})
