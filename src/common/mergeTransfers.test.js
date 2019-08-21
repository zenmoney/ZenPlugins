import { getSingleReadableTransactionMovement } from './converters'
import { mergeTransfers } from './mergeTransfers'

describe('mergeTransfers', () => {
  it('smoky works', () => {
    const date = new Date(2020, 0, 1, 12, 0, 0)
    expect(mergeTransfers({
      items: [
        { movements: [{ id: 1, sum: -10, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 2, sum: +10, account: { id: 'ACCOUNT Y' } }], date, hold: false, comment: null, merchant: null }
      ],
      makeGroupKey: (item) => {
        const movement = getSingleReadableTransactionMovement(item)
        return Math.abs(movement.sum)
      },
      selectReadableTransaction: (x) => x
    })).toEqual([
      {
        movements: [
          { account: { id: 'ACCOUNT X' }, sum: -10, id: 1 },
          { account: { id: 'ACCOUNT Y' }, sum: 10, id: 2 }
        ],
        date,
        hold: false,
        merchant: null,
        comment: null
      }
    ])
  })

  it('filters items with group key === null', () => {
    const date = new Date(2020, 0, 1, 12, 0, 0)
    expect(mergeTransfers({
      items: [
        { movements: [{ id: 1, sum: -10, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 1, sum: +10, account: { id: 'ACCOUNT Y' } }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: null, sum: -15, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null }
      ],
      makeGroupKey: (item) => item.movements[0].id
    })).toEqual([
      {
        movements: [
          { account: { id: 'ACCOUNT X' }, sum: -10, id: 1 },
          { account: { id: 'ACCOUNT Y' }, sum: 10, id: 1 }
        ],
        date,
        hold: false,
        merchant: null,
        comment: null
      },
      {
        movements: [{ id: null, sum: -15, account: { id: 'ACCOUNT X' } }],
        date,
        hold: false,
        comment: null,
        merchant: null
      }
    ])
  })

  it('does not pay attention to collisions if throwOnCollision = false', () => {
    const date = new Date(2020, 0, 1, 12, 0, 0)
    expect(mergeTransfers({
      items: [
        { movements: [{ id: 1, sum: -10, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 1, sum: +10, account: { id: 'ACCOUNT Y' } }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 1, sum: -15, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 2, sum: -25, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null },
        { movements: [{ id: 2, sum: 25, account: { id: 'ACCOUNT Z' } }], date, hold: false, comment: null, merchant: null }
      ],
      makeGroupKey: (item) => item.movements[0].id,
      throwOnCollision: false
    })).toEqual([
      { movements: [{ id: 1, sum: -10, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null },
      { movements: [{ id: 1, sum: +10, account: { id: 'ACCOUNT Y' } }], date, hold: false, comment: null, merchant: null },
      { movements: [{ id: 1, sum: -15, account: { id: 'ACCOUNT X' } }], date, hold: false, comment: null, merchant: null },
      {
        movements: [
          { id: 2, sum: -25, account: { id: 'ACCOUNT X' } },
          { id: 2, sum: 25, account: { id: 'ACCOUNT Z' } }
        ],
        date,
        hold: false,
        comment: null,
        merchant: null
      }
    ])
  })
})
