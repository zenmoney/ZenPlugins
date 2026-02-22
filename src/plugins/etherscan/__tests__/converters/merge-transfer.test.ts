import { Transaction } from '../../../../types/zenmoney'
import { mergeTransferTransactions } from '../../common/converters'

function makeTransaction (
  movementId: string,
  accountId: string,
  sum: number
): Transaction {
  return {
    hold: null,
    date: new Date('2026-01-01T00:00:00.000Z'),
    movements: [
      {
        id: movementId,
        account: { id: accountId },
        invoice: null,
        sum,
        fee: 0
      }
    ],
    merchant: {
      fullTitle: 'merchant',
      mcc: null,
      location: null
    },
    comment: null
  }
}

describe('mergeTransferTransactions', () => {
  it('merges only opposite sign movements with same id', () => {
    const result = mergeTransferTransactions([
      makeTransaction('hash-1', 'account-1', -100),
      makeTransaction('hash-1', 'account-2', 100)
    ])

    expect(result).toHaveLength(1)
    expect(result[0].movements).toHaveLength(2)
    expect(result[0].merchant).toBe(null)
  })

  it('does not merge fee-like movements with same sign', () => {
    const result = mergeTransferTransactions([
      makeTransaction('hash-1_fee', 'account-1', -10),
      makeTransaction('hash-1_fee', 'account-2', -10)
    ])

    expect(result).toHaveLength(2)
    expect(result[0].movements).toHaveLength(1)
    expect(result[1].movements).toHaveLength(1)
  })

  it('does not merge when one side has zero amount', () => {
    const result = mergeTransferTransactions([
      makeTransaction('hash-1_fee', 'account-1', -10),
      makeTransaction('hash-1_fee', 'account-2', 0)
    ])

    expect(result).toHaveLength(2)
    expect(result[0].movements).toHaveLength(1)
    expect(result[1].movements).toHaveLength(1)
  })
})
