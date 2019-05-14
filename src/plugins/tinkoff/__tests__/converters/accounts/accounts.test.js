import { convertAccount } from '../../../converters'

const accounts = [
  [
    {
      lastRenewalDate: {
        milliseconds: 1557705600000
      },
      lastReceiptDate: {
        milliseconds: 1571011200000
      },
      openDate: {
        milliseconds: 1542056400000
      },
      tariffFileHash: '8dd22e27-d0a2-4604-9430-21c5b47b6d21',
      creationDate: {
        milliseconds: 1542056400000
      },
      marketingName: 'Мультивалютный вклад ТПД 3.0',
      accountIconType: 'MULTI_DEPOSIT',
      accounts:
        [
          {
            externalAccountNumber: '42305810500010432352',
            effectiveRate: 6.59,
            depositRate: 6.5,
            currentLinkedAccount: '5102929949',
            totalExpense: {
              currency: {
                code: 643,
                name: 'RUB',
                strCode: '643'
              },
              value: 0
            },
            typeOfInterest: 'TO_DEPOSIT',
            totalIncome: {
              currency: {
                code: 643,
                name: 'RUB',
                strCode: '643'
              },
              value: 51760.91
            },
            interest: {
              currency: {
                code: 643,
                name: 'RUB',
                strCode: '643'
              },
              value: 1760.91
            },
            moneyAmount: {
              currency: {
                code: 643,
                name: 'RUB',
                strCode: '643'
              },
              value: 51760.91
            },
            currency: {
              code: 643,
              name: 'RUB',
              strCode: '643'
            },
            startAmount: {
              currency: {
                code: 643,
                name: 'RUB',
                strCode: '643'
              },
              value: 50000
            }
          }
        ],
      accountGroup: 'Вклады',
      loyalty: [],
      hidden: false,
      rateIsIncreasedAfterProlongation: true,
      rateIsIncreased: false,
      partNumber: 'TPDMC3.0',
      name: 'Мультивалютный вклад',
      period: 6,
      accountType: 'MultiDeposit',
      status: 'ACTIVE',
      dayBegForPart: {
        milliseconds: 1547240400000
      },
      plannedCloseDate: {
        milliseconds: 1573603200000
      },
      id: '3428475549'
    },
    [{
      'balance': 51760.91,
      'capitalization': true,
      'endDateOffset': 6,
      'endDateOffsetInterval': 'month',
      'id': '3428475549_RUB',
      'instrument': 'RUB',
      'payoffInterval': 'month',
      'payoffStep': 1,
      'percent': 6.5,
      startBalance: 0,
      'startDate': new Date('2018-11-13T00:00:00+03:00'),
      'syncID': ['5549_RUB'],
      'title': 'Мультивалютный вклад (RUB)',
      'type': 'deposit'
    }]
  ]
]

describe('convertAccount', () => {
  for (let i = 0; i < accounts.length; i++) {
    it('should convert account #' + i, () => {
      expect(
        convertAccount(accounts[i][0])
      ).toEqual(
        accounts[i][1]
      )
    })
  }
})

xdescribe('convertOneTransaction', () => {
  const i = 1
  it('should convert transaction ' + i, () => {
    expect(
      convertAccount(accounts[i][0])
    ).toEqual(
      accounts[i][1]
    )
  })
})
