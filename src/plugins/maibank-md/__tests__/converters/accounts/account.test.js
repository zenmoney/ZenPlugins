import { convertAccounts } from '../../../converters.js'

describe('convertAccount', () => {
  it.each([
    [
      {
        cards: [],
        accounts: [{
          synt: '2252',
          account: '22524048820',
          iban: 'MD60AG000000022524048820',
          currency: 'MDL',
          amount: 4446.67,
          isActive: true,
          visibility: { visibleForOperations: true, visibleStatement: true },
          bic: 'AGRNMD2X723'
        }],
        creditAccounts: [],
        depositAccounts: [],
        cardCreditAccounts: []
      },
      {
        accounts:
        [
          {
            id: '22524048820',
            type: 'checking',
            title: '*8820',
            instrument: 'MDL',
            syncID: [
              'MD60AG000000022524048820'
            ],
            balance: 4446.67
          }
        ],
        cardsByLastFourDigits: { }
      }
    ],
    [
      {
        cards: [],
        accounts: [{
          synt: '2252',
          account: '22524048820',
          iban: 'MD60AG000000022524048820',
          currency: 'MDL',
          isActive: true,
          visibility: { visibleForOperations: true, visibleStatement: true },
          bic: 'AGRNMD2X723'
        }],
        creditAccounts: [],
        depositAccounts: [],
        cardCreditAccounts: []
      },
      {
        accounts:
        [
          {
            id: '22524048820',
            type: 'checking',
            title: '*8820',
            instrument: 'MDL',
            syncID: [
              'MD60AG000000022524048820'
            ],
            balance: null
          }
        ],
        cardsByLastFourDigits: { }
      }
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
