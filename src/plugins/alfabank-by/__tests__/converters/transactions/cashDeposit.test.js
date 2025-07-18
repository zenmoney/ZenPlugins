import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: null,
        amount: {
          amount: 750,
          currIso: 'BYN'
        },
        date: '2020-03-27T18:46:09',
        description: 'ПОПОЛНЕНИЕ КАРТСЧЕТОВ ТЕРМИНАЛ K2702401, ДАТА ОПЕРАЦИИ 2020-03-27-18.41.10.929000, НОМЕР ЦИКЛА ИНК. 1542',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY19 ALFA 3014 309W VQ00 1027 0000',
        operationType: null
      },
      {
        hold: false,
        date: new Date('2020-03-27T18:46:09+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 750,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -750,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash deposit', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, {
      id: 'account',
      instrument: 'BYN',
      syncID: ['BY19ALFA3014309WVQ0010270000']
    })).toEqual(transaction)
  })
})
