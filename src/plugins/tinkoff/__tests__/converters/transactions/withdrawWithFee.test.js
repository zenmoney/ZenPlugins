/*
* Обработка ошибки дублирования холд-операций на ВСЕХ счетах в выписке
*/

import { convertTransaction, convertTransactions } from '../../../converters'

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
      id: '1394059428',
      offers: [],
      status: 'OK',
      idSourceType: 'OperationFee',
      type: 'Debit',
      locations: [
        {
          latitude: 55.7512419,
          longitude: 37.6184217
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
      description: 'Комиссия: снятие наличных VB24 UNKNOWN MOSKVA G RUS',
      cashback: 0,
      brand: {
        name: 'Комиссии',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 90
      },
      operationTime: {
        milliseconds: 1559061247000
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
      ucid: '1042578294',
      merchant: {
        name: 'VB24 UNKNOWN',
        region: {
          country: 'RUS',
          city: 'MOSKVA G'
        }
      },
      card: '43046464',
      loyaltyPayment: [],
      mccString: '0000',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******1237',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 90
      }
    },
    {
      'comment': 'Комиссия: снятие наличных VB24 UNKNOWN MOSKVA G RUS',
      'date': new Date('2019-05-28T16:34:07.000Z'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '1394059428',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '1394059428',
          'invoice': null,
          'sum': -90
        }
      ]
    }
  ],
  [
    {
      isDispute: true,
      hasStatement: false,
      isSuspicious: false,
      id: '1394059428',
      offers: [],
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [
        {
          latitude: 55.7512419,
          longitude: 37.6184217
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
      description: 'VB24 UNKNOWN',
      cashback: 0,
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1000
      },
      operationTime: {
        milliseconds: 1559061247000
      },
      spendingCategory: {
        id: '52',
        name: 'Наличные',
        icon: '21',
        parentId: '8'
      },
      isHce: false,
      mcc: 6011,
      category: {
        id: '21',
        name: 'Наличные'
      },
      additionalInfo: [
        {
          fieldName: 'Номер банкомата',
          fieldValue: '399877'
        }
      ],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1042578294',
      merchant: {
        name: 'VB24 UNKNOWN',
        region: {
          country: 'RUS',
          city: 'MOSKVA G'
        }
      },
      card: '43046464',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6011',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******1237',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-28T16:34:07.000Z'),
      'hold': true,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          '_id': '1394059428',
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '1394059428',
          'invoice': null,
          'sum': -1000
        },
        {
          'account':
            {
              'company': null,
              'instrument': 'RUB',
              'syncIds': null,
              'type': 'cash'
            },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 1000
        }
      ]
    }
  ]
]

// ошибочные холды (из-за проблем с дублями в выписке банка)
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
  it('should convert transaction #' + i, () => {
    expect(
      convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
    ).toEqual(
      transactions[i][1]
    )
  })
})

describe('convertTransactions', () => {
  it('should return one valid transaction without fake doubles', () => {
    expect(
      convertTransactions(apiTransactions, accounts)
    ).toEqual(
      [
        {
          'comment': 'Комиссия: снятие наличных VB24 UNKNOWN MOSKVA G RUS',
          'date': new Date('2019-05-28T16:34:07.000Z'),
          'hold': true,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': 'accountId'
              },
              'fee': 0,
              'id': '1394059428_0',
              'invoice': null,
              'sum': -90
            }
          ]
        },
        {
          'comment': null,
          'date': new Date('2019-05-28T16:34:07.000Z'),
          'hold': true,
          'merchant': null,
          'movements': [
            {
              'account': {
                'id': 'accountId'
              },
              'fee': 0,
              'id': '1394059428_1',
              'invoice': null,
              'sum': -1000
            },
            {
              'account': {
                'company': null,
                'instrument': 'RUB',
                'syncIds': null,
                'type': 'cash'
              },
              'fee': 0,
              'id': null,
              'invoice': null,
              'sum': 1000
            }
          ]
        }
      ]
    )
  })
})
