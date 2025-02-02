import { convertAccounts } from '../../../converters.js'

describe('convertAccount', () => {
  it.each([
    [
      {
        cards: [],
        accounts: [],
        creditAccounts: [],
        depositAccounts: [{
          account: '23113599099',
          dateStart: 1549324800000,
          dateEnd: 1613260800000,
          amount: 25135.64,
          currency: 'MDL',
          minimalAmount: 1000,
          permitAdd: true,
          isActive: true,
          visibility: { visibleForOperations: true, visibleStatement: true },
          iban: 'MD55AG000000023113599099',
          bic: 'AGRNMD2X864'
        }],
        cardCreditAccounts: []
      },
      {
        accounts:
        [
          {
            id: '23113599099',
            type: 'deposit',
            title: '*9099',
            instrument: 'MDL',
            syncID: [
              'MD55AG000000023113599099'
            ],
            balance: 25135.64,
            startBalance: 1000,
            startDate: new Date(1549324800000),
            percent: 0.01,
            capitalization: true,
            endDateOffsetInterval: 'day',
            endDateOffset: 740,
            payoffInterval: 'month',
            payoffStep: 1
          }
        ],
        cardsByLastFourDigits: { }
      }
    ]
  ])('converts deposit', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
