import { convertTransaction, convertTransactions } from '../../../converters'

const accounts = {
  'cardRUB': {
    id: 'cardRUB',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  },
  'accountRUB': {
    id: 'accountRUB',
    title: 'Счет Black EUR',
    type: 'ccard',
    syncID: ['4567'],
    instrument: 'EUR'
  }
}

// Обмен валюты
const transactions = [
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountRUB',
        paymentId: '729313093',
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
          agreement: 'accountRUB'
        },
        cardNumber: '427942******4173'
      },
      id: '5070206975',
      offers: [],
      operationPaymentType: 'NORMAL',
      status: 'OK',
      idSourceType: 'Prime',
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
      description: 'Перевод с карты',
      debitingTime: {
        milliseconds: 1562533200000
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
        value: 11000
      },
      operationTime: {
        milliseconds: 1562575190000
      },
      subcategory: 'Перевод с карты',
      spendingCategory: {
        id: '51',
        name: 'Другое',
        icon: '33',
        parentId: '8'
      },
      isHce: false,
      mcc: 0,
      partnerType: 'card2card',
      category: {
        id: '33',
        name: 'Другое'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'cardRUB',
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
        value: 11000
      }
    },
    {
      'comment': 'Перевод с карты',
      'date': new Date('2019-07-08T08:39:50+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '5070206975',
          'account':
            {
              'id': 'cardRUB'
            },
          'fee': 0,
          'id': 'p729313093',
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
        bankAccountId: 'accountRUB',
        paymentId: '729313093',
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
          agreement: 'accountRUB'
        },
        cardNumber: '427942******4173'
      },
      id: '5070206978',
      offers: [],
      operationPaymentType: 'NORMAL',
      status: 'OK',
      idSourceType: 'Prime',
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
      debitingTime: {
        milliseconds: 1562533200000
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
        value: 11000
      },
      operationTime: {
        milliseconds: 1562575190000
      },
      subcategory: 'Перевод с карты',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      partnerType: 'card2card',
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'cardRUB',
      loyaltyPayment: [],
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
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
      'comment': 'Перевод с карты',
      'date': new Date('2019-07-08T08:39:50+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '5070206978',
          'account':
            {
              'id': 'cardRUB'
            },
          'fee': 0,
          'id': 'p729313093',
          'invoice': null,
          'sum': -11000
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
        bankAccountId: 'accountRUB',
        paymentId: '729313093',
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
          agreement: 'accountRUB'
        },
        cardNumber: '427942******4173'
      },
      id: '5070206973',
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
        milliseconds: 1562533200000
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
        value: 11000
      },
      operationTime: {
        milliseconds: 1562575190000
      },
      subcategory: 'Перевод с карты',
      spendingCategory: {
        id: '70',
        name: 'Пополнения',
        icon: '33'
      },
      isHce: false,
      mcc: 0,
      partnerType: 'card2card',
      category: {
        id: '33',
        name: 'Другое'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountRUB',
      ucid: '1057018421',
      card: '57328090',
      loyaltyPayment: [],
      group: 'INCOME',
      mccString: '0000',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '518901******5726',
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
      'comment': 'Перевод с карты',
      'date': new Date('2019-07-08T08:39:50+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '5070206973',
          'account': {
            'id': 'accountRUB'
          },
          'fee': 0,
          'id': 'p729313093',
          'invoice': null,
          'sum': 11000
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': ['4173'],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -11000
        }
      ]
    }
  ],
  [
    {
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountRUB',
        paymentId: '729313093',
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
          agreement: 'accountRUB'
        },
        cardNumber: '427942******4173'
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
        value: 11000
      },
      operationTime: {
        milliseconds: 1562575148000
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
      account: 'externalCard',
      card: 'externalCard',
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
        value: 11000
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
          'comment': 'Перевод с карты',
          'date': new Date('2019-07-08T08:39:50+00:00'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': 'cardRUB'
              },
              'fee': 0,
              'id': 'p729313093_5070206975',
              'invoice': null,
              'sum': 11000
            }
          ]
        },
        {
          'comment': 'Перевод с карты',
          'date': new Date('2019-07-08T08:39:50+00:00'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': 'cardRUB'
              },
              'fee': 0,
              'id': 'p729313093_5070206978',
              'invoice': null,
              'sum': -11000
            }
          ]
        }
      ]
    )
  })
})
