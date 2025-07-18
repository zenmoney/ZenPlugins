import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '55136697840903',
        amount: {
          amount: 0,
          currIso: 'BYN'
        },
        date: '2020-04-08T21:14:43',
        description: 'MOSCOW RUS',
        operationAmount: null,
        cardMask: '4.0903',
        status: 'normal',
        number: 'BY21 ALFA 3014 7106 1900 6027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: [
          'BY21ALFA30147106190060270000'
        ]
      }
    ],
    [
      {
        id: '613657540046707',
        title: 'MILEONAIR APP',
        amount: {
          amount: 0,
          currIso: 'USD'
        },
        date: '2022-03-04T02:51:41',
        description: 'MOSKVA RUS (4722)',
        operationAmount: {
          amount: 1,
          currIso: 'RUB'
        },
        cardMask: '4.6707',
        status: 'normal',
        number: 'BY63 ALFA 3014 30LV PV00 2027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'USD',
        syncID: [
          'BY63ALFA301430LVPV0020270000'
        ]
      }
    ],
    [
      {
        id: '54028757459547',
        amount: {
          amount: 0,
          currIso: 'BYN'
        },
        date: '2020-03-29T22:15:36',
        description: 'G.CO/PAYHELP# GBR',
        operationAmount: {
          amount: 1,
          currIso: 'EUR'
        },
        cardMask: '5.9547',
        status: 'normal',
        number: 'BY23 ALFA 3014 7523 3800 1027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: [
          'BY23ALFA30147523380010270000'
        ]
      }
    ],
    [
      {
        id: '226327849',
        title: 'Popolnenie karti: 3001779330080047/6754',
        amount: {
          amount: -1000,
          currIso: 'BYN'
        },
        date: '2024-04-08T19:53:59',
        description: 'Оплата товаров/услуг со счета 3014688214003',
        operationAmount: null,
        cardMask: '4.5045',
        status: 'normal',
        number: 'BY39 ALFA 3014 6882 1400 3027 0000',
        operationType: 'payment'
      },
      {
        id: '30146882140040270',
        type: 'ccard',
        title: 'Black Евро',
        instrument: 'EUR',
        syncID: [
          'BY24ALFA30146882140040270000',
          '5***7777'
        ],
        balance: 1035.32
      }
    ]
  ])('skips specific transaction', (apiTransaction, account) => {
    expect(convertTransaction(apiTransaction, account)).toBeNull()
  })
})
