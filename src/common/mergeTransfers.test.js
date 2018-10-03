import { mergeTransfers } from './mergeTransfers'

describe('mergeTransfers', () => {
  it('smoky works', () => {
    const date = new Date(2020, 0, 1, 12, 0, 0)
    expect(mergeTransfers({
      items: [
        { id: 1, posted: { amount: -10, instrument: 'MNT' }, date, account: 'ACCOUNT X' },
        { id: 2, posted: { amount: +10, instrument: 'MNT' }, date, account: 'ACCOUNT Y' }
      ],
      isTransferItem: () => true,
      makeGroupKey: (item) => {
        const { amount, instrument } = item.origin || item.posted
        return `${Math.abs(amount)} ${instrument}`
      },
      selectTransactionId: (x) => x.id,
      selectReadableTransaction: (x) => x
    })).toEqual([
      {
        type: 'transfer',
        comment: null,
        date,
        hold: false,
        sides: [
          { 'account': 'ACCOUNT X', 'amount': -10, 'id': 1, 'instrument': 'MNT' },
          { 'account': 'ACCOUNT Y', 'amount': 10, 'id': 2, 'instrument': 'MNT' }
        ]
      }
    ])
  })
})
