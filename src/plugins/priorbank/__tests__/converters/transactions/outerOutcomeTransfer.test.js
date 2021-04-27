import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        postingDate: '2020-09-14T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-09-14T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '09:38:38',
        transCurrIso: 'BYN',
        amount: -145,
        feeAmount: 0,
        accountAmount: -145,
        transDetails: 'Перевод с карты на счет Внесение первоначального взноса по договору со счёта N BY35PJCB30141110081070518933. Перевод не связан с предпринимательской деятельностью. ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-09-14T09:38:38+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -145,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 145,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Внесение первоначального взноса по договору со счёта N BY35PJCB30141110081070518933'
      }
    ],
    [
      {
        postingDate: '2020-09-14T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-09-14T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '08:11:10',
        transCurrIso: 'BYN',
        amount: -40,
        feeAmount: 0,
        accountAmount: -40,
        transDetails: 'Retail BLR MINSK MOBILE BANK ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-09-14T08:11:10+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -40,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 40,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Retail BLR MINSK MOBILE BANK'
      }
    ],
    [
      {
        postingDate: '2021-04-20T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2021-04-18T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '00:00:00',
        transCurrIso: 'RUB',
        amount: -1000,
        feeAmount: 0,
        accountAmount: -34.9,
        transDetails: 'Unique RUS MOSCOW YANDEX.MONEY ',
        hce: false
      },
      {
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: { sum: -1000, instrument: 'RUB' },
              sum: -34.9,
              fee: 0
            },
            {
              id: null,
              account: {
                type: null,
                instrument: 'RUB',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: 1000,
              fee: 0
            }
          ],
        date: new Date('2021-04-18T00:00:00+03:00'),
        hold: false,
        merchant: null,
        comment: 'Unique RUS MOSCOW YANDEX.MONEY'
      }
    ],
    [
      {
        postingDate: '2021-04-20T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2021-04-18T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '00:00:00',
        transCurrIso: 'RUB',
        amount: 0,
        feeAmount: 0,
        accountAmount: 0,
        transDetails: 'Unique RUS MOSCOW YANDEX.MONEY ',
        hce: false
      },
      null
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(transaction)
  })

  it.each([
    [
      {
        amount: 5.88,
        transAmount: 15,
        transCurrIso: 'BYN',
        transDetails: 'Retail BLR MINSK MOBILE BANK',
        transDate: '2020-11-09T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '16:09:38',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-11-09T16:09:38+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: { sum: -15, instrument: 'BYN' },
            sum: -5.88,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 15,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Retail BLR MINSK MOBILE BANK'
      }
    ],
    [
      {
        amount: 0,
        transAmount: 0,
        transCurrIso: 'BYN',
        transDetails: 'Retail BLR GOMEL I.-R. MOB.PRIL.DRIVEAN',
        transDate: '2021-04-28T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '08:31:15',
        hce: false
      },
      null
    ]
  ])('converts outer outcome transfer (aborting operations)', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'USD', id: 'account' } }, false)).toEqual(transaction)
  })
})
