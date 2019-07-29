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

// [error] anonymous call rejected with [TypeError: null is not an object (evaluating 't.merchant.mcc')]
const transactions = [
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'cardRUB',
        paymentId: '748065392',
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
          agreement: 'cardRUB'
        },
        cardNumber: '427655******2568'
      },
      id: '1732256175',
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
        value: 1008
      },
      operationTime: {
        milliseconds: 1563902113000
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
      account: 'cardRUB',
      ucid: '1038126153',
      card: '38603667',
      loyaltyPayment: [],
      group: 'INCOME',
      mccString: '0000',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '553691******8629',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1008
      }
    },
    {
      'comment': null,
      'date': new Date('2019-07-23T17:15:13+00:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_id': '1732256175',
          'account': {
            'id': 'cardRUB'
          },
          'fee': 0,
          'id': 'p748065392',
          'invoice': null,
          'sum': 1008
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': ['2568'],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -1008
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
        paymentId: '748065392',
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
          agreement: 'cardRUB'
        },
        cardNumber: '427655******2568'
      },
      id: '5189654029',
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
        milliseconds: 1563829200000
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
        value: 1008
      },
      operationTime: {
        milliseconds: 1563902113000
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
      account: 'cardRUB',
      ucid: '1038126153',
      card: '38603667',
      loyaltyPayment: [],
      group: 'INCOME',
      mccString: '0000',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******8629',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1008
      }
    },
    {
      'comment': 'Перевод с карты',
      'date': new Date('2019-07-23T17:15:13+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '5189654029',
          'account': {
            'id': 'cardRUB'
          },
          'fee': 0,
          'id': 'p748065392',
          'invoice': null,
          'sum': 1008
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': ['2568'],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -1008
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
        bankAccountId: 'cardRUB',
        paymentId: '748065392',
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
          agreement: 'cardRUB'
        },
        cardNumber: '427655******2568'
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
        value: 1008
      },
      operationTime: {
        milliseconds: 1563901988000
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
      account: '8788723',
      card: '8788723',
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
        value: 1008
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
  const i = 0
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
          'date': new Date('2019-07-23T17:15:13+00:00'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': 'cardRUB'
              },
              'fee': 0,
              'id': 'p748065392',
              'invoice': null,
              'sum': 1008
            },
            {
              'account': {
                'company': null,
                'instrument': 'RUB',
                'syncIds': ['2568'],
                'type': 'ccard'
              },
              'fee': 0,
              'id': null,
              'invoice': null,
              'sum': -1008
            }
          ]
        }
      ]
    )
  })
})
