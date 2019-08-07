/*
* Обработка ошибки дублирования холд-операций на ВСЕХ счетах в выписке
*/

import { convertTransaction, convertTransactions } from '../../../converters'

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
    [
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
          'date': new Date('2019-04-16T18:58:36+00:00'),
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
          loyaltyBonus: [{
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
          'date': new Date('2019-04-16T18:58:36+00:00'),
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
          'date': new Date('2019-04-16T18:58:36+00:00'),
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
      ]
    ],
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
      }
    ]
  ],

  // реальные операции-дубли, которые не нужно игнорировать
  [
    [
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
          'date': new Date('2019-05-22T19:04:46+00:00'),
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
          'date': new Date('2019-05-22T19:04:46+00:00'),
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
    ],
    [
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
  ],

  // две комиссионные операции похожие друг на друга, но всё же разные – должны остаться
  [
    [
      [
        {
          isDispute: false,
          hasStatement: true,
          isSuspicious: false,
          id: '5120217732',
          offers: [],
          status: 'OK',
          idSourceType: 'Prime',
          type: 'Debit',
          subgroup: {
            id: 'D2',
            name: 'Услуги банка'
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
          description: 'Плата за предоставление услуги Защита Карты',
          debitingTime: {
            milliseconds: 1563051600000
          },
          cashback: 0,
          amount: {
            currency: {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
            value: 99
          },
          operationTime: {
            milliseconds: 1563051600000
          },
          spendingCategory: {
            id: '61',
            name: 'Услуги банка'
          },
          isHce: false,
          mcc: 0,
          category: {
            id: '33',
            name: 'Другое'
          },
          additionalInfo: [],
          virtualPaymentType: 0,
          account: 'accountRUB',
          merchant: {
            name: 'Остальное'
          },
          loyaltyPayment: [],
          group: 'CHARGE',
          mccString: '0000',
          cardPresent: true,
          isExternalCard: false,
          accountAmount: {
            currency: {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
            value: 99
          }
        },
        {
          'comment': 'Плата за предоставление услуги Защита Карты',
          'date': new Date('2019-07-13T21:00:00+00:00'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              '_cardPresent': true,
              '_id': '5120217732',
              'account': {
                'id': 'accountRUB'
              },
              'fee': 0,
              'id': '5120217732',
              'invoice': null,
              'sum': -99
            }
          ]
        }
      ],
      [
        {
          isDispute: false,
          hasStatement: true,
          isSuspicious: false,
          id: '5120144367',
          offers: [],
          status: 'OK',
          idSourceType: 'Prime',
          type: 'Debit',
          subgroup: {
            id: 'D2',
            name: 'Услуги банка'
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
          description: 'Плата за обслуживание',
          debitingTime: {
            milliseconds: 1563051600000
          },
          cashback: 0,
          amount: {
            currency: {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
            value: 99
          },
          operationTime: {
            milliseconds: 1563051600000
          },
          spendingCategory: {
            id: '61',
            name: 'Услуги банка'
          },
          isHce: false,
          mcc: 0,
          category: {
            id: '33',
            name: 'Другое'
          },
          additionalInfo: [],
          virtualPaymentType: 0,
          account: 'accountRUB',
          merchant: {
            name: 'Остальное'
          },
          loyaltyPayment: [],
          group: 'CHARGE',
          mccString: '0000',
          cardPresent: true,
          isExternalCard: false,
          accountAmount: {
            currency: {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
            value: 99
          }
        },
        {
          'comment': 'Плата за обслуживание',
          'date': new Date('2019-07-13T21:00:00+00:00'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              '_cardPresent': true,
              '_id': '5120144367',
              'account': {
                'id': 'accountRUB'
              },
              'fee': 0,
              'id': '5120144367',
              'invoice': null,
              'sum': -99
            }
          ]
        }
      ]
    ],
    [
      // две реальные операции должны остаться обе
      {
        'comment': 'Плата за предоставление услуги Защита Карты',
        'date': new Date('2019-07-13T21:00:00+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'accountRUB'
            },
            'fee': 0,
            'id': '5120217732',
            'invoice': null,
            'sum': -99
          }
        ]
      },
      {
        'comment': 'Плата за обслуживание',
        'date': new Date('2019-07-13T21:00:00+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'accountRUB'
            },
            'fee': 0,
            'id': '5120144367',
            'invoice': null,
            'sum': -99
          }
        ]
      }
    ]
  ]
]

describe('convertTransaction', () => {
  for (let j = 0; j < transactions.length; j++) {
    const trans = transactions[j][0]
    for (let i = 0; i < trans.length; i++) {
      it(`should convert transaction #${j}:${i}`, () => {
        expect(
          convertTransaction(trans[i][0], accounts[trans[i][0].account])
        ).toEqual(
          trans[i][1]
        )
      })
    }
  }
})

xdescribe('convertOneTransaction', () => {
  const j = 0
  const i = 0
  it(`should convert transaction #${j}:${i}`, () => {
    expect(
      convertTransaction(transactions[j][0][i][0], accounts[transactions[j][0][i][0].account])
    ).toEqual(
      transactions[j][0][i][1]
    )
  })
})

describe('convertTransactions', () => {
  for (let j = 0; j < transactions.length; j++) {
    it('should return transaction without fake doubles #' + j, () => {
      expect(
        convertTransactions(transactions[j][0].map(item => item[0]), accounts)
      ).toEqual(
        transactions[j][1]
      )
    })
  }
})
