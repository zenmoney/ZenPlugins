import { convertTransaction } from '../../../converters'

const accounts = {
  'accountId': {
    id: 'accountId',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  },
  'deposit_rub': {
    id: 'deposit_rub',
    title: 'Мультивалютный вклад RUB',
    type: 'checking',
    syncID: ['6666'],
    instrument: 'RUB'
  }
}

const transactions = {
  'C1': [
    // C1: пополнение со своего счёта в другом банке
    [
      {
        isDispute: false,
        nomination: 'ПЕРЕВОД НА СВОЙ СЧЁТ',
        hasStatement: false,
        isSuspicious: false,
        id: '4691926762',
        offers: [],
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C1',
          name: 'Пополнения'
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
        description: 'Пополнение через Ситибанк',
        debitingTime: {
          milliseconds: 1557867600000
        },
        cashback: 0,
        senderDetails: 'ИВАН ИВАНОВИЧ ИВАНОВ//RUSSIA,115054, МОСКВА Г,ТАТАРСКАЯ УЛ,1 1//',
        brand: {
          name: 'Ситибанк',
          baseTextColor: 'ffffff',
          logo: 'https://static.tinkoff.ru/brands/citibank.png',
          id: '11253',
          roundedLogo: false,
          baseColor: '0088d4',
          logoFile: 'citibank.png'
        },
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 35000
        },
        operationTime: {
          milliseconds: 1557938260000
        },
        spendingCategory: {
          id: '70',
          name: 'Пополнения',
          icon: '33'
        },
        isHce: false,
        mcc: 0,
        partnerType: 'BankDepositionType',
        category: {
          id: '33',
          name: 'Другое'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1012234196',
        card: '12783017',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '437773******3511',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 35000
        }
      },
      {
        'hold': false,
        'date': new Date('2019-05-15T19:37:40+03:00'),
        'merchant': null,
        'movements': [
          {
            '_id': '4691926762',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4691926762',
            'invoice': null,
            'sum': 35000
          }
        ],
        'comment': 'ПЕРЕВОД НА СВОЙ СЧЁТ'
      }
    ],

    // C1: возврат денежных средств
    [
      {
        isDispute: false,
        nomination: 'Возврат денежных средств по договору № 23-05-19-01-Ма от 23.05.2019г.  НДС не облагается.',
        hasStatement: false,
        isSuspicious: false,
        id: '4769891772',
        offers: [],
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C1',
          name: 'Пополнения'
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
        description: 'Пополнение через Сбербанк',
        debitingTime: {
          milliseconds: 1558904400000
        },
        cashback: 0,
        senderDetails: 'ООО "Амбитур"',
        brand: {
          name: 'Сбербанк',
          baseTextColor: 'ffffff',
          logo: 'https://static.tinkoff.ru/brands/sberbank.png',
          id: '11242',
          roundedLogo: false,
          link: 'http://www.sberbank.ru/',
          baseColor: '309c0b',
          logoFile: 'sberbank.png'
        },
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 1500
        },
        operationTime: {
          milliseconds: 1558964611000
        },
        spendingCategory: {
          id: '70',
          name: 'Пополнения',
          icon: '33'
        },
        isHce: false,
        mcc: 0,
        partnerType: 'BankDepositionType',
        category: {
          id: '33',
          name: 'Другое'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1046781894',
        card: '47246707',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '553691******0733',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 1500
        }
      },
      {
        'comment': 'Возврат денежных средств по договору № 23-05-19-01-Ма от 23.05.2019г.  НДС не облагается.',
        'date': new Date('2019-05-27T13:43:31.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_cardPresent': true,
            '_id': '4769891772',
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4769891772',
            'invoice': null,
            'sum': 1500
          }
        ]
      }
    ],

    // C1: заработная плата
    [
      {
        isDispute: false,
        nomination: 'ЗАРАБОТНАЯ ПЛАТА ЗА 1 ПОЛОВИНУ ИЮНЯ2019 ГОДА                             НДС НЕ ОБЛАГАЕТСЯ',
        hasStatement: false,
        isSuspicious: false,
        id: '4968114177',
        offers: [],
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C1',
          name: 'Пополнения'
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
        description: 'Пополнение через Ситибанк',
        debitingTime: {
          milliseconds: 1561323600000
        },
        cashback: 0,
        senderDetails: 'ПЕПСИКО ХОЛДИНГС ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ//141580; РОССИЯ, МОСКОВСКАЯ ОБЛ.,СОЛНЕЧНОГОРСКИЙ Р-Н,Г.,ТЕРРИТОРИЯСЭЗ ШЕРРИЗОН,,,СТР.1,//',
        brand: {
          name: 'Ситибанк',
          baseTextColor: 'ffffff',
          logo: 'https://static.tinkoff.ru/brands/citibank.png',
          id: '11253',
          roundedLogo: false,
          baseColor: '0088d4',
          logoFile: 'citibank.png'
        },
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 46093.1
        },
        operationTime: {
          milliseconds: 1561362359000
        },
        spendingCategory: {
          id: '70',
          name: 'Пополнения',
          icon: '33'
        },
        isHce: false,
        mcc: 0,
        partnerType: 'BankDepositionType',
        category: {
          id: '33',
          name: 'Другое'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1027265294',
        card: '27779348',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '437772******8302',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 46093.1
        }
      },
      {
        'comment': 'ЗАРАБОТНАЯ ПЛАТА ЗА 1 ПОЛОВИНУ ИЮНЯ2019 ГОДА                             НДС НЕ ОБЛАГАЕТСЯ',
        'date': new Date('2019-06-24T07:45:59+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_cardPresent': true,
            '_id': '4968114177',
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4968114177',
            'invoice': null,
            'sum': 46093.1
          }
        ]
      }
    ]
  ],

  'C2': [
    // C2, c2c-in-new: входящий card2card перевод
    [
      {
        isDispute: false,
        hasStatement: false,
        isSuspicious: false,
        payment: {
          sourceIsQr: false,
          bankAccountId: '5006319460',
          paymentId: '667755234',
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
            unid: 'M.1712396146'
          },
          cardNumber: '546975******4563'
        },
        id: '4698219023',
        offers: [],
        operationPaymentType: 'NORMAL',
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C2',
          name: 'Пополнения'
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
        description: 'Перевод с карты',
        debitingTime: {
          milliseconds: 1557954000000
        },
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
          value: 100
        },
        operationTime: {
          milliseconds: 1558010292000
        },
        subcategory: 'Перевод с карты',
        spendingCategory: {
          id: '70',
          name: 'Пополнения',
          icon: '33'
        },
        isHce: false,
        mcc: 6012,
        partnerType: 'card2card',
        category: {
          id: '7',
          name: 'Финан. услуги'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1033551881',
        card: '34039318',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '6012',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '553691******1741',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 100
        }
      },
      {
        'comment': 'Перевод с карты',
        'date': new Date('2019-05-16T15:38:12+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_id': '4698219023',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': 'p667755234',
            'invoice': null,
            'sum': 100
          },
          {
            'account': {
              'company': null,
              'instrument': 'RUB',
              'syncIds': ['4563'],
              'type': 'ccard'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -100
          }
        ]
      }
    ],

    // C2, c2c-in-new:
    [
      {
        isDispute: false,
        hasStatement: false,
        isSuspicious: false,
        payment: {
          sourceIsQr: false,
          bankAccountId: '0324448372',
          paymentId: '671179846',
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
            agreement: '0324448372',
            unid: 'M.1721871125'
          },
          cardNumber: '427687******3933'
        },
        id: '4718739054',
        offers: [],
        operationPaymentType: 'NORMAL',
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C2',
          name: 'Пополнения'
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
        description: 'Перевод с карты',
        debitingTime: {
          milliseconds: 1558213200000
        },
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
          value: 5100
        },
        operationTime: {
          milliseconds: 1558287817000
        },
        subcategory: 'Перевод с карты',
        spendingCategory: {
          id: '70',
          name: 'Пополнения',
          icon: '33'
        },
        isHce: false,
        mcc: 6012,
        partnerType: 'card2card',
        category: {
          id: '7',
          name: 'Финан. услуги'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1043916547',
        card: '44383797',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '6012',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '521324******9322',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 5100
        }
      },
      {
        'comment': 'Перевод с карты',
        'date': new Date('2019-05-19T20:43:37+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_id': '4718739054',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': 'p671179846',
            'invoice': null,
            'sum': 5100
          },
          {
            'account': {
              'company': null,
              'instrument': 'RUB',
              'syncIds': ['3933'],
              'type': 'ccard'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -5100
          }
        ]
      }
    ]
  ],

  'C3': [
    [
      {
        isDispute: false,
        hasStatement: true,
        isSuspicious: false,
        id: '4705900611',
        offers: [],
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C3',
          name: 'Пополнения'
        },
        locations: [
          {
            latitude: 59.9613246,
            longitude: 30.1716519
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
        description: 'Пополнение. Тинькофф Банк, 2071 Санкт-Петербург Россия',
        debitingTime: {
          milliseconds: 1558040400000
        },
        cashback: 0,
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 2200
        },
        operationTime: {
          milliseconds: 1558105408000
        },
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
        account: 'accountId',
        ucid: '1045680694',
        card: '46145996',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '553691******9105',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 2200
        }
      },
      {
        'comment': 'Пополнение. Тинькофф Банк, 2071 Санкт-Петербург Россия',
        'date': new Date('2019-05-17T18:03:28+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_id': '4705900611',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4705900611',
            'invoice': null,
            'sum': 2200
          }
        ]
      }
    ]
  ],

  // входящий перевод
  'C4': [
    [
      {
        isDispute: false,
        hasStatement: true,
        isSuspicious: false,
        id: '4717785195',
        offers: [],
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C4',
          name: 'Пополнения'
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
        description: 'Василь Петрович',
        debitingTime: {
          milliseconds: 1558213200000
        },
        cashback: 0,
        senderDetails: 'Василь Петрович',
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 18630
        },
        operationTime: {
          milliseconds: 1558260855000
        },
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
        account: 'accountId',
        ucid: '1045680694',
        merchant: {
          name: 'Входящий перевод'
        },
        card: '46145996',
        loyaltyPayment: [],
        senderAgreement: '5103843149',
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '553691******9105',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 18630
        }
      },
      {
        'comment': null,
        'date': new Date('2019-05-19T13:14:15+03:00'),
        'hold': false,
        'merchant': {
          'title': 'Василь Петрович',
          'city': null,
          'country': null,
          'location': null,
          'mcc': null
        },
        'movements': [
          {
            '_id': '4717785195',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4717785195',
            'invoice': null,
            'sum': 18630
          }
        ]
      }
    ]
  ],

  // перевод между своими счетами
  'C5': [
    [
      {
        isDispute: false,
        hasStatement: false,
        isSuspicious: false,
        payment: {
          sourceIsQr: false,
          bankAccountId: '5005653521',
          paymentId: '666839507',
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
            bankContract: '6000729910'
          },
          cardNumber: '437773******3511',
          templateId: '56151224',
          templateIsFavorite: false
        },
        id: '4692024440',
        offers: [],
        operationPaymentType: 'TEMPLATE',
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C5',
          name: 'Пополнения'
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
        description: 'Перевод Расчетная карта. ТПС 8.0 RUB',
        debitingTime: {
          milliseconds: 1557867600000
        },
        cashback: 0,
        senderDetails: 'Иван Царевич',
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 30000
        },
        operationTime: {
          milliseconds: 1557941635000
        },
        subcategory: 'Перевод Расчетная карта. ТПС 8.0 RUB',
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
        account: 'accountId',
        ucid: '1041509381',
        merchant: {
          name: 'Перевод между своими счетами'
        },
        card: '41978525',
        loyaltyPayment: [],
        senderAgreement: '5005653521',
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '518901******3944',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 30000
        }
      },
      {
        'comment': null,
        'date': new Date('2019-05-15T20:33:55+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_id': '4692024440',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': 'p666839507',
            'invoice': null,
            'sum': 30000
          }
        ]
      }
    ]
  ],

  // проценты на мультивалютном вкладе
  'C6': [
    [
      {
        hasStatement: false,
        isSuspicious: false,
        id: '1681138819',
        offers: [],
        status: 'OK',
        idSourceType: 'Inversion',
        type: 'Credit',
        subgroup: {
          id: 'C6',
          name: 'Проценты'
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
        description: 'Капитализация',
        debitingTime: {
          milliseconds: 1557694800000
        },
        rubAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 296.1
        },
        cashback: 0,
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 296.1
        },
        operationTime: {
          milliseconds: 1557694800000
        },
        spendingCategory: {
          id: 'CPTL',
          name: 'Проценты',
          icon: 'CPTL'
        },
        isHce: false,
        mcc: 0,
        category: {
          id: 'CPTL',
          name: 'Проценты'
        },
        additionalInfo: [],
        account: 'deposit_rub',
        loyaltyPayment: [],
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 296.1
        }
      },
      {
        'comment': 'Капитализация',
        'date': new Date('2019-05-13T00:00:00+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_id': '1681138819',
            '_cardPresent': true,
            'account': {
              'id': 'deposit_rub'
            },
            'fee': 0,
            'id': '1681138819',
            'invoice': null,
            'sum': 296.1
          }
        ]
      }
    ]
  ],

  // зарплата
  'C8': [
    [
      {
        isDispute: false,
        hasStatement: true,
        isSuspicious: false,
        id: '4459696612',
        offers: [],
        status: 'OK',
        idSourceType: 'Prime',
        type: 'Credit',
        subgroup: {
          id: 'C8',
          name: 'Зарплата'
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
        description: 'Пополнение ООО "МЕДИА-РЕСУРС". Зарплата',
        debitingTime: {
          milliseconds: 1554843600000
        },
        cashback: 0,
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 5621
        },
        operationTime: {
          milliseconds: 1554863420000
        },
        spendingCategory: {
          id: '51',
          name: 'Другое',
          icon: '33',
          parentId: '8'
        },
        isHce: false,
        mcc: 0,
        category: {
          id: '33',
          name: 'Другое'
        },
        additionalInfo: [],
        virtualPaymentType: 0,
        account: 'accountId',
        ucid: '1025675756',
        merchant: {
          name: 'Зарплата'
        },
        card: '26192773',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '521324******0187',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 5621
        }
      },
      {
        'comment': 'Пополнение ООО "МЕДИА-РЕСУРС". Зарплата',
        'date': new Date('2019-04-10T05:30:20+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_id': '4459696612',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4459696612',
            'invoice': null,
            'sum': 5621
          }
        ]
      }
    ]
  ],

  // пополнение вклада
  'C9': [
    [
      {
        hasStatement: false,
        isSuspicious: false,
        payment: {
          sourceIsQr: false,
          bankAccountId: '5017416909',
          paymentId: '645738013',
          paymentType: 'Transfer',
          feeAmount: {
            currency: {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
            value: 0
          },
          providerId: 'transfer-deposit',
          hasPaymentOrder: false,
          comment: '',
          fieldsValues: {
            vbxlAccount: 'accountId'
          },
          cardNumber: '553691******2661',
          templateId: '99181798',
          templateIsFavorite: false
        },
        id: '1680144038',
        offers: [],
        status: 'OK',
        idSourceType: 'Inversion',
        type: 'Credit',
        subgroup: {
          id: 'C9',
          name: 'Пополнение вклада'
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
        description: 'Пополнение вклада. Счет АО "ТИНЬКОФФ БАНК"',
        debitingTime: {
          milliseconds: 1556204070000
        },
        rubAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 10000
        },
        cashback: 0,
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 10000
        },
        operationTime: {
          milliseconds: 1556204070000
        },
        subcategory: 'Пополнение вклада. Счет АО "ТИНЬКОФФ БАНК"',
        spendingCategory: {
          id: 'RCPT ACCT',
          name: 'Пополнение вклада',
          icon: 'RCPT ACCT'
        },
        isHce: false,
        mcc: 0,
        category: {
          id: 'RCPT ACCT',
          name: 'Пополнение вклада'
        },
        additionalInfo: [],
        account: 'accountId',
        loyaltyPayment: [],
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 10000
        }
      },
      {
        'comment': 'Пополнение вклада. Счет АО "ТИНЬКОФФ БАНК"',
        'date': new Date('2019-04-25T17:54:30+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            '_id': '1680144038',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': 'p645738013',
            'invoice': null,
            'sum': 10000
          }
        ]
      }
    ]
  ],

  // пополнение по номеру телефона с сообщением
  'C10': [
    [
      {
        isDispute: false,
        hasStatement: true,
        isSuspicious: false,
        id: '4736769117',
        offers: [],
        status: 'OK',
        idSourceType: 'Prime',
        message: 'KEK',
        type: 'Credit',
        subgroup: {
          id: 'C10',
          name: 'Пополнение по номеру телефона'
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
        description: 'Сидоров С.',
        debitingTime: {
          milliseconds: 1558472400000
        },
        senderFullName: {
          patronymic: '',
          lastName: 'С',
          firstName: 'Сидоров'
        },
        cashback: 0,
        brand: {
          name: 'Сбербанк',
          baseTextColor: 'ffffff',
          logo: 'https://static.tinkoff.ru/brands/sberbank.png',
          id: '11242',
          roundedLogo: false,
          link: 'http://www.sberbank.ru/',
          baseColor: '309c0b',
          logoFile: 'sberbank.png'
        },
        amount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 10
        },
        operationTime: {
          milliseconds: 1558515563000
        },
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
        account: 'accountId',
        ucid: '1022338546',
        card: '2535796',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '0000',
        cardPresent: true,
        isExternalCard: false,
        cardNumber: '521324******6765',
        accountAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 10
        }
      },
      {
        'date': new Date('2019-05-22T11:59:23+03:00'),
        'hold': false,
        'merchant': {
          'title': 'Сидоров С.',
          'city': null,
          'country': null,
          'location': null,
          'mcc': null
        },
        'movements': [
          {
            '_id': '4736769117',
            '_cardPresent': true,
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '4736769117',
            'invoice': null,
            'sum': 10
          }
        ],
        'comment': 'KEK'
      }
    ]
  ],

  // прочие поступления
  'undefined': [
    [
      {
        isDispute: false,
        hasStatement: false,
        isSuspicious: false,
        id: '1343137543',
        offers: [],
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
        description: 'Элекснет',
        cashback: 0,
        brand: {
          name: 'Элекснет',
          baseTextColor: 'ffffff',
          logo: 'https://static.tinkoff.ru/brands/elexnet.png',
          id: '14424',
          roundedLogo: false,
          baseColor: 'e3712f',
          logoFile: 'elexnet.png'
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
          milliseconds: 1558289854000
        },
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
        account: 'accountId',
        ucid: '1045680694',
        card: '46145996',
        loyaltyPayment: [],
        group: 'INCOME',
        mccString: '0000',
        cardPresent: false,
        isExternalCard: false,
        cardNumber: '553691******9105',
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
        'date': new Date('2019-05-19T21:17:34+03:00'),
        'hold': true,
        'merchant': {
          'city': null,
          'country': null,
          'location': null,
          'mcc': null,
          'title': 'Элекснет'
        },
        'movements': [
          {
            '_id': '1343137543',
            'account': {
              'id': 'accountId'
            },
            'fee': 0,
            'id': '1343137543',
            'invoice': null,
            'sum': 3000
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
  const type = 'C1'
  const i = 4
  it('should convert transaction ' + i, () => {
    expect(
      convertTransaction(transactions[type][i][0], accounts[transactions[type][i][0].account])
    ).toEqual(
      transactions[type][i][1]
    )
  })
})
