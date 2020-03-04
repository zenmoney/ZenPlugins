import { convertTransaction, convertTransactions } from '../../../converters'

const accounts = {
  'cardRUB': {
    id: 'cardRUB',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  },
  'cardUSD': {
    id: 'cardUSD',
    title: 'Счет Black USD',
    type: 'ccard',
    syncID: ['4567'],
    instrument: 'USD'
  }
}

// Обмен валюты с ошибочным дублем! внутри этого перевода
const transactions = [
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment:
      {
        sourceIsQr: false,
        bankAccountId: 'cardUSD',
        paymentId: '746768370',
        paymentType: 'Transfer',
        feeAmount:
          {
            currency:
              {
                code: 840,
                name: 'USD',
                strCode: '840'
              },
            value: 0
          },
        providerId: 'transfer-inner',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues:
          {
            bankContract: 'cardRUB'
          },
        cardNumber: '553691******1234',
        templateId: '57805526',
        templateIsFavorite: false
      },
      id: '1725897374',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Credit',
      locations: [],
      loyaltyBonus: [],
      cashbackAmount:
      {
        currency:
          {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перевод Расчетная карта. ТПС 3.0 RUB',
      cashback: 0,
      senderDetails: 'Ольга Петрова',
      brand:
      {
        name: 'Перевод между своими счетами',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount:
      {
        currency:
          {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
        value: 2050
      },
      operationTime:
      {
        milliseconds: 1563813153000
      },
      subcategory: 'Перевод Расчетная карта. ТПС 3.0 RUB',
      spendingCategory:
      {
        id: '70',
        name: 'Пополнения',
        icon: '33'
      },
      isHce: false,
      mcc: 0,
      category:
      {
        id: '33',
        name: 'Другое'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'cardRUB',
      ucid: '1035858969',
      card: '36340389',
      loyaltyPayment: [],
      senderAgreement: 'cardUSD',
      group: 'INCOME',
      mccString: '0000',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '553691******1234',
      accountAmount:
      {
        currency:
          {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
        value: 2050
      }
    },
    {
      'comment': null,
      'date': new Date('2019-07-22T16:32:33+00:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_id': '1725897374',
          'account':
            {
              'id': 'cardRUB'
            },
          'fee': 0,
          'id': 'p746768370',
          'invoice': null,
          'sum': 2050
        }
      ]
    }
  ],

  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment:
      {
        sourceIsQr: false,
        bankAccountId: 'cardUSD',
        paymentId: '746768370',
        paymentType: 'Transfer',
        feeAmount:
          {
            currency:
              {
                code: 840,
                name: 'USD',
                strCode: '840'
              },
            value: 0
          },
        providerId: 'transfer-inner',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues:
          {
            bankContract: 'cardRUB'
          },
        cardNumber: '553691******1234',
        templateId: '57805526',
        templateIsFavorite: false
      },
      id: '1725897351',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [],
      loyaltyBonus: [],
      cashbackAmount:
      {
        currency:
          {
            code: 840,
            name: 'USD',
            strCode: '840'
          },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перевод Расчетная карта. ТПС 3.0 RUB',
      cashback: 0,
      brand:
      {
        name: 'Перевод между своими счетами',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount:
      {
        currency:
          {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
        value: 2050
      },
      operationTime:
      {
        milliseconds: 1563813153000
      },
      subcategory: 'Перевод Расчетная карта. ТПС 3.0 RUB',
      spendingCategory:
      {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category:
      {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'cardUSD',
      ucid: '1035858969',
      card: '36340389',
      loyaltyPayment: [],
      group: 'INTERNAL',
      mccString: '0001',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '553691******1234',
      accountAmount:
      {
        currency:
          {
            code: 840,
            name: 'USD',
            strCode: '840'
          },
        value: 33.33
      }
    },
    {
      'comment': null,
      'date': new Date('2019-07-22T16:32:33+00:00'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_id': '1725897351',
          'account':
            {
              'id': 'cardUSD'
            },
          'fee': 0,
          'id': 'p746768370',
          'invoice':
            {
              'instrument': 'RUB',
              'sum': -2050
            },
          'sum': -33.33
        }
      ]
    }
  ],

  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment:
      {
        sourceIsQr: false,
        bankAccountId: 'cardUSD',
        paymentId: '746768370',
        paymentType: 'Transfer',
        feeAmount:
          {
            currency:
              {
                code: 840,
                name: 'USD',
                strCode: '840'
              },
            value: 0
          },
        providerId: 'transfer-inner',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues:
          {
            bankContract: 'cardRUB'
          },
        cardNumber: '553691******1234',
        templateId: '57805526',
        templateIsFavorite: false
      },
      id: '5179635788',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup:
      {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount:
      {
        currency:
          {
            code: 840,
            name: 'USD',
            strCode: '840'
          },
        value: 0
      },
      description: 'Перевод Расчетная карта. ТПС 3.0 RUB',
      debitingTime:
      {
        milliseconds: 1563742800000
      },
      cashback: 0,
      brand:
      {
        name: 'Перевод между своими счетами',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount:
      {
        currency:
          {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
        value: 2050
      },
      operationTime:
      {
        milliseconds: 1563813152000
      },
      subcategory: 'Перевод Расчетная карта. ТПС 3.0 RUB',
      spendingCategory:
      {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category:
      {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'cardUSD',
      ucid: '1035858969',
      merchant:
      {
        name: 'Перевод между своими счетами'
      },
      card: '36340389',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******1234',
      accountAmount:
      {
        currency:
          {
            code: 840,
            name: 'USD',
            strCode: '840'
          },
        value: 33.33
      }
    },
    {
      'comment': null,
      'date': new Date('2019-07-22T16:32:32+00:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '5179635788',
          'account':
            {
              'id': 'cardUSD'
            },
          'fee': 0,
          'id': 'p746768370',
          'invoice':
            {
              'instrument': 'RUB',
              'sum': -2050
            },
          'sum': -33.33
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
          'date': new Date('2019-07-22T16:32:33+00:00'),
          'hold': true,
          'merchant': null,
          'movements': [
            {
              'account':
                {
                  'id': 'cardRUB'
                },
              'fee': 0,
              'id': 'p746768370',
              'invoice': null,
              'sum': 2050
            },
            {
              'account':
                {
                  'id': 'cardUSD'
                },
              'fee': 0,
              'id': 'p746768370',
              'invoice':
                {
                  'instrument': 'RUB',
                  'sum': -2050
                },
              'sum': -33.33
            }
          ]
        }
      ]
    )
  })
})
