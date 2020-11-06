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
        amount: -3000,
        feeAmount: 0,
        accountAmount: -7347,
        transDetails: 'CH Debit BLR MINSK P2P SDBO NO FEE ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-07-31T09:54:13+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: { sum: -3000, instrument: 'USD' },
            sum: -7347,
            fee: 0
          }
        ],
        groupKeys: ['2020-07-31_09:54:13_3000_USD'],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        postingDate: '2020-09-08T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-09-08T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '16:56:01',
        transCurrIso: 'BYN',
        amount: -13.5,
        feeAmount: 0,
        accountAmount: -13.5,
        transDetails: 'Retail BLR MINSK SOU INTERNETBANK ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-09-08T16:56:01+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -13.5,
            fee: 0
          }
        ],
        groupKeys: ['2020-09-08_16:56:01_13.5_BYN'],
        merchant: null,
        comment: null
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(transaction)
  })
})
