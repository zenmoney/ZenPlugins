import { convertAccounts } from '../../../converters.js'

describe('convertAccount', () => {
  it.each([
    [
      {
        cards: [],
        accounts: [],
        creditAccounts: [{
          account: '14432021300511',
          amount: 506000,
          actualAmount: 497208.97,
          currency: 'MDL',
          overdueAmount: 4446.67,
          agreeDate: 1596672000000,
          endDate: 2226355200000,
          dueDate: 1597881600000,
          visibility: { visibleForOperations: true, visibleStatement: true },
          bic: 'AGRNMD2X723'
        }],
        depositAccounts: [],
        cardCreditAccounts: []
      },
      {
        accounts:
        [
          {
            id: '14432021300511',
            instrument: 'MDL',
            balance: -497208.97,
            startBalance: 506000,
            type: 'loan',
            title: '*0511',
            startDate: new Date(1596672000000),
            capitalization: true,
            percent: 0.01,
            endDateOffsetInterval: 'day',
            endDateOffset: 7288,
            payoffInterval: 'month',
            payoffStep: 1,
            syncID: [
              '14432021300511'
            ]
          }
        ],
        cardsByLastFourDigits: { }
      }
    ]
  ])('converts credit account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
