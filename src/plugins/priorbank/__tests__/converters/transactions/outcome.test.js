import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        postingDate: '2020-09-11T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-09-10T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '00:00:00',
        transCurrIso: 'BYN',
        amount: -1.57,
        feeAmount: 0,
        accountAmount: -1.57,
        transDetails: 'Retail BLR MINSK STOLOVAYA SSH N6 ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-09-10T00:00:00+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -1.57,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'BLR MINSK STOLOVAYA SSH N6',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        postingDate: '2020-11-06T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-11-06T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '16:25:06',
        transCurrIso: 'BYN',
        amount: -27.5,
        feeAmount: 0.19,
        accountAmount: -27.31,
        transDetails: 'Retail BLR Minsk Gippo ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-11-06T16:25:06+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -27.31,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'BLR Minsk Gippo',
          mcc: null,
          location: null
        },
        comment: '0.19 BYN cashback'
      }
    ]
  ])('converts payee', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(transaction)
  })
})
