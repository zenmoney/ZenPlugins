import { getSingleReadableTransactionMovement } from './converters'
import { mergeTransfers } from './mergeTransfers'

describe('mergeTransfers', () => {
  it('smoky works', () => {
    const date = new Date(2020, 0, 1, 12, 0, 0)
    expect(mergeTransfers({
      items: [
        { movements: [{ id: 1, sum: -10, account: 'ACCOUNT X' }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 2, sum: +10, account: 'ACCOUNT Y' }], date, hold: false, comment: null, merchant: null }
      ],
      isTransferItem: () => true,
      makeGroupKey: (item) => {
        const movement = getSingleReadableTransactionMovement(item)
        return Math.abs(movement.sum)
      },
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

  it('filters items with group key === null in weak mode', () => {
    const date = new Date(2020, 0, 1, 12, 0, 0)
    expect(mergeTransfers({
      items: [
        { movements: [{ id: 1, sum: -10, account: 'ACCOUNT X' }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 1, sum: +10, account: 'ACCOUNT Y' }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 2, sum: -15, account: 'ACCOUNT X' }], date, hold: false, comment: null, merchant: null }
      ],
      makeGroupKey: (item) => item.movements[0].id || null
    })).toEqual([
      {
        movements: [
          { account: 'ACCOUNT X', sum: -10, id: 1 },
          { account: 'ACCOUNT Y', sum: 10, id: 1 }
        ],
        date,
        hold: false,
        merchant: null,
        comment: null
      },
      {
        movements: [{ id: 2, sum: -15, account: 'ACCOUNT X' }],
        date,
        hold: false,
        comment: null,
        merchant: null
      }
    ])
  })
})
