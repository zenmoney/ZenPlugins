import { convertTransaction } from '../../../converters'
import { Transaction } from '../../../../../types/zenmoney'
import { mockedTransactionsResponse, mockedAccountsResponse } from '../../../mocked_responses'
import { AccountInfo } from '../../../models'

describe('convertTransaction', () => {
  it.each([
    [
      mockedTransactionsResponse[0],
      {
        id: mockedAccountsResponse[0].id,
        title: mockedAccountsResponse[0].title,
        type: 'ccard',
        instrument: mockedAccountsResponse[0].instrument,
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
      mockedTransactionsResponse[0],
      {
        id: mockedAccountsResponse[0].id,
        title: mockedAccountsResponse[0].title,
        type: 'ccard',
        instrument: mockedAccountsResponse[0].instrument,
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
    ]
  ])('converts outcome', (apiTransaction, account, transaction) => {
    // Convert the account to AccountInfo type for the test
    const accountInfo: AccountInfo = {
      id: account.id,
      title: account.title,
      instrument: account.instrument,
      syncIds: account.syncIds,
      balance: account.balance
    }
    expect(convertTransaction(apiTransaction, accountInfo)).toEqual(transaction)
  })

  it('should convert transaction', () => {
    const transaction = convertTransaction(mockedTransactionsResponse[0], mockedAccountsResponse[0])

    const expectedTransaction: Transaction = {
      hold: false,
      date: new Date('2023-01-01'),
      movements: [
        {
          id: null,
          account: {
            id: mockedAccountsResponse[0].id
          },
          invoice: null,
          sum: 100,
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

    expect(transaction).toEqual(expectedTransaction)
  })

  it('should convert pending transaction', () => {
    const pendingTransaction = {
      ...mockedTransactionsResponse[0],
      isPending: true
    }

    const transaction = convertTransaction(pendingTransaction, mockedAccountsResponse[0])

    const expectedTransaction: Transaction = {
      hold: true,
      date: new Date('2023-01-01'),
      movements: [
        {
          id: null,
          account: {
            id: mockedAccountsResponse[0].id
          },
          invoice: null,
          sum: 100,
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

    expect(transaction).toEqual(expectedTransaction)
  })
})
