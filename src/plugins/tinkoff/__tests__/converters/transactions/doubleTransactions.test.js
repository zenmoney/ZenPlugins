import { convertTransaction, convertTransactions } from '../../../converters'

const accounts = {
  '5040636556': {
    id: '5040636556',
    title: 'Карта Black RUB',
    type: 'ccard',
    syncID: ['4567'],
    instrument: 'RUB'
  },
  '8105795127': {
    id: '8105795127',
    title: 'Накопительный счёт',
    type: 'chacking',
    syncID: [ '1234' ],
    instrument: 'RUB'
  }
  // 6339534 – external
}

const transactions = [
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '8105795127',
        paymentId: '697163191',
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
          agreement: '8105795127',
          unid: 'E.1792405187'
        },
        cardNumber: '510621******1716' // external card
      },
      id: '4880193381',
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
        milliseconds: 1560200400000
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
        value: 10000
      },
      operationTime: {
        milliseconds: 1560236192000
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
      account: '8105795127',
      ucid: '1036827941',
      card: '37308321',
      loyaltyPayment: [],
      group: 'INCOME',
      mccString: '0000',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '518901******5910',
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
      'comment': 'Перевод с карты',
      'date': new Date('2019-06-11T06:56:32+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '4880193381',
          'account': {
            'id': '8105795127'
          },
          'fee': 0,
          'id': 'p697163191',
          'invoice': null,
          'sum': 10000
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': ['1716'],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -10000
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
        bankAccountId: '8105795127',
        paymentId: '697163191',
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
          agreement: '8105795127',
          unid: 'E.1792405187'
        },
        cardNumber: '510621******1716'
      },
      id: '4880193388',
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
        milliseconds: 1560200400000
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
        value: 10000
      },
      operationTime: {
        milliseconds: 1560236192000
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
      account: '5040636556',
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
      'comment': 'Перевод с карты',
      'date': new Date('2019-06-11T06:56:32+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '4880193388',
          'account': {
            'id': '5040636556'
          },
          'fee': 0,
          'id': 'p697163191',
          'invoice': null,
          'sum': 10000
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
        bankAccountId: '8105795127',
        paymentId: '697163191',
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
          agreement: '8105795127',
          unid: 'E.1792405187'
        },
        cardNumber: '510621******1716'
      },
      id: '4880193395',
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
        milliseconds: 1560200400000
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
        value: 10000
      },
      operationTime: {
        milliseconds: 1560236192000
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
      account: '5040636556',
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
        value: 10000
      }
    },
    {
      'comment': 'Перевод с карты',
      'date': new Date('2019-06-11T06:56:32+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '4880193395',
          'account': {
            'id': '5040636556'
          },
          'fee': 0,
          'id': 'p697163191',
          'invoice': null,
          'sum': -10000
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
        bankAccountId: '8105795127',
        paymentId: '697163191',
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
          agreement: '8105795127',
          unid: 'E.1792405187'
        },
        cardNumber: '510621******1716'
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
        value: 10000
      },
      operationTime: {
        milliseconds: 1560236166000
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
      account: '6339534',
      card: '6339534',
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
        value: 10000
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
          'date': new Date('2019-06-11T06:56:32+00:00'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': '8105795127'
              },
              'fee': 0,
              'id': 'p697163191_4880193381',
              'invoice': null,
              'sum': 10000
            },
            {
              'account': {
                'company': null,
                'instrument': 'RUB',
                'syncIds': ['1716'],
                'type': 'ccard'
              },
              'fee': 0,
              'id': null,
              'invoice': null,
              'sum': -10000
            }
          ]
        },
        {
          'comment': 'Перевод с карты',
          'date': new Date('2019-06-11T06:56:32+00:00'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': '5040636556'
              },
              'fee': 0,
              'id': 'p697163191_4880193388',
              'invoice': null,
              'sum': 10000
            }
          ]
        }
      ]
    )
  })
})
