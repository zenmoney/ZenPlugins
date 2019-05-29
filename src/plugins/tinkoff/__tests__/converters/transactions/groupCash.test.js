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
  // снятие наличных
  [
    {
      isDispute: true,
      hasStatement: true,
      isSuspicious: false,
      id: '4680706787',
      offers: [],
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'B1',
        name: 'Снятия наличных'
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
      description: 'АК Барс',
      debitingTime: {
        milliseconds: 1557781200000
      },
      cashback: 0,
      brand: {
        name: 'АК Барс',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/akb.png',
        id: '11290',
        roundedLogo: false,
        baseColor: '009b3a',
        logoFile: 'akb.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 3000
      },
      operationTime: {
        milliseconds: 1557571065000
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
      additionalInfo: [{
        fieldName: 'Номер банкомата',
        fieldValue: '00000350'
      }],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1044978418',
      merchant: {
        name: 'ABB 1 NOVAYA',
        region: {
          country: 'RUS',
          city: 'NOVAYA TURA',
          address: 'NOVAYA , 1',
          zip: '422540'
        }
      },
      card: '45444052',
      loyaltyPayment: [],
      group: 'CASH',
      mccString: '6011',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******0344',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 3000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-11T13:37:45+03:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_id': '4680706787',
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': '4680706787',
          'invoice': null,
          'sum': -3000
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
          'sum': 3000
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
