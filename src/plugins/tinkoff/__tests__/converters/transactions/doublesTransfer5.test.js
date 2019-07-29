import { convertTransaction, convertTransactions } from '../../../converters'

const accounts = {
  'cardRUB': {
    id: 'cardRUB',
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
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'cardRUB',
        paymentId: '747189957',
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
          maskedFIO: 'Михайлова Екатерина',
          pointer: '+79263225610',
          workflowType: 'TinkoffInner',
          pointerLinkId: '55314622'
        },
        cardNumber: '553691******0554',
        templateId: '127322060',
        templateIsFavorite: false
      },
      id: '1727708880',
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
      description: 'Михайлова Екатерина',
      cashback: 0,
      brand: {
        name: 'Тинькофф Банк',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/brands/tinkoff.png',
        id: '11256',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tinkoff.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 700
      },
      operationTime: {
        milliseconds: 1563860850000
      },
      subcategory: 'Михайлова Екатерина',
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
      account: 'cardRUB',
      ucid: '1038931409',
      card: '39407419',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '553691******0554',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 700
      }
    },
    {
      'comment': null,
      'date': new Date('2019-07-23T05:47:30+00:00'),
      'hold': true,
      'merchant': {
        'city': null,
        'country': null,
        'location': null,
        'mcc': null,
        'title': 'Михайлова Екатерина'
      },
      'movements': [
        {
          '_id': '1727708880',
          'account': {
            'id': 'cardRUB'
          },
          'fee': 0,
          'id': 'p747189957',
          'invoice': null,
          'sum': -700
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
        bankAccountId: 'cardRUB',
        paymentId: '747189957',
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
          maskedFIO: 'Михайлова Екатерина',
          pointer: '+79263225610',
          workflowType: 'TinkoffInner',
          pointerLinkId: '55314622'
        },
        cardNumber: '553691******0554',
        templateId: '127322060',
        templateIsFavorite: false
      },
      id: '5182519050',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
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
      description: 'Михайлова Екатерина',
      debitingTime: {
        milliseconds: 1563829200000
      },
      cashback: 0,
      brand: {
        name: 'Тинькофф Банк',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/brands/tinkoff.png',
        id: '11256',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tinkoff.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 700
      },
      operationTime: {
        milliseconds: 1563860850000
      },
      subcategory: 'Михайлова Екатерина',
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
      account: 'cardRUB',
      ucid: '1038931409',
      merchant: {
        name: 'Тинькофф Банк'
      },
      card: '39407419',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******0554',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 700
      }
    },
    {
      'comment': null,
      'date': new Date('2019-07-23T05:47:30+00:00'),
      'hold': false,
      'merchant': {
        'city': null,
        'country': null,
        'location': null,
        'mcc': null,
        'title': 'Михайлова Екатерина'
      },
      'movements': [
        {
          '_cardPresent': true,
          '_id': '5182519050',
          'account': {
            'id': 'cardRUB'
          },
          'fee': 0,
          'id': 'p747189957',
          'invoice': null,
          'sum': -700
        }
      ]
    }
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
  const i = 2
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
          'date': new Date('2019-07-23T05:47:30+00:00'),
          'hold': false,
          'merchant': {
            'city': null,
            'country': null,
            'location': null,
            'mcc': null,
            'title': 'Михайлова Екатерина'
          },
          'movements': [
            {
              'account': {
                'id': 'cardRUB'
              },
              'fee': 0,
              'id': 'p747189957',
              'invoice': null,
              'sum': -700
            }
          ]
        }
      ]
    )
  })
})
