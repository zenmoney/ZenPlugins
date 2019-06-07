import { convertTransaction } from '../../../converters'

const accounts = {
  'accountId': {
    id: 'accountId',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  }
}
const transactions = [
  // undefined: снятие наличных в точке-партнёре
  [
    {
      isDispute: true,
      hasStatement: true,
      isSuspicious: false,
      id: '4680706787',
      offers: [],
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'B1',
        name: 'Снятия наличных'
      },
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
      description: 'АК Барс',
      debitingTime: {
        milliseconds: 1557781200000
      },
      cashback: 0,
      brand: {
        name: 'АК Барс',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/akb.png',
        id: '11290',
        roundedLogo: false,
        baseColor: '009b3a',
        logoFile: 'akb.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 3000
      },
      operationTime: {
        milliseconds: 1557571065000
      },
      spendingCategory: {
        id: '52',
        name: 'Наличные',
        icon: '21',
        parentId: '8'
      },
      isHce: false,
      mcc: 6011,
      category: {
        id: '21',
        name: 'Наличные'
      },
      additionalInfo: [{
        fieldName: 'Номер банкомата',
        fieldValue: '00000350'
      }],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1044978418',
      merchant: {
        name: 'ABB 1 NOVAYA',
        region: {
          country: 'RUS',
          city: 'NOVAYA TURA',
          address: 'NOVAYA , 1',
          zip: '422540'
        }
      },
      card: '45444052',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6011',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******0344',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 3000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-11T13:37:45+03:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_id': '4680706787',
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '4680706787',
          'invoice': null,
          'sum': -3000
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': null,
            'type': 'cash'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 3000
        }
      ]
    }
  ],
  [
    {
      isDispute: true,
      hasStatement: false,
      isSuspicious: false,
      id: '1399207674',
      offers: [],
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [
        {
          latitude: 55.7512419,
          longitude: 37.6184217
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
      description: 'МТС-Банк',
      cashback: 0,
      brand: {
        name: 'МТС-Банк',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/mts-bank.png',
        id: '11484',
        roundedLogo: false,
        baseColor: 'f01616',
        logoFile: 'mts-bank.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 6000
      },
      operationTime: {
        milliseconds: 1559141084000
      },
      spendingCategory: {
        id: '52',
        name: 'Наличные',
        icon: '21',
        parentId: '8'
      },
      isHce: false,
      mcc: 6011,
      category: {
        id: '21',
        name: 'Наличные'
      },
      additionalInfo: [
        {
          fieldName: 'Номер банкомата',
          fieldValue: '00000236'
        }
      ],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1039893136',
      merchant: {
        name: 'ATM-NOVIY ARBAT',
        region: {
          country: 'RUS',
          city: 'MOSCOW'
        }
      },
      card: '40366892',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6011',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******2925',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 6000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-29T14:44:44.000Z'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '1399207674',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '1399207674',
          'invoice': null,
          'sum': -6000
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': null,
            'type': 'cash'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 6000
        }
      ]
    }
  ],

  // atm-transfer-cash: снятие наличных в точке Тинькова
  [
    {
      isDispute: false,
      hasStatement: true,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountId',
        paymentId: '683624692',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'atm-transfer-cash',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {},
        cardNumber: '521324******6765'
      },
      id: '4795135232',
      offers: [],
      operationPaymentType: 'NORMAL',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'B1',
        name: 'Снятия наличных'
      },
      locations: [
        {
          latitude: 59.967003,
          longitude: 30.310005
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
      description: 'Банкомат Тинькофф',
      debitingTime: {
        milliseconds: 1559163600000
      },
      cashback: 0,
      brand: {
        name: 'Банкомат Тинькофф',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/brands/atm-transfer.png',
        id: '13421',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'atm-transfer.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 39000
      },
      operationTime: {
        milliseconds: 1559236151000
      },
      subcategory: 'Банкомат Тинькофф',
      spendingCategory: {
        id: '52',
        name: 'Наличные',
        icon: '21',
        parentId: '8'
      },
      isHce: false,
      mcc: 6011,
      category: {
        id: '21',
        name: 'Наличные'
      },
      additionalInfo: [
        {
          fieldName: 'Номер банкомата',
          fieldValue: '002032'
        }
      ],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1022338546',
      merchant: {
        name: 'Тинькофф',
        region: {
          country: 'RUS',
          city: 'ST. PETERBURG',
          address: 'ST. PETERBURG, KAMENNOOSTROVSKIY PR-T, 42.',
          zip: '197022',
          addressRus: 'ДК им. Ленсовета, 1 этаж, центральный вход, Каменноостровский пр-т, 42. ДК им. Ленсовета, 1 этаж, центральный вход'
        }
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6011',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 39000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-30T17:09:11.000Z'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '4795135232',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'p683624692',
          'invoice': null,
          'sum': -39000
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': null,
            'type': 'cash'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 39000
        }
      ]
    }
  ],

  // c2c-in-new: входящий
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountRUB',
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
          agreement: 'accountRUB',
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
      additionalInfo: [{
        fieldName: 'Номер банкомата',
        fieldValue: '10000001'
      }],
      virtualPaymentType: 0,
      account: 'accountId',
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
          '_id': '1309413682',
          'account': {
            'id': 'accountId'
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

  // p2p-anybank
  [
    {
      isDispute: true,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5032902602',
        paymentId: '692779954',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'p2p-anybank',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          pointerType: 'Телефон',
          pointer: '+79121182458',
          workflowType: 'Landing'
        },
        cardNumber: '553691******5852',
        templateId: '113942724',
        templateIsFavorite: false
      },
      id: '1451671729',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'SUSPENDED',
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
      description: 'Перевод по номеру телефона',
      cashback: 0,
      brand: {
        name: 'Перевод по номеру телефона',
        id: '16584',
        roundedLogo: true
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 500
      },
      operationTime: {
        milliseconds: 1559898945000
      },
      subcategory: 'Перевод по номеру телефона',
      spendingCategory: {
        id: '40',
        name: 'Финансы',
        icon: '7',
        parentId: '5'
      },
      isHce: false,
      mcc: 6012,
      category: {
        id: '7',
        name: 'Финан. услуги'
      },
      additionalInfo: [
        {
          fieldName: 'Номер банкомата',
          fieldValue: '21000011'
        }
      ],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1026542711',
      card: '27057739',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6012',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '553691******5852',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 500
      }
    },
    {
      'comment': 'Перевод по номеру телефона +7******2458',
      'date': new Date('2019-06-07T09:15:45+00:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_id': '1451671729',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'p692779954',
          'invoice': null,
          'sum': -500
        }
      ]
    }
  ],

  // c2c-anytoany
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5145485040',
        paymentId: '688997237',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'c2c-anytoany',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          toCardNumber: '437772******0921'
        },
        cardNumber: '479087******3052'
      },
      id: '1433084721',
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
      description: 'Перевод с карты на карту',
      cashback: 0,
      brand: {
        name: 'Перевод с карты на карту',
        id: 'c2c-anytoany',
        roundedLogo: false
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 2000
      },
      operationTime: {
        milliseconds: 1559642010000
      },
      subcategory: 'Перевод с карты на карту',
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
      additionalInfo: [
        {
          fieldName: 'Номер банкомата',
          fieldValue: '11000010'
        }
      ],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1055312388',
      card: '55622113',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6012',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '437772******0921',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 2000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-06-04T09:53:30+00:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_id': '1433084721',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'p688997237',
          'invoice': null,
          'sum': 2000
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': ['3052'],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -2000
        }
      ]
    }
  ]
]

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
  const i = 4
  it('should convert transaction ' + i, () => {
    expect(
      convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
    ).toEqual(
      transactions[i][1]
    )
  })
})
