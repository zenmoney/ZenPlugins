import { appendTransactions } from '../../common/converters'
import type { Transaction } from '../../../../types/zenmoney'

const transaction: Transaction = {
  hold: null,
  date: new Date('2026-01-01T00:00:00.000Z'),
  movements: [{
    id: '1',
    account: { id: 'account' },
    invoice: null,
    sum: 1,
    fee: 0
  }],
  merchant: null,
  comment: null
}

describe('appendTransactions', () => {
  it('appends large transaction batches without argument spreading', () => {
    const target: Transaction[] = []
    const transactions: Transaction[] = Array.from(
      { length: 200000 },
      (_, index): Transaction => ({
        ...transaction,
        movements: [{
          ...transaction.movements[0],
          id: String(index)
        }]
      })
    )

    appendTransactions(target, transactions)

    expect(target).toHaveLength(transactions.length)
    expect(target[199999].movements[0].id).toBe('199999')
  })
})
