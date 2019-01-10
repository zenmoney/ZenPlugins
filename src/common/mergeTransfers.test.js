import { getSingleReadableTransactionMovement } from './converters'
import { mergeTransfers } from './mergeTransfers'

describe('mergeTransfers', () => {
  it('smoky works', () => {
    const date = new Date(2020, 0, 1, 12, 0, 0)
    expect(mergeTransfers({
      items: [
        { movements: [{ id: 1, sum: -10, account: 'ACCOUNT X' }], date },
        { movements: [{ id: 2, sum: +10, account: 'ACCOUNT Y' }], date }
      ],
      isTransferItem: () => true,
      makeGroupKey: (item) => {
        const movement = getSingleReadableTransactionMovement(item)
        return Math.abs(movement.sum)
      },
      selectTransactionId: (x) => getSingleReadableTransactionMovement(x).id,
      selectReadableTransaction: (x) => x
    })).toEqual([
      {
        movements: [
          { account: 'ACCOUNT X', sum: -10, id: 1 },
          { account: 'ACCOUNT Y', sum: 10, id: 2 }
        ],
        date,
        hold: false,
        merchant: null,
        comment: null
      }
    ])
  })
})
