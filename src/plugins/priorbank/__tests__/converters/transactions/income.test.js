import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        postingDate: '2020-11-09T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-11-08T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '21:41:09',
        transCurrIso: 'BYN',
        amount: 7.29,
        feeAmount: 0,
        accountAmount: 7.29,
        transDetails: 'Credit BLR MINSK I.-RES. "WWW.AISDRIVE. ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-11-08T21:41:09+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 7.29,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'BLR MINSK I.-RES. "WWW.AISDRIVE.',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        postingDate: '2020-11-07T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-11-07T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '17:16:41',
        transCurrIso: 'BYN',
        amount: 850,
        feeAmount: 0,
        accountAmount: 850,
        transDetails: 'Credit BLR MINSK PST 506 CBU 109 MINSK ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-11-07T17:16:41+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 850,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'BLR MINSK PST 506 CBU 109 MINSK',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        postingDate: '2020-11-09T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-11-07T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '16:32:40',
        transCurrIso: 'BYN',
        amount: 55.14,
        feeAmount: 0,
        accountAmount: 64.25,
        transDetails: 'Reversal. Retail BLR MINSK 21VEK.BY ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-11-07T16:32:40+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 64.25,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'BLR MINSK 21VEK.BY',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(transaction)
  })
})
