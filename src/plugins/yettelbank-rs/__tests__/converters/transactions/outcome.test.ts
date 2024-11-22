import { convertTransaction } from '../../../converters'
import { Account } from '../../../../../types/zenmoney'
import { mockedTransactionsResponse, mockedAccountsResponse } from '../../../mocked_responses'

describe('convertTransaction', () => {
  it.each([
    [
      mockedTransactionsResponse[0],
      {
        id: mockedAccountsResponse[0].id,
        title: mockedAccountsResponse[0].name,
        type: 'ccard',
        instrument: mockedAccountsResponse[0].currency,
        syncIds: [
          mockedAccountsResponse[0].id
        ],
        balance: mockedAccountsResponse[0].balance,
        creditLimit: 0
      },
      {
        hold: mockedTransactionsResponse[0].isPending,
        date: mockedTransactionsResponse[0].date,
        movements: [
          {
            id: null,
            account: { id: mockedAccountsResponse[0].id },
            invoice: null,
            sum: mockedTransactionsResponse[0].amount,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: mockedTransactionsResponse[0].title,
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      mockedTransactionsResponse[1],
      {
        id: mockedAccountsResponse[0].id,
        title: mockedAccountsResponse[0].name,
        type: 'ccard',
        instrument: mockedAccountsResponse[0].currency,
        syncIds: [
          mockedAccountsResponse[0].id
        ],
        balance: mockedAccountsResponse[0].balance,
        creditLimit: 0
      },
      {
        hold: mockedTransactionsResponse[1].isPending,
        date: mockedTransactionsResponse[1].date,
        movements: [
          {
            id: null,
            account: { id: mockedAccountsResponse[0].id },
            invoice: null,
            sum: mockedTransactionsResponse[1].amount,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: mockedTransactionsResponse[1].title,
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account as Account)).toEqual(transaction)
  })
})
