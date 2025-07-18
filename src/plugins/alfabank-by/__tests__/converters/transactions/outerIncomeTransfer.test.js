import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 'ABOWD00170788244',
        amount: {
          amount: 50,
          currIso: 'BYN'
        },
        date: '2020-03-25T15:30:15',
        description: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ Перевод между счетами  физических лиц через АК на основании  эл. сообщ. от  25.03.2020',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY19 ALFA 3014 309W VQ00 1027 0000',
        operationType: 'personTransferAbb'
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY19ALFA3014309WVQ0010270000']
      },
      {
        hold: false,
        date: new Date('2020-03-25T15:30:15+03:00'),
        movements: [
          {
            id: 'ABOWD00170788244',
            account: { id: 'account' },
            invoice: null,
            sum: 50,
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
            sum: -50,
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
        id: null,
        amount: {
          amount: 5,
          currIso: 'BYN'
        },
        date: '2020-03-28T14:36:09',
        description: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ ЗАЧИСЛЕНИЕ СРЕДСТВ НА ТЕКУЩИЙ СЧЕТ 301430B4F6001 ЧЕРЕЗ СИСТЕМУ ЕРИП 2888225877',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY49 ALFA 3014 30B4 F600 1027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY49ALFA301430B4F60010270000']
      },
      {
        hold: false,
        date: new Date('2020-03-28T14:36:09+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 5,
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
            sum: -5,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        id: null,
        title: 'Пополнение',
        amount: {
          amount: 60000,
          currIso: 'RUB'
        },
        date: '2020-12-14T17:22:20',
        description: 'С 1030800224810 НА 3014692024017 Взнос от НИКОЛАЕВ Н.Н. согласно ПВО № 613 от 14.12.2020 002',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY95 ALFA 3014 6920 2401 7027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'RUB',
        syncID: ['BY95ALFA30146920240170270000']
      },
      {
        hold: false,
        date: new Date('2020-12-14T17:22:20+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 60000,
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
            sum: -60000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Пополнение'
      }
    ],
    [
      {
        id: '1613478750098793',
        title: 'TINKOFF CARD2CARD',
        amount: {
          amount: -1120,
          currIso: 'BYN'
        },
        date: '2023-06-28T06:07:25',
        description: 'MOSCOW RUS (6537)',
        operationAmount: {
          amount: 40000,
          currIso: 'RUB'
        },
        cardMask: '9.8793',
        status: 'normal',
        number: 'BY51 ALFA 3014 312H A000 4027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY51ALFA3014312HA00040270000']
      },
      {
        hold: false,
        date: new Date('2023-06-28T06:07:25+03:00'),
        movements: [
          {
            id: '1613478750098793',
            account: { id: 'account' },
            invoice: {
              sum: 40000,
              instrument: 'RUB'
            },
            sum: 1120,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: { id: '4902' },
              syncIds: null
            },
            invoice: null,
            sum: -40000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'TINKOFF CARD2CARD'
      }
    ]
  ])('converts outer income transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
