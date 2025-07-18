import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: null,
        amount: { amount: -1.51, currIso: 'BYN' },
        date: '2020-03-23T23:05:28',
        description: 'Перевод на копилку по механике От округлений',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY50 ALFA 3014 4414 9600 9027 0000',
        operationType: null
      },
      { id: 'account', instrument: 'BYN', syncID: ['BY50ALFA30144414960090270000'] },
      {
        hold: false,
        date: new Date('2020-03-23T23:05:28+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -1.51,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод на копилку по механике От округлений'
      }
    ],
    [
      {
        id: '53626703',
        amount: { amount: -10, currIso: 'BYN' },
        date: '2020-03-17T20:28:12',
        description: 'ONLINE SERVICE InSync (ERIP)',
        operationAmount: null,
        cardMask: '5.5064',
        status: 'normal',
        number: 'BY50 ALFA 3014 4414 9600 9027 0000',
        operationType: 'payment'
      },
      { id: 'account', instrument: 'BYN', syncID: ['BY50ALFA30144414960090270000'] },
      {
        hold: false,
        date: new Date('2020-03-17T20:28:12+03:00'),
        movements: [
          {
            id: '53626703',
            account: { id: 'account' },
            invoice: null,
            sum: -10,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'ONLINE SERVICE InSync (ERIP)'
      }
    ],
    [
      {
        id: '53228197',
        amount: { amount: -71.55, currIso: 'BYN' },
        date: '2020-03-12T19:03:24',
        description: 'INTERNET-BANK AL InSync (ERIP)',
        operationAmount: null,
        cardMask: '5.5064',
        status: 'normal',
        number: 'BY50 ALFA 3014 4414 9600 9027 0000',
        operationType: 'payment'
      },
      { id: 'account', instrument: 'BYN', syncID: ['BY50ALFA30144414960090270000'] },
      {
        hold: false,
        date: new Date('2020-03-12T19:03:24+03:00'),
        movements: [
          {
            id: '53228197',
            account: { id: 'account' },
            invoice: null,
            sum: -71.55,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'INTERNET-BANK AL InSync (ERIP)'
      }
    ],
    [
      {
        id: null,
        amount: { amount: -3.14, currIso: 'USD' },
        date: '2020-01-04T02:32:04',
        description: 'Карта 5.8804. Вознаграждение за обслуживание согласно Перечню вознаграждений (перевод с продажей)',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY43 ALFA 3014 4414 9600 3027 0000',
        operationType: null
      },
      { id: 'account', instrument: 'USD', syncID: ['BY43ALFA30144414960030270000'] },
      {
        hold: false,
        date: new Date('2020-01-04T02:32:04+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -3.14,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Карта 5.8804. Вознаграждение за обслуживание согласно Перечню вознаграждений (перевод с продажей)'
      }
    ],
    [
      {
        id: '53295585240777',
        amount: { amount: -105.36, currIso: 'USD' },
        date: '2020-03-23T12:16:07',
        description: 'BOBRUISK BLR',
        operationAmount: { amount: 295, currIso: 'BYN' },
        cardMask: '4.0777',
        status: 'normal',
        number: 'BY39 ALFA 3014 301Z 0300 4027 0000',
        operationType: null
      },
      { id: 'account', instrument: 'USD', syncID: ['BY39ALFA3014301Z030040270000'] },
      {
        hold: false,
        date: new Date('2020-03-23T12:16:07+03:00'),
        movements: [
          {
            id: '53295585240777',
            account: { id: 'account' },
            invoice: { sum: -295, instrument: 'BYN' },
            sum: -105.36,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'BOBRUISK BLR'
      }
    ]
  ])('converts outcome with comment', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
