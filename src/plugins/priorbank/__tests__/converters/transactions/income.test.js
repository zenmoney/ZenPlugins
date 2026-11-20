import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  // Complete CardDesc records from zenmoney_plugin_log_2026-11-16-09-55-54.log,
  // response 1 (publication build absent). Amounts, dates and account identifiers are synthetic.
  it.each([
    [
      {
        postingDate: '2026-01-06T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2026-01-06T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '00:00:00',
        transCurrIso: 'BYN',
        amount: 100,
        feeAmount: 0,
        accountAmount: 100,
        transDetails: 'Поступление на контракт клиента 000001-00002-000003  ',
        hce: false
      },
      {
        movements: [{ id: null, account: { id: 'account' }, invoice: null, sum: 100, fee: 0 }],
        date: new Date('2026-01-06T00:00:00+03:00'),
        hold: false,
        merchant: null,
        comment: null
      }
    ],
    [
      {
        postingDate: '2026-01-09T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2026-01-06T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '22:19:30',
        transCurrIso: 'BYN',
        amount: 50,
        feeAmount: 0,
        accountAmount: 50,
        transDetails: 'Зачисление денежных средств   Онлайн пополнение счета IBAN: BY00PJCB00000000000000000000  ',
        hce: false
      },
      {
        movements: [{ id: null, account: { id: 'account' }, invoice: null, sum: 50, fee: 0 }],
        date: new Date('2026-01-06T22:19:30+03:00'),
        hold: false,
        merchant: null,
        comment: 'Онлайн пополнение счета'
      }
    ]
  ])('removes technical contract references and preserves the online top-up purpose', (source, expected) => {
    expect(convertTransaction(source, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(expected)
  })

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
          title: 'I.-RES. "WWW.AISDRIVE.',
          city: 'MINSK',
          country: 'BLR',
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
          title: 'PST 506 CBU 109 MINSK',
          city: 'MINSK',
          country: 'BLR',
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
          title: '21VEK.BY',
          city: 'MINSK',
          country: 'BLR',
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
