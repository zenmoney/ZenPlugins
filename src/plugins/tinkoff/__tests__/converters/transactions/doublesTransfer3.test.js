/*
* Обработка валютных переводов
* Банк сначала конвертирует валюту в рубли и только потом переводит их получателю
* В приложении банка это выглядит как три операции: расход, пополнение, перевод
*/

import { convertTransaction, convertTransactions } from '../../../converters'

const accounts = {
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
    syncID: ['4567'],
    instrument: 'EUR'
  }
}

// Обмен валюты
// Ошибка обработки не известной пары операций #p679012382
const transactions = [
  [
    // поступление на рублёвый счёт
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankaccountRUB: 'accountEUR',
        paymentId: '679012382',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 978,
            name: 'EUR',
            strCode: '978'
          },
          value: 0
        },
        providerId: 'transfer-inner-third-party-currency',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankCard: '553691******7679'
        },
        cardNumber: '521324******1737',
        templateId: '110547682',
        templateIsFavorite: false
      },
      id: '4766888757',
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
      description: 'Иван И.',
      debitingTime: {
        milliseconds: 1558818000000
      },
      cashback: 0,
      amount: {
        currency: {
          code: 978,
          name: 'EUR',
          strCode: '978'
        },
        value: 900
      },
      operationTime: {
        milliseconds: 1558890129000
      },
      subcategory: 'Иван И.',
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
      account: 'accountRUB',
      ucid: '1022897218',
      merchant: {
        name: 'Внутрибанковский перевод 3-м лицам'
      },
      card: '23421765',
      loyaltyPayment: [],
      group: 'INCOME',
      mccString: '0000',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******1737',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 64653.21
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-26T20:02:09+03:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '4766888757',
          'account': {
            'id': 'accountRUB'
          },
          'fee': 0,
          'id': 'p679012382',
          'invoice': {
            'instrument': 'EUR',
            'sum': 900
          },
          'sum': 64653.21
        }
      ]
    }
  ],

  // расход со счёта RUB
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankaccountRUB: 'accountEUR',
        paymentId: '679012382',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 978,
            name: 'EUR',
            strCode: '978'
          },
          value: 0
        },
        providerId: 'transfer-inner-third-party-currency',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankCard: '553691******7679'
        },
        cardNumber: '521324******1737',
        templateId: '110547682',
        templateIsFavorite: false
      },
      id: '4766888759',
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
      description: 'Иван И.',
      debitingTime: {
        milliseconds: 1558818000000
      },
      cashback: 0,
      brand: {
        name: 'Внутрибанковский перевод 3-м лицам',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/brands/transfer-inner-third-party.png',
        id: '7455',
        roundedLogo: false,
        baseColor: 'FFDD2D',
        logoFile: 'transfer-inner-third-party.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 64653.21
      },
      operationTime: {
        milliseconds: 1558890129000
      },
      subcategory: 'Иван И.',
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
      account: 'accountRUB',
      ucid: '1022897218',
      merchant: {
        name: 'Внутрибанковский перевод 3-м лицам'
      },
      card: '23421765',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******1737',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 64653.21
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-26T20:02:09+03:00'),
      'hold': false,
      'merchant': {
        'city': null,
        'country': null,
        'location': null,
        'mcc': null,
        'title': 'Иван И.'
      },
      'movements': [
        {
          '_cardPresent': true,
          '_id': '4766888759',
          'account': {
            'id': 'accountRUB'
          },
          'fee': 0,
          'id': 'p679012382',
          'invoice': null,
          'sum': -64653.21
        }
      ]
    }
  ],

  // расход со счёта EUR
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankaccountRUB: 'accountEUR',
        paymentId: '679012382',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 978,
            name: 'EUR',
            strCode: '978'
          },
          value: 0
        },
        providerId: 'transfer-inner-third-party-currency',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankCard: '553691******7679'
        },
        cardNumber: '521324******1737',
        templateId: '110547682',
        templateIsFavorite: false
      },
      id: '4766888755',
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
          code: 978,
          name: 'EUR',
          strCode: '978'
        },
        value: 0
      },
      description: 'Иван И.',
      debitingTime: {
        milliseconds: 1558818000000
      },
      rubAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 65086.74
      },
      cashback: 0,
      brand: {
        name: 'Внутрибанковский перевод 3-м лицам',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/brands/transfer-inner-third-party.png',
        id: '7455',
        roundedLogo: false,
        baseColor: 'FFDD2D',
        logoFile: 'transfer-inner-third-party.png'
      },
      amount: {
        currency: {
          code: 978,
          name: 'EUR',
          strCode: '978'
        },
        value: 900
      },
      operationTime: {
        milliseconds: 1558890129000
      },
      subcategory: 'Иван И.',
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
      account: 'accountEUR',
      ucid: '1022897218',
      merchant: {
        name: 'Внутрибанковский перевод 3-м лицам'
      },
      card: '23421765',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******1737',
      accountAmount: {
        currency: {
          code: 978,
          name: 'EUR',
          strCode: '978'
        },
        value: 900
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-26T17:02:09.000Z'),
      'hold': false,
      'merchant':
        {
          'city': null,
          'country': null,
          'location': null,
          'mcc': null,
          'title': 'Иван И.'
        },
      'movements': [
        {
          '_cardPresent': true,
          '_id': '4766888755',
          'account':
            {
              'id': 'accountEUR'
            },
          'fee': 0,
          'id': 'p679012382',
          'invoice': null,
          'sum': -900
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
          'date': new Date('2019-05-26T17:02:09.000Z'),
          'hold': false,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': 'accountRUB'
              },
              'fee': 0,
              'id': 'p679012382_4766888757',
              'invoice': {
                'instrument': 'EUR',
                'sum': 900
              },
              'sum': 64653.21
            },
            {
              'account': {
                'id': 'accountEUR'
              },
              'fee': 0,
              'id': 'p679012382_4766888755',
              'invoice': null,
              'sum': -900
            }
          ]
        },
        {
          'comment': null,
          'date': new Date('2019-05-26T17:02:09.000Z'),
          'hold': false,
          'merchant': {
            'city': null,
            'country': null,
            'location': null,
            'mcc': null,
            'title': 'Иван И.'
          },
          'movements': [
            {
              'account':
                {
                  'id': 'accountRUB'
                },
              'fee': 0,
              'id': 'p679012382_4766888759',
              'invoice': null,
              'sum': -64653.21
            }
          ]
        }
      ]
    )
  })
})
