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
  [
    {
      isDispute: false,
      hasStatement: true,
      isSuspicious: false,
      id: '1536025716',
      offers: [],
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
      description: '',
      cashback: 0,
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 87550.55
      },
      operationTime: {
        milliseconds: 1561104374000
      },
      spendingCategory: {
        id: '51',
        name: 'Другое',
        icon: '33',
        parentId: '8'
      },
      isHce: false,
      mcc: 9999,
      category: {
        id: '33',
        name: 'ДРУГИЕ ОПЕРАЦИИ'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1037018117',
      merchant: {
        name: '',
        region: {
          country: 'RU',
          city: 'MOSCOW'
        }
      },
      card: '37498085',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '9999',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '553691******1991',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 87550.55
      }
    },
    {
      'comment': null,
      'date': new Date('2019-06-21T08:06:14+00:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_id': '1536025716',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '1536025716',
          'invoice': null,
          'sum': -87550.55
        }
      ]
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
      locations: [
        {
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
      account: 'accountId',
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
      cardNumber: '521324******1234',
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
      'comment': null,
      'date': new Date('2019-04-16T18:58:36+00:00'),
      'hold': true,
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
          '_cardPresent': true,
          '_id': '1165931124',
          'account': { 'id': 'accountId' },
          'fee': 0,
          'id': '1165931124',
          'invoice': null,
          'sum': -1041.89
        }
      ]
    }
  ],
  [
    {
      isDispute: true,
      hasStatement: false,
      isSuspicious: false,
      id: '4695417668',
      offers: [],
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'A1',
        name: ''
      },
      locations: [{
        latitude: 56.102097,
        longitude: 47.282951
      }],
      loyaltyBonus: [{
        amount: {
          value: 0,
          loyaltyProgramId: '61',
          loyalty: 'Tinkoff Junior',
          name: 'Tinkoff Junior',
          loyaltySteps: 2,
          loyaltyPointsId: 1,
          loyaltyPointsName: 'Баллы',
          loyaltyImagine: true,
          partialCompensation: false
        },
        loyaltyType: 'Cobrand',
        status: 'A'
      }],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'IP KOKOREVA M.L.',
      debitingTime: {
        milliseconds: 1557954000000
      },
      cashback: 0,
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 87
      },
      operationTime: {
        milliseconds: 1557747337000
      },
      spendingCategory: {
        id: '25',
        name: 'Супермаркеты',
        icon: '10',
        parentId: '3'
      },
      isHce: false,
      mcc: 5499,
      category: {
        id: '10',
        name: 'Супермаркеты'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1052293752',
      merchant: {
        name: 'IP KOKOREVA M.L.',
        region: {
          country: 'RUS',
          city: 'CHEBOKSARY',
          address: '16 SHUMILOVA STR',
          zip: '428000',
          addressRus: 'Россия, Чувашская Республика, Чебоксары, улица Шумилова, 16'
        }
      },
      card: '52603562',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5499',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******4763',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 87
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-13T14:35:37+03:00'),
      'hold': false,
      'merchant': {
        'title': 'IP KOKOREVA M.L.',
        'city': 'CHEBOKSARY',
        'country': 'RUS',
        'location': {
          'latitude': 56.102097,
          'longitude': 47.282951
        },
        'mcc': 5499
      },
      'movements': [
        {
          '_id': '4695417668',
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '4695417668',
          'invoice': null,
          'sum': -87
        }
      ]
    }
  ],

  // [TMC] Invalid transaction 1475745169. merchant.city must be null or non-empty string
  [
    {
      isDispute: true,
      hasStatement: true,
      isSuspicious: false,
      id: '1475745169',
      offers: [],
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
      description: 'INNERSENSE ORGANIC BEA',
      cashback: 0,
      amount: {
        currency: {
          code: 840,
          name: 'USD',
          strCode: '840'
        },
        value: 83
      },
      operationTime: {
        milliseconds: 1560208252000
      },
      spendingCategory: {
        id: '54',
        name: 'Различные товары',
        icon: '29',
        parentId: '8'
      },
      isHce: false,
      mcc: 5999,
      category: {
        id: '29',
        name: 'Разные товары'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1044682206',
      merchant: {
        name: 'INNERSENSE ORGANIC BEA',
        region: {
          country: 'CA',
          city: ''
        }
      },
      card: '45147990',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5999',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '553691******1925',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 5457.25
      }
    },
    {
      'comment': null,
      'date': new Date('2019-06-10T23:10:52+00:00'),
      'hold': true,
      'merchant': {
        'city': null,
        'country': 'CA',
        'location': null,
        'mcc': 5999,
        'title': 'INNERSENSE ORGANIC BEA'
      },
      'movements': [
        {
          '_id': '1475745169',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '1475745169',
          'invoice': {
            'instrument': 'USD',
            'sum': -83
          },
          'sum': -5457.25
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
  const i = 0
  it('should convert transaction ' + i, () => {
    expect(
      convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
    ).toEqual(
      transactions[i][1]
    )
  })
})
