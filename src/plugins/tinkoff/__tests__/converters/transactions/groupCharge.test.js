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
  // комиссия за услуги банка
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountId',
        paymentId: '659293898',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 533.82
        },
        providerId: 'c2c-out',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankCard: '220019******2325'
        },
        cardNumber: '553691******8627',
        templateId: '105732829',
        templateIsFavorite: false
      },
      id: '4646309394',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'D1',
        name: 'Комиссии'
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
      description: 'Перевод на карту',
      debitingTime: {
        milliseconds: 1557262800000
      },
      cashback: 0,
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 533.82
      },
      operationTime: {
        milliseconds: 1557322282000
      },
      subcategory: 'Перевод на карту',
      spendingCategory: {
        id: '61',
        name: 'Услуги банка'
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
      account: 'accountId',
      ucid: '1053494779',
      merchant: {
        name: 'Остальное'
      },
      card: '29191825',
      loyaltyPayment: [],
      group: 'CHARGE',
      mccString: '0000',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******8627',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 533.82
      }
    },
    {
      'comment': 'Перевод на карту',
      'date': new Date('2019-05-08T16:31:22+03:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_id': '4646309394',
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'f659293898',
          'invoice': null,
          'sum': -533.82
        }
      ]
    }
  ],

  // плата за услуги банка
  [
    {
      isDispute: false,
      hasStatement: true,
      isSuspicious: false,
      id: '4620913997',
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
        milliseconds: 1556917200000
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
        milliseconds: 1556917200000
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
      account: 'accountId',
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
      'date': new Date('2019-05-04T00:00:00+03:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_id': '4620913997',
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '4620913997',
          'invoice': null,
          'sum': -99
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
