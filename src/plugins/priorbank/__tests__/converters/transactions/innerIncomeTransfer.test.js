import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        postingDate: '2020-07-31T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-07-31T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '09:54:13',
        transCurrIso: 'USD',
        amount: 3000,
        feeAmount: 0,
        accountAmount: 3000,
        transDetails: 'CH Payment BLR MINSK P2P SDBO NO FEE ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-07-31T09:54:13+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 3000,
            fee: 0
          }
        ],
        groupKeys: ['2020-07-31_09:54:13_3000_USD'],
        merchant: null,
        comment: null
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'USD', id: 'account' } }, true)).toEqual(transaction)
  })
})
