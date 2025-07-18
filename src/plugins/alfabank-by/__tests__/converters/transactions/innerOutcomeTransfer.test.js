import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 'ABOWD00164250856',
        amount: {
          amount: -5000,
          currIso: 'EUR'
        },
        date: '2020-02-10T15:43:27',
        description: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ Перевод через АК в рамках одного ФЛ, эл. сообщ. от  10.02.2020',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY86 ALFA 3014 309W VQ00 3027 0000',
        operationType: 'ownAccountsTransfer'
      },
      {
        id: 'account',
        instrument: 'EUR',
        syncID: ['BY86ALFA3014309WVQ0030270000']
      },
      {
        hold: false,
        date: new Date('2020-02-10T15:43:27+03:00'),
        movements: [
          {
            id: 'ABOWD00164250856',
            account: { id: 'account' },
            invoice: null,
            sum: -5000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          'ABOWD00164250856'
        ]
      }
    ],
    [
      {
        id: 'ABOWD00169853133',
        amount: {
          amount: -100,
          currIso: 'EUR'
        },
        date: '2020-03-19T12:32:55',
        description: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ В/о операция по курсу Банка через  АК, эл. сообщ. от  19.03.2020',
        operationAmount: {
          amount: 276,
          currIso: 'BYN'
        },
        cardMask: null,
        status: 'normal',
        number: 'BY86 ALFA 3014 309W VQ00 3027 0000',
        operationType: 'currencyExchange'
      },
      {
        id: 'account',
        instrument: 'EUR',
        syncID: ['BY86ALFA3014309WVQ0030270000']
      },
      {
        hold: false,
        date: new Date('2020-03-19T12:32:55+03:00'),
        movements: [
          {
            id: 'ABOWD00169853133',
            account: { id: 'account' },
            invoice: {
              sum: -276,
              instrument: 'BYN'
            },
            sum: -100,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          'ABOWD00169853133'
        ]
      }
    ],
    [
      {
        id: 'ABOWD00211682442',
        title: 'Погашение кредита',
        amount: {
          amount: -88.7,
          currIso: 'BYN'
        },
        date: '2020-12-16T11:39:57',
        description: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ Перевод для погашения кредита через АК, эл. сообщ. от 16.12.2020',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY13 ALFA 3014 6920 2401 6027 0000',
        operationType: 'creditTransfer'
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY13ALFA30146920240160270000']
      },
      {
        hold: false,
        date: new Date('2020-12-16T11:39:57+03:00'),
        movements:
          [
            {
              id: 'ABOWD00211682442',
              account: { id: 'account' },
              invoice: null,
              sum: -88.7,
              fee: 0
            }
          ],
        merchant: null,
        comment: null,
        groupKeys: [
          'ABOWD00211682442'
        ]
      }
    ],
    [
      {
        id: 'ABOWD00521813020',
        title: 'Пополнение депозита',
        amount: {
          amount: 2400,
          currIso: 'BYN'
        },
        date: '2024-04-03T18:33:04',
        description: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ Перевод для пополнения депозита через АК , эл. сообщ. от 03.04.2024',
        operationAmount: null,
        cardMask: null,
        status: 'normal',
        number: 'BY16 ALFA 3014 30FG AF00 4027 0000',
        operationType: 'depositTransfer'
      },
      {
        id: '301430FGAF0040270',
        type: 'checking',
        instrument: 'BYN',
        syncID: ['BY16ALFA301430FGAF0040270000']
      },
      {
        date: new Date('2024-04-03T18:33:04.000+03:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '301430FGAF0040270' },
            fee: 0,
            id: 'ABOWD00521813020',
            invoice: null,
            sum: -2400
          }
        ],
        comment: null,
        groupKeys: ['ABOWD00521813020']
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
