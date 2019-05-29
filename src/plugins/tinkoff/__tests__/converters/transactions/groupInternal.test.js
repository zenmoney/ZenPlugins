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
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountId',
        paymentId: '666839507',
        paymentType: 'Transfer',
        feeAmount: {
          currency:
                {
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
      id: '1320513056',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency:
            {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перевод Расчетная карта. ТПС 8.0 RUB',
      cashback: 0,
      brand: {
        name: 'Перевод между своими счетами',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount: {
        currency:
            {
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
      account: 'accountId',
      ucid: '1012234196',
      card: '12783017',
      loyaltyPayment: [],
      group: 'INTERNAL',
      mccString: '0001',
      cardPresent: false,
      isExternalCard: false,
      cardNumber: '437773******3511',
      accountAmount: {
        currency:
            {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
        value: 30000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-15T17:33:55.000Z'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_id': '1320513056',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'p666839507',
          'invoice': null,
          'sum': -30000
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
