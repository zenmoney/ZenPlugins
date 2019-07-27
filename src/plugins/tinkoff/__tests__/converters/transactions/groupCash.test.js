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
const transactions = {
  // снятие наличных в точке-партнёре
  'undefined': [
    // снятие через банкомат АК Барс банка
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
        additionalInfo: [
          {
            fieldName: 'Номер банкомата',
            fieldValue: '00000350'
          }
        ],
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

    // снятие через банкомат МТС-банка
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

    // перевод через Western Union
    [
      {
        isDispute: true,
        hasStatement: true,
        isSuspicious: false,
        id: '4924931157',
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
        description: 'Операция в других кредитных организациях WU.COM WU RUS',
        debitingTime: {
          milliseconds: 1560805200000
        },
        cashback: 0,
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 11392.37
        },
        operationTime: {
          milliseconds: 1560607108000
        },
        spendingCategory: {
          id: '52',
          name: 'Наличные',
          icon: '21',
          parentId: '8'
        },
        isHce: false,
        mcc: 6538,
        category: {
          id: '7',
          name: 'Финан. услуги'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1046162200',
        merchant: {
          name: 'WU.COM',
          region: {
            country: 'RUS',
            city: 'WU'
          }
        },
        card: '46627326',
        loyaltyPayment: [],
        group: 'CASH',
        mccString: '6538',
        cardPresent: false,
        isExternalCard: false,
        cardNumber: '553691******9606',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 11392.37
        }
      },
      {
        'comment': null,
        'date': new Date('2019-06-15T13:58:28+00:00'),
        'hold': false,
        'merchant': {
          'city': 'WU',
          'country': 'RUS',
          'location': null,
          'mcc': 6538,
          'title': 'WU.COM'
        },
        'movements': [
          {
            '_id': '4924931157',
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4924931157',
            'invoice': null,
            'sum': -11392.37
          }
        ]
      }
    ],

    // снятие через Совком card2card переводом
    [
      {
        isDispute: true,
        hasStatement: true,
        isSuspicious: false,
        id: '4964351770',
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
        description: 'Операция в других кредитных организациях SOVCOMBANK MOSKVA RUS',
        debitingTime: {
          milliseconds: 1561237200000
        },
        cashback: 0,
        brand: {
          name: 'Совкомбанк',
          baseTextColor: 'ffffff',
          logo: 'https://static.tinkoff.ru/brands/sovcombank.png',
          id: '11586',
          roundedLogo: false,
          baseColor: '00468e',
          logoFile: 'sovcombank.png'
        },
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 5000
        },
        operationTime: {
          milliseconds: 1561132545000
        },
        spendingCategory: {
          id: '52',
          name: 'Наличные',
          icon: '21',
          parentId: '8'
        },
        isHce: false,
        mcc: 6538,
        category: {
          id: '7',
          name: 'Финан. услуги'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1027249332',
        merchant: {
          name: 'Совкомбанк',
          region: {
            country: 'RUS',
            city: 'MOSKVA'
          }
        },
        card: '27763387',
        loyaltyPayment: [],
        group: 'CASH',
        mccString: '6538',
        cardPresent: false,
        isExternalCard: false,
        cardNumber: '553691******8897',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 5000
        }
      },
      {
        'comment': null,
        'date': new Date('2019-06-21T15:55:45+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'id': '4964351770',
            '_id': '4964351770',
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'invoice': null,
            'sum': -5000
          },
          {
            'id': null,
            'account': {
              'company': { 'id': '4534' },
              'instrument': 'RUB',
              'syncIds': null,
              'type': null },
            'fee': 0,
            'invoice': null,
            'sum': 5000
          }
        ]
      }
    ]
  ],

  // c2c-out
  'c2c-out': [
    [
      {
        isDispute: true,
        hasStatement: false,
        isSuspicious: false,
        payment: {
          sourceIsQr: false,
          bankAccountId: 'accountRUB',
          paymentId: '666999252',
          paymentType: 'Transfer',
          feeAmount: { currency: [Object], value: 0 },
          providerId: 'c2c-out',
          hasPaymentOrder: false,
          comment: '',
          fieldsValues: { bankCard: '479087**7146' },
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
          currency: { code: 643, name: 'RUB', strCode: '643' },
          value: 0
        },
        authMessage: 'Операция утверждена.',
        description: 'Перевод на карту',
        cashback: 0,
        brand: { name: 'Перевод на карту', id: 'c2c-out', roundedLogo: false },
        amount: {
          currency: { code: 643, name: 'RUB', strCode: '643' },
          value: 10500
        },
        operationTime: { milliseconds: 1557952816000 },
        subcategory: 'Перевод на карту',
        spendingCategory: { id: '40', name: 'Финансы', icon: '7', parentId: '5' },
        isHce: false,
        mcc: 6012,
        partnerType: 'card2card',
        category: { id: '7', name: 'Финан. услуги' },
        additionalInfo: [{ fieldName: 'Номер банкомата', fieldValue: '10000001' }],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1022338546',
        card: '2535796',
        loyaltyPayment: [],
        group: 'CASH',
        mccString: '6012',
        cardPresent: false,
        isExternalCard: false,
        cardNumber: '521324**6765',
        accountAmount: {
          currency: { code: 643, name: 'RUB', strCode: '643' },
          value: 10500
        }
      },
      {
        'comment': null,
        'date': new Date('2019-05-15T20:40:16+00:00'),
        'hold': true,
        'merchant': null,
        'movements': [
          {
            '_id': '1321168975',
            'account': {
              'id': 'accountId'
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
              'syncIds': ['7146'],
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
      {
        isDispute: true,
        hasStatement: false,
        isSuspicious: false,
        payment: {
          sourceIsQr: false,
          bankAccountId: '5061676465',
          paymentId: '698044837',
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
            dstCardId: '6901917',
            dstCardMask: '427637******5266'
          },
          cardNumber: '553691******4725',
          templateId: '115243319',
          templateIsFavorite: false
        },
        id: '1479179381',
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
          value: 156.9
        },
        operationTime: {
          milliseconds: 1560271551000
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
        additionalInfo: [
          {
            fieldName: 'Номер банкомата',
            fieldValue: '10000001'
          }
        ],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1036691568',
        card: '37172063',
        loyaltyPayment: [],
        group: 'CASH',
        mccString: '6012',
        cardPresent: false,
        isExternalCard: false,
        cardNumber: '553691******4725',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 156.9
        }
      },
      {
        'comment': null,
        'date': new Date('2019-06-11T16:45:51+00:00'),
        'hold': true,
        'merchant': null,
        'movements': [
          {
            '_id': '1479179381',
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': 'p698044837',
            'invoice': null,
            'sum': -156.9
          },
          {
            'account': {
              'company': null,
              'instrument': 'RUB',
              'syncIds': ['5266'],
              'type': 'ccard'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': 156.9
          }
        ]
      }
    ]
  ],

  // снятие наличных в точке Тинькова
  'atm-transfer-cash': [
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
    ]
  ],

  // входящий
  'c2c-in-new': [
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
        additionalInfo: [
          {
            fieldName: 'Номер банкомата',
            fieldValue: '10000001'
          }
        ],
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
    ]
  ],

  'c2c-anytoany': [
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
  ],

  // перевод по номеру телефона
  'p2p-anybank': [
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
    ]
  ],
  'p2p-uni': [
    [
      {
        isDispute: true,
        hasStatement: false,
        isSuspicious: false,
        payment: {
          sourceIsQr: false,
          bankAccountId: 'accountId',
          paymentId: '752623414',
          paymentType: 'Transfer',
          feeAmount: {
            currency: {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
            value: 0
          },
          providerId: 'p2p-uni',
          hasPaymentOrder: false,
          comment: '',
          fieldsValues: {
            destType: 'Телефон',
            destValue: '+79252868496',
            message: 'на пиво'
          },
          cardNumber: '553691******8219',
          templateId: '128695387',
          templateIsFavorite: false
        },
        id: '1755451043',
        offers: [],
        operationPaymentType: 'TEMPLATE',
        status: 'SUSPENDED',
        idSourceType: 'Online',
        message: 'на пиво',
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
          id: 'p2p-uni',
          roundedLogo: false
        },
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 740
        },
        operationTime: {
          milliseconds: 1564231744000
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
        ucid: '1055314134',
        card: '55623860',
        loyaltyPayment: [],
        group: 'CASH',
        mccString: '6012',
        cardPresent: false,
        isExternalCard: false,
        cardNumber: '553691******8219',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 740
        }
      },
      {
        'comment': 'на пиво +7******8496',
        'date': new Date('2019-07-27T12:49:04+00:00'),
        'hold': true,
        'merchant': null,
        'movements': [
          {
            '_id': '1755451043',
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': 'p752623414',
            'invoice': null,
            'sum': -740
          }
        ]
      }
    ]
  ]
}

describe('convertTransaction', () => {
  Object.keys(transactions).forEach(type => {
    for (let i = 0; i < transactions[type].length; i++) {
      it(`should convert '${type}' #${i}`, () => {
        expect(
          convertTransaction(transactions[type][i][0], accounts[transactions[type][i][0].account])
        ).toEqual(
          transactions[type][i][1]
        )
      })
    }
  })
})

xdescribe('convertOneTransaction', () => {
  const type = 'p2p-uni'
  const i = 0
  it(`should convert '${type}' #${i}`, () => {
    expect(
      convertTransaction(transactions[type][i][0], accounts[transactions[type][i][0].account])
    ).toEqual(
      transactions[type][i][1]
    )
  })
})
