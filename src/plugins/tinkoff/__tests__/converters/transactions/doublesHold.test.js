/*
* Обработка ошибки дублирования холд-операций на ВСЕХ счетах в выписке
*/

import { convertTransaction, convertTransactions, groupApiTransactionsById } from '../../../converters'

const accounts = {
  'accountId': {
    id: 'accountId',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  },
  'accountRUB': {
    id: 'accountRUB',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  },
  'accountEUR': {
    id: 'accountEUR',
    title: 'Счет Black EUR',
    type: 'ccard',
    syncID: ['2345'],
    instrument: 'EUR'
  },
  'accountUSD': {
    id: 'accountUSD',
    title: 'Счет Black USD',
    type: 'ccard',
    syncID: ['3456'],
    instrument: 'USD'
  },
  'checkingId': {
    id: 'checkingId',
    title: 'Накопительный счет',
    type: 'checking',
    syncID: '4567',
    instrument: 'RUB',
    balance: 1.05,
    savings: true
  }
}

const transactions = [
  // косячное дублирование по всем счетам
  [
    {
      hasStatement: true,
      isSuspicious: false,
      id: '1165931124',
      offers: [],
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [{
        latitude: 59.9395237,
        longitude: 30.3120206
      }
      ],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перекресток',
      cashback: 0,
      brand: {
        name: 'Перекресток',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
        id: '4',
        roundedLogo: false,
        link: 'http://www.perekrestok.ru',
        baseColor: '005221',
        logoFile: 'perekrestok.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      },
      operationTime: {
        milliseconds: 1555441116000
      },
      spendingCategory: {
        id: '25',
        name: 'Супермаркеты',
        icon: '10',
        parentId: '3'
      },
      isHce: false,
      mcc: 5411,
      category: {
        id: '10',
        name: 'Супермаркеты'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountRUB',
      ucid: '1022338546',
      merchant: {
        name: 'Перекресток',
        region: {
          country: 'RUS',
          city: 'SANKT-PETERBU'
        }
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5411',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      }
    },
    {
      'hold': true,
      'date': new Date('2019-04-16T21:58:36+03:00'),
      'merchant': {
        'city': 'SANKT-PETERBU',
        'country': 'RUS',
        'location': {
          'latitude': 59.9395237,
          'longitude': 30.3120206
        },
        'mcc': 5411,
        'title': 'Перекресток'
      },
      'movements': [
        {
          '_id': '1165931124',
          '_cardPresent': true,
          'account': { 'id': 'accountRUB' },
          'fee': 0,
          'id': '1165931124',
          'invoice': null,
          'sum': -1041.89
        }
      ],
      'comment': null
    }
  ],
  [
    {
      isDispute: true,
      hasStatement: true,
      isSuspicious: false,
      id: '4526773660',
      offers: [],
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'A1',
        name: ''
      },
      locations: [{
        latitude: 59.9395237,
        longitude: 30.3120206
      }
      ],
      loyaltyBonus:
      [{
        amount: {
          value: 10,
          loyaltyProgramId: 'Cashback',
          loyalty: 'Tinkoff Black',
          name: 'Tinkoff Black',
          loyaltySteps: 1,
          loyaltyPointsId: 3,
          loyaltyPointsName: 'Rubles',
          loyaltyImagine: true,
          partialCompensation: false
        },
        loyaltyType: 'Cobrand',
        status: 'A'
      }
      ],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Перекресток',
      debitingTime: {
        milliseconds: 1555707600000
      },
      cashback: 0,
      brand: {
        name: 'Перекресток',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
        id: '4',
        roundedLogo: false,
        link: 'http://www.perekrestok.ru',
        baseColor: '005221',
        logoFile: 'perekrestok.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      },
      operationTime: {
        milliseconds: 1555441116000
      },
      spendingCategory: {
        id: '25',
        name: 'Супермаркеты',
        icon: '10',
        parentId: '3'
      },
      isHce: false,
      mcc: 5411,
      category: {
        id: '10',
        name: 'Супермаркеты'
      },
      additionalInfo: [],
      compensation: 'default',
      virtualPaymentType: 0,
      account: 'accountRUB',
      ucid: '1022338546',
      merchant: {
        name: 'Перекресток',
        region: {
          country: 'RUS',
          city: 'SANKT-PETERBU',
          address: '15 , LIT.  CHKALOVSKIJ STR',
          zip: '197110'
        }
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5411',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      }
    },
    {
      'hold': false,
      'date': new Date('2019-04-16T21:58:36+03:00'),
      'merchant': {
        'title': 'Перекресток',
        'city': 'SANKT-PETERBU',
        'country': 'RUS',
        'mcc': 5411,
        'location': {
          'latitude': 59.9395237,
          'longitude': 30.3120206
        }
      },
      'movements': [
        {
          '_id': '4526773660',
          '_cardPresent': true,
          'account': {
            'id': 'accountRUB'
          },
          'fee': 0,
          'id': '4526773660',
          'invoice': null,
          'sum': -1041.89
        }
      ],
      'comment': null
    }
  ],
  [
    {
      hasStatement: true,
      isSuspicious: false,
      id: '1165931124',
      offers: [],
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [{
        latitude: 59.9395237,
        longitude: 30.3120206
      }
      ],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 840,
          name: 'USD',
          strCode: '840'
        },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перекресток',
      cashback: 0,
      brand: {
        name: 'Перекресток',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
        id: '4',
        roundedLogo: false,
        link: 'http://www.perekrestok.ru',
        baseColor: '005221',
        logoFile: 'perekrestok.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      },
      operationTime: {
        milliseconds: 1555441116000
      },
      spendingCategory: {
        id: '25',
        name: 'Супермаркеты',
        icon: '10',
        parentId: '3'
      },
      isHce: false,
      mcc: 5411,
      category: {
        id: '10',
        name: 'Супермаркеты'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountUSD',
      ucid: '1022338546',
      merchant: {
        name: 'Перекресток',
        region: {
          country: 'RUS',
          city: 'SANKT-PETERBU'
        }
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5411',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 840,
          name: 'USD',
          strCode: '840'
        },
        value: 1041.89
      }
    },
    null
  ],
  [
    {
      hasStatement: true,
      isSuspicious: false,
      id: '1165931124',
      offers: [],
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [{
        latitude: 59.9395237,
        longitude: 30.3120206
      }
      ],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 978,
          name: 'EUR',
          strCode: '978'
        },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перекресток',
      cashback: 0,
      brand: {
        name: 'Перекресток',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
        id: '4',
        roundedLogo: false,
        link: 'http://www.perekrestok.ru',
        baseColor: '005221',
        logoFile: 'perekrestok.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      },
      operationTime: {
        milliseconds: 1555441116000
      },
      spendingCategory: {
        id: '25',
        name: 'Супермаркеты',
        icon: '10',
        parentId: '3'
      },
      isHce: false,
      mcc: 5411,
      category: {
        id: '10',
        name: 'Супермаркеты'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountEUR',
      ucid: '1022338546',
      merchant: {
        name: 'Перекресток',
        region: {
          country: 'RUS',
          city: 'SANKT-PETERBU'
        }
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5411',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 978,
          name: 'EUR',
          strCode: '978'
        },
        value: 1041.89
      }
    },
    null
  ],
  [
    {
      hasStatement: false,
      isSuspicious: false,
      id: '1165931124',
      offers: [],
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [{
        latitude: 59.9395237,
        longitude: 30.3120206
      }
      ],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перекресток',
      cashback: 0,
      brand: {
        name: 'Перекресток',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
        id: '4',
        roundedLogo: false,
        link: 'http://www.perekrestok.ru',
        baseColor: '005221',
        logoFile: 'perekrestok.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      },
      operationTime: {
        milliseconds: 1555441116000
      },
      spendingCategory: {
        id: '25',
        name: 'Супермаркеты',
        icon: '10',
        parentId: '3'
      },
      isHce: false,
      mcc: 5411,
      category: {
        id: '10',
        name: 'Супермаркеты'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'checkingId',
      ucid: '1022338546',
      merchant: {
        name: 'Перекресток',
        region: {
          country: 'RUS',
          city: 'SANKT-PETERBU'
        }
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5411',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      }
    },
    {
      'hold': true,
      'date': new Date('2019-04-16T21:58:36+03:00'),
      'merchant': {
        'city': 'SANKT-PETERBU',
        'country': 'RUS',
        'location': {
          'latitude': 59.9395237,
          'longitude': 30.3120206
        },
        'mcc': 5411,
        'title': 'Перекресток'
      },
      'movements': [
        {
          '_id': '1165931124',
          '_cardPresent': true,
          'account': {
            'id': 'checkingId'
          },
          'fee': 0,
          'id': '1165931124',
          'invoice': null,
          'sum': -1041.89
        }
      ],
      'comment': null
    }
  ],

  // реальные операции-дубли, которые не нужно игнорировать
  [
    {
      account: 'accountId',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 19
      },
      additionalInfo: [],
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 19
      },
      authMessage: 'Операция утверждена.',
      card: '52603562',
      cardNumber: '553691******4763',
      cardPresent: true,
      cashback: 0,
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      category: {
        id: '36',
        name: 'Транспорт'
      },
      description: 'ETK CHUVASHIA',
      group: 'PAY',
      hasStatement: false,
      id: '1360844704',
      idSourceType: 'Online',
      isDispute: true,
      isExternalCard: false,
      isHce: false,
      isSuspicious: false,
      locations: [{
        latitude: 56.1285406,
        longitude: 47.2754679
      }
      ],
      loyaltyBonus: [],
      loyaltyPayment: [],
      mcc: 4131,
      mccString: '4131',
      merchant: {
        name: 'ETK CHUVASHIA',
        region: {
          country: 'RUS',
          city: 'CHEBOKSARY'
        }
      },
      offers: [],
      operationTime: {
        milliseconds: 1558551886000
      },
      spendingCategory: {
        id: '55',
        name: 'Транспорт',
        icon: '36',
        parentId: '4'
      },
      status: 'OK',
      type: 'Debit',
      ucid: '1052293752',
      virtualPaymentType: 0
    },
    {
      'comment': null,
      'date': new Date('2019-05-22T22:04:46+03:00'),
      'hold': true,
      'merchant':
        {
          'city': 'CHEBOKSARY',
          'country': 'RUS',
          'location':
            {
              'latitude': 56.1285406,
              'longitude': 47.2754679
            },
          'mcc': 4131,
          'title': 'ETK CHUVASHIA'
        },
      'movements': [
        {
          '_id': '1360844704',
          '_cardPresent': true,
          'account':
            {
              'id': 'accountId'
            },
          'fee': 0,
          'id': '1360844704',
          'invoice': null,
          'sum': -19
        }
      ]
    }
  ],
  [
    {
      account: 'accountId',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 19
      },
      additionalInfo: [],
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 19
      },
      authMessage: 'Операция утверждена.',
      card: '52603562',
      cardNumber: '553691******4763',
      cardPresent: true,
      cashback: 0,
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      category: {
        id: '36',
        name: 'Транспорт'
      },
      description: 'ETK CHUVASHIA',
      group: 'PAY',
      hasStatement: false,
      id: '1360844711',
      idSourceType: 'Online',
      isDispute: true,
      isExternalCard: false,
      isHce: false,
      isSuspicious: false,
      locations: [{
        latitude: 56.1285406,
        longitude: 47.2754679
      }
      ],
      loyaltyBonus: [],
      loyaltyPayment: [],
      mcc: 4131,
      mccString: '4131',
      merchant: {
        name: 'ETK CHUVASHIA',
        region: {
          country: 'RUS',
          city: 'CHEBOKSARY'
        }
      },
      offers: [],
      operationTime: {
        milliseconds: 1558551886000
      },
      spendingCategory: {
        id: '55',
        name: 'Транспорт',
        icon: '36',
        parentId: '4'
      },
      status: 'OK',
      type: 'Debit',
      ucid: '1052293752',
      virtualPaymentType: 0
    },
    {
      'comment': null,
      'date': new Date('2019-05-22T22:04:46+03:00'),
      'hold': true,
      'merchant':
        {
          'city': 'CHEBOKSARY',
          'country': 'RUS',
          'location':
            {
              'latitude': 56.1285406,
              'longitude': 47.2754679
            },
          'mcc': 4131,
          'title': 'ETK CHUVASHIA'
        },
      'movements': [
        {
          '_id': '1360844711',
          '_cardPresent': true,
          'account':
            {
              'id': 'accountId'
            },
          'fee': 0,
          'id': '1360844711',
          'invoice': null,
          'sum': -19
        }
      ]
    }
  ]
]

// ошибочные холды (из-за проблем с дублями в выписке банка)
const apiTransactions = transactions.map(item => item[0])

describe('convertTransaction', () => {
  for (let i = 0; i < transactions.length; i++) {
    it('should convert transaction #' + i, () => {
      expect(
        convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
      ).toEqual(
        transactions[i][1]
      )
    })
  }
})

xdescribe('convertOneTransaction', () => {
  const i = 0
  it('should convert transaction #' + i, () => {
    expect(
      convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
    ).toEqual(
      transactions[i][1]
    )
  })
})

describe('groupApiTransactionsById', () => {
  it('should return grouped transactions', () => {
    expect(
      groupApiTransactionsById(apiTransactions)
    ).toEqual({
      '1165931124': [
        transactions[0][0],
        transactions[2][0],
        transactions[3][0],
        transactions[4][0]
      ],
      '1360844704': [ transactions[5][0] ],
      '1360844711': [ transactions[6][0] ],
      '4526773660': [ transactions[1][0] ]
    })
  })
})

describe('convertTransactions', () => {
  it('should return one valid transaction without fake doubles', () => {
    expect(
      convertTransactions(apiTransactions, accounts)
    ).toEqual(
      [
        // из кучи левых дублей должен выжить только один акцепт на основном карточном счёте
        {
          'comment': null,
          'date': new Date('2019-04-16T18:58:36.000Z'),
          'hold': false,
          'merchant': {
            'city': 'SANKT-PETERBU',
            'country': 'RUS',
            'location': {
              'latitude': 59.9395237,
              'longitude': 30.3120206
            },
            'mcc': 5411,
            'title': 'Перекресток'
          },
          'movements': [
            {
              'account': {
                'id': 'accountRUB'
              },
              'fee': 0,
              'id': '4526773660',
              'invoice': null,
              'sum': -1041.89
            }
          ]
        },

        // две реальные операции, хоть и похожи один-в-один должны остаться
        {
          'comment': null,
          'date': new Date('2019-05-22T19:04:46.000Z'),
          'hold': true,
          'merchant': {
            'city': 'CHEBOKSARY',
            'country': 'RUS',
            'location': {
              'latitude': 56.1285406,
              'longitude': 47.2754679
            },
            'mcc': 4131,
            'title': 'ETK CHUVASHIA'
          },
          'movements': [
            {
              'account': {
                'id': 'accountId'
              },
              'fee': 0,
              'id': '1360844704',
              'invoice': null,
              'sum': -19
            }
          ]
        },
        {
          'comment': null,
          'date': new Date('2019-05-22T19:04:46.000Z'),
          'hold': true,
          'merchant': {
            'city': 'CHEBOKSARY',
            'country': 'RUS',
            'location': {
              'latitude': 56.1285406,
              'longitude': 47.2754679
            },
            'mcc': 4131,
            'title': 'ETK CHUVASHIA'
          },
          'movements': [
            {
              'account': {
                'id': 'accountId'
              },
              'fee': 0,
              'id': '1360844711',
              'invoice': null,
              'sum': -19
            }
          ]
        }
      ]
    )
  })
})
