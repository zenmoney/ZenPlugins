import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 'ABOWD00169048448',
        amount: {
          amount: -5.15,
          currIso: 'BYN'
        },
        date: '2020-03-13T13:00:02',
        description: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ Перевод между счетами  физических лиц через АК на основании  эл. сообщ. от  13.03.2020',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY50 ALFA 3014 4414 9600 9027 0000',
        operationType: 'personTransferAbb'
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY50ALFA30144414960090270000']
      },
      {
        hold: false,
        date: new Date('2020-03-13T13:00:02+03:00'),
        movements: [
          {
            id: 'ABOWD00169048448',
            account: { id: 'account' },
            invoice: null,
            sum: -5.15,
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
            sum: 5.15,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '59561910',
        title: 'Popolnenie kartochki (onlajn): RS/205390',
        amount: {
          amount: -250,
          currIso: 'BYN'
        },
        date: '2020-06-18T13:08:07',
        description: 'INTERNET-BANK AL InSync (ERIP)',
        operationAmount: null,
        cardMask: '4.0903',
        status: 'normal',
        number: 'BY21 ALFA 3014 7106 1900 6027 0000',
        operationType: 'payment'
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY21ALFA30147106190060270000']
      },
      {
        hold: false,
        date: new Date('2020-06-18T13:08:07+03:00'),
        movements: [
          {
            id: '59561910',
            account: { id: 'account' },
            invoice: null,
            sum: -250,
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
            sum: 250,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Popolnenie kartochki (onlajn): RS/205390'
      }
    ],
    [
      {
        id: '94085604',
        title: 'Kufar.by: 518953',
        amount: {
          amount: -2,
          currIso: 'BYN'
        },
        date: '2021-08-19T13:41:00',
        description: 'Оплата товаров/услуг со счета 30143094UN003',
        operationAmount: null,
        cardMask: '5.2129',
        status: 'normal',
        number: 'BY89 ALFA 3014 3094 UN00 3027 0000',
        operationType: 'payment'
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY89ALFA30143094UN0030270000']
      },
      {
        hold: false,
        date: new Date('2021-08-19T13:41:00+03:00'),
        movements: [
          {
            id: '94085604',
            account: { id: 'account' },
            invoice: null,
            sum: -2,
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
            sum: 2,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Kufar.by: 518953'
      }
    ],
    [
      {
        id: '90369741',
        title: 'Popolnenie tekuschego scheta: SL/422275',
        amount: {
          amount: -30,
          currIso: 'BYN'
        },
        date: '2021-07-10T12:15:27',
        description: 'Оплата товаров/услуг со счета 301430DTAL001',
        operationAmount: null,
        cardMask: '4.0070',
        status: 'normal',
        number: 'BY51 ALFA 3014 30DT AL00 1027 0000',
        operationType: 'payment'
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY51ALFA301430DTAL0010270000']
      },
      {
        hold: false,
        date: new Date('2021-07-10T12:15:27+03:00'),
        movements: [
          {
            id: '90369741',
            account: { id: 'account' },
            invoice: null,
            sum: -30,
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
            sum: 30,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Popolnenie tekuschego scheta: SL/422275'
      }
    ],
    [
      {
        id: '107466223',
        title: 'Plateghi TS/GhSPK AIS Raschet-GhKU: 2063701391',
        amount: {
          amount: -27.46,
          currIso: 'BYN'
        },
        date: '2021-12-23T15:51:05',
        description: 'Оплата товаров/услуг со счета 3014296517005',
        operationAmount: null,
        cardMask: '5.7764',
        status: 'normal',
        number: 'BY12 ALFA 3014 2965 1700 5027 0000',
        operationType: 'payment'
      },
      {
        id: 'account',
        instrument: 'USD',
        syncID: ['BY12ALFA30142965170050270000']
      },
      {
        hold: false,
        date: new Date('2021-12-23T15:51:05+03:00'),
        movements: [
          {
            id: '107466223',
            account: { id: 'account' },
            invoice: {
              sum: -27.46,
              instrument: 'BYN'
            },
            sum: null,
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
            sum: 27.46,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Plateghi TS/GhSPK AIS Raschet-GhKU: 2063701391'
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
