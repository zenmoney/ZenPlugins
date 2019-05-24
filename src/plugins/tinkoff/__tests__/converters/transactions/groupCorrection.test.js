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
      id: '4604770420',
      offers: [],
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Credit',
      subgroup: {
        id: 'E5',
        name: 'Бонусы'
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
      description: 'Проценты на остаток по счету',
      debitingTime: {
        milliseconds: 1556658000000
      },
      cashback: 0,
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 283.96
      },
      operationTime: {
        milliseconds: 1556658000000
      },
      spendingCategory: {
        id: '51',
        name: 'Другое',
        icon: '33',
        parentId: '8'
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
        name: 'Бонусы'
      },
      loyaltyPayment: [],
      group: 'CORRECTION',
      mccString: '0000',
      cardPresent: true,
      isExternalCard: false,
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 283.96
      }
    },
    {
      'comment': 'Проценты на остаток по счету',
      'date': new Date('2019-04-30T21:00:00.000Z'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '4604770420',
          'invoice': null,
          'sum': 283.96
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
