import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '53883623259491',
        amount: {
          amount: 750,
          currIso: 'BYN'
        },
        date: '2020-03-27T18:41:19',
        description: 'MINSK BLR',
        operationAmount: null,
        cardMask: '5.9491',
        status: 'normal',
        number: 'BY19 ALFA 3014 309W VQ00 1027 0000',
        operationType: null
      },
      {
        hold: false,
        date: new Date('2020-03-27T18:41:19+03:00'),
        movements: [
          {
            id: '53883623259491',
            account: { id: 'account' },
            invoice: null,
            sum: 750,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'MINSK BLR'
      }
    ],
    [
      {
        id: '523165479049863',
        title: 'NIKOLAY NIKOLAEV',
        amount: {
          amount: 14.96,
          currIso: 'BYN'
        },
        date: '2022-01-12T19:54:04',
        description: 'VISA DIRECT RUS (6012)',
        operationAmount: {
          amount: 442.47,
          currIso: 'RUB'
        },
        cardMask: '4.9863',
        status: 'normal',
        number: 'BY19 ALFA 3014 309W VQ00 1027 0000',
        operationType: null
      },
      {
        hold: false,
        date: new Date('2022-01-12T19:54:04+03:00'),
        movements: [
          {
            id: '523165479049863',
            account: { id: 'account' },
            invoice: {
              sum: 442.47,
              instrument: 'RUB'
            },
            sum: 14.96,
            fee: 0
          }
        ],
        merchant: {
          country: 'RUS',
          city: 'VISA DIRECT',
          title: 'NIKOLAY NIKOLAEV',
          mcc: 6012,
          location: null
        },
        comment: null
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, {
      id: 'account',
      instrument: 'BYN',
      syncID: ['BY19ALFA3014309WVQ0010270000']
    })).toEqual(transaction)
  })

  it.each([
    [
      {
        id: '545091113054333',
        title: 'WILDBERRIES',
        amount: {
          amount: 286,
          currIso: 'RUR'
        },
        date: '2022-01-25T04:45:38',
        description: 'MIL\'KOVO RUS (5651)',
        operationAmount: null,
        cardMask: '5.4333',
        status: 'normal',
        number: 'BY95 ALFA 3014 30EJ 5X00 3027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'RUB',
        syncID: ['BY95ALFA301430EJ5X0030270000']
      },
      {
        hold: false,
        date: new Date('2022-01-25T04:45:38+03:00'),
        movements: [
          {
            id: '545091113054333',
            account: { id: 'account' },
            invoice: null,
            sum: 286,
            fee: 0
          }
        ],
        merchant: {
          country: 'RUS',
          city: 'MIL\'KOVO',
          title: 'WILDBERRIES',
          mcc: 5651,
          location: null
        },
        comment: null
      }
    ]
  ])('converts intcome invoice', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
