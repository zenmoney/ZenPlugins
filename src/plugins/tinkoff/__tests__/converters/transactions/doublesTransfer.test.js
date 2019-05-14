/*
* Обработка переводов
*/

import { convertTransaction, convertTransactions } from '../../../converters'

const accounts = {
  '5006319460': {
    id: '5006319460',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  },
  '8107123716': {
    id: '8107123716',
    title: 'Накопления',
    type: 'checking',
    syncID: '3716',
    instrument: 'RUB',
    balance: 11000,
    savings: true
  }
}
const transactions = [
  // card2card (входящий)
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5006319460',
        paymentId: '664352432',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'c2c-in-new',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          agreement: '5006319460',
          unid: 'M.1703259419'
        },
        cardNumber: '554386******0123'
      },
      id: '1309413682',
      offers: [],
      operationPaymentType: 'NORMAL',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Credit',
      locations: [],
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
      description: 'Перевод с карты',
      cashback: 0,
      brand: {
        name: 'Перевод с карты',
        id: 'c2c-in-new',
        roundedLogo: false
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 15000
      },
      operationTime: {
        milliseconds: 1557779440000
      },
      subcategory: 'Перевод с карты',
      spendingCategory: {
        id: '40',
        name: 'Финансы',
        icon: '7',
        parentId: '5'
      },
      isHce: false,
      mcc: 6012,
      partnerType: 'card2card',
      category: {
        id: '7',
        name: 'Финан. услуги'
      },
      additionalInfo:
      [{
        fieldName: 'Номер банкомата',
        fieldValue: '10000001'
      }],
      virtualPaymentType: 0,
      account: '5006319460',
      ucid: '1033551881',
      card: '34039318',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6012',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '554386******5555',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 15000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-13T23:30:40+03:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          'account': {
            'id': '5006319460'
          },
          'fee': 0,
          'id': 'p664352432',
          'invoice': null,
          'sum': 15000
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': [
              '0123'
            ],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -15000
        }
      ]
    }
  ],
  // card2card исходящий (с внешней карты)
  [
    {
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5006319460',
        paymentId: '664352432',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'c2c-in-new',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          agreement: '5006319460',
          unid: 'M.1703259419'
        },
        cardNumber: '554386******0123'
      },
      id: '0',
      offers: [],
      operationPaymentType: 'NORMAL',
      status: 'OK',
      idSourceType: 'External',
      type: 'Debit',
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Перевод с карты',
      cashback: 0,
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 15000
      },
      operationTime: {
        milliseconds: 1557779421000
      },
      subcategory: 'Перевод с карты',
      isHce: false,
      mcc: 0,
      partnerType: 'card2card',
      category: {
        id: '57',
        name: 'Переводы'
      },
      additionalInfo: [],
      account: '4445766',
      card: '4445766',
      loyaltyPayment: [],
      mccString: '0000',
      cardPresent: true,
      isExternalCard: true,
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 15000
      }
    },
    null
  ],

  // inner transfer
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5006319460',
        paymentId: '664352190',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'transfer-inner',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankContract: '8107123716'
        },
        cardNumber: '554386******5555',
        templateId: '51024531',
        templateIsFavorite: false
      },
      id: '1309412483',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Credit',
      locations: [],
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
      description: 'Пополнение Накопительный счет',
      cashback: 0,
      senderDetails: 'Иван Петров',
      brand: {
        name: 'Перевод между своими счетами',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 11000
      },
      operationTime: {
        milliseconds: 1557779392000
      },
      subcategory: 'Пополнение Накопительный счет',
      spendingCategory: {
        id: '70',
        name: 'Пополнения',
        icon: '33'
      },
      isHce: false,
      mcc: 0,
      category: {
        id: '33',
        name: 'Другое'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: '8107123716',
      ucid: '1039992507',
      card: '40466136',
      loyaltyPayment: [],
      senderAgreement: '5006319460',
      group: 'INCOME',
      mccString: '0000',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '518901******4431',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 11000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-13T23:29:52+03:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          'account': {
            'id': '8107123716'
          },
          'fee': 0,
          'id': 'p664352190',
          'invoice': null,
          'sum': 11000
        }
      ]
    }
  ],
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5006319460',
        paymentId: '664352190',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'transfer-inner',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankContract: '8107123716'
        },
        cardNumber: '554386******5555',
        templateId: '51024531',
        templateIsFavorite: false
      },
      id: '1309412475',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [],
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
      description: 'Пополнение Накопительный счет',
      cashback: 0,
      brand: {
        name: 'Перевод между своими счетами',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 11000
      },
      operationTime: {
        milliseconds: 1557779391000
      },
      subcategory: 'Пополнение Накопительный счет',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: '5006319460',
      ucid: '1033551881',
      card: '34039318',
      loyaltyPayment: [],
      group: 'INTERNAL',
      mccString: '0001',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '554386******5555',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 11000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-13T23:29:51+03:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          'account': {
            'id': '5006319460'
          },
          'fee': 0,
          'id': 'p664352190',
          'invoice': null,
          'sum': -11000
        }
      ]
    }
  ],

  // две раздельные card3card-операции на одном счету, которые НЕ НАДО объединять в перевод
  [
    // исходящий card2card-перевод
    {
      isDispute: true,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5006319460',
        paymentId: '666999252',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'c2c-out',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankCard: '479087**7146'
        },
        cardNumber: '521324**6765',
        templateId: '70580019',
        templateIsFavorite: false
      },
      id: '1321168975',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [],
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
      description: 'Перевод на карту',
      cashback: 0,
      brand: {
        name: 'Перевод на карту',
        id: 'c2c-out',
        roundedLogo: false
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10500
      },
      operationTime: {
        milliseconds: 1557952816000
      },
      subcategory: 'Перевод на карту',
      spendingCategory: {
        id: '40',
        name: 'Финансы',
        icon: '7',
        parentId: '5'
      },
      isHce: false,
      mcc: 6012,
      partnerType: 'card2card',
      category: {
        id: '7',
        name: 'Финан. услуги'
      },
      additionalInfo:
      [{
        fieldName: 'Номер банкомата',
        fieldValue: '10000001'
      }],
      virtualPaymentType: 0,
      account: '5006319460',
      ucid: '1022338546',
      card: '2535796',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6012',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '521324**6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10500
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-15T23:40:16+03:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          'account': {
            'id': '5006319460'
          },
          'fee': 0,
          'id': 'p666999252',
          'invoice': null,
          'sum': -10500
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': ['6765'],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 10500
        }
      ]
    }
  ],
  [
    // входящий card2card-перевод с ДРУГОЙ карты
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5006319460',
        paymentId: '666996139',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'c2c-in-new',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          agreement: '5006319460',
          unid: 'M.1710448645'
        },
        cardNumber: '522598**7430'
      },
      id: '1321161491',
      offers: [],
      operationPaymentType: 'NORMAL',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Credit',
      locations: [],
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
      description: 'Перевод с карты',
      cashback: 0,
      brand: {
        name: 'Перевод с карты',
        id: 'c2c-in-new',
        roundedLogo: false
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10500
      },
      operationTime: {
        milliseconds: 1557952547000
      },
      subcategory: 'Перевод с карты',
      spendingCategory: {
        id: '40',
        name: 'Финансы',
        icon: '7',
        parentId: '5'
      },
      isHce: false,
      mcc: 6012,
      partnerType: 'card2card',
      category: {
        id: '7',
        name: 'Финан. услуги'
      },
      additionalInfo:
      [{
        fieldName: 'Номер банкомата',
        fieldValue: '10000001'
      }],
      virtualPaymentType: 0,
      account: '5006319460',
      ucid: '1022338546',
      card: '2535796',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6012',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '521324**6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10500
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-15T23:35:47+03:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          'account': {
            'id': '5006319460'
          },
          'fee': 0,
          'id': 'p666996139',
          'invoice': null,
          'sum': 10500
        }, {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': ['7430'],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -10500
        }
      ]
    }

  ],
  [
    // вторая часть этого перевода с чужой ВНЕШНЕЙ карты (не обрабатываем)
    {
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5006319460',
        paymentId: '666996139',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'c2c-in-new',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          agreement: '5006319460',
          unid: 'M.1710448645'
        },
        cardNumber: '522598**7430'
      },
      id: '0',
      offers: [],
      operationPaymentType: 'NORMAL',
      status: 'OK',
      idSourceType: 'External',
      type: 'Debit',
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Перевод с карты',
      cashback: 0,
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10500
      },
      operationTime: {
        milliseconds: 1557952429000
      },
      subcategory: 'Перевод с карты',
      isHce: false,
      mcc: 0,
      partnerType: 'card2card',
      category: {
        id: '57',
        name: 'Переводы'
      },
      additionalInfo: [],
      account: '12158713',
      card: '12158713',
      loyaltyPayment: [],
      mccString: '0000',
      cardPresent: true,
      isExternalCard: true,
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10500
      }
    },
    null
  ]
]
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
  const i = 3
  it('should convert transaction ' + i, () => {
    expect(
      convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
    ).toEqual(
      transactions[i][1]
    )
  })
})

describe('convertTransactions', () => {
  it('should return two valid transaction without fake doubles', () => {
    expect(
      convertTransactions(apiTransactions, accounts)
    ).toEqual(
      [
        {
          'comment': null,
          'date': new Date('2019-05-13T23:30:40+03:00'),
          'hold': true,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': '5006319460'
              },
              'fee': 0,
              'id': 'p664352432',
              'invoice': null,
              'sum': 15000
            },
            {
              'account': {
                'company': null,
                'instrument': 'RUB',
                'syncIds': [ '0123' ],
                'type': 'ccard'
              },
              'fee': 0,
              'id': null,
              'invoice': null,
              'sum': -15000
            }
          ]
        },
        {
          'comment': null,
          'date': new Date('2019-05-13T23:29:52+03:00'),
          'hold': true,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': '8107123716'
              },
              'fee': 0,
              'id': 'p664352190',
              'invoice': null,
              'sum': 11000
            },
            {
              'account': {
                'id': '5006319460'
              },
              'fee': 0,
              'id': 'p664352190',
              'invoice': null,
              'sum': -11000
            }
          ]
        },
        transactions[4][1],
        transactions[5][1]
      ]
    )
  })
})
