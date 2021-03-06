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
    ],
    [
      {
        postingDate: '2021-04-22T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2021-04-21T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '00:00:00',
        transCurrIso: 'BYN',
        amount: -174.4,
        feeAmount: 0,
        accountAmount: -174.4,
        transDetails: 'Retail BLR MINSK INTERNET-MAGAZIN"FIZCULT" ',
        hce: false
      },
      {
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: null,
              sum: -174.4,
              fee: 0
            }
          ],
        date: new Date('2021-04-21T00:00:00+03:00'),
        hold: false,
        merchant:
          {
            fullTitle: 'BLR MINSK INTERNET-MAGAZIN"FIZCULT"',
            mcc: null,
            location: null
          },
        comment: null
      }
    ],
    [
      {
        postingDate: '2021-04-22T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2021-04-20T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '00:00:00',
        transCurrIso: 'RUB',
        amount: -357,
        feeAmount: 0,
        accountAmount: -12.17,
        transDetails: 'Retail RUS PODOLSK WB ',
        hce: false
      },
      {
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: { sum: -357, instrument: 'RUB' },
              sum: -12.17,
              fee: 0
            }
          ],
        date: new Date('2021-04-20T00:00:00+03:00'),
        hold: false,
        merchant: {
          fullTitle: 'RUS PODOLSK WB',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts payee', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(transaction)
  })

  it.each([
    [
      {
        amount: 24.44,
        transAmount: 24.44,
        transCurrIso: 'BYN',
        transDetails: 'Retail BLR MINSK SOU INTERNETBANK',
        transDate: '2021-02-08T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '08:47:56',
        hce: false
      },
      {
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: null,
              sum: -24.44,
              fee: 0
            }
          ],
        date: new Date('2021-02-08T08:47:56+0300'),
        hold: false,
        groupKeys: ['2021-02-08_08:47:56_24.44_BYN'],
        merchant: {
          fullTitle: 'BLR MINSK SOU INTERNETBANK',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts payee', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, false)).toEqual(transaction)
  })
})
