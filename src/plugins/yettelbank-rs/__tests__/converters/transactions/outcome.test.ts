import { convertTransaction } from '../../../converters'
import { Transaction } from '../../../../../types/zenmoney'
import { mockedTransactionsResponse, mockedAccountsResponse } from '../../../mocked_responses'
import { AccountInfo, TransactionInfo } from '../../../models'

describe('convertTransaction', () => {
  // Test each transaction from mockedTransactionsResponse
  it.each(mockedTransactionsResponse.map((transaction, index) => [
    transaction,
    mockedAccountsResponse[0],
    {
      hold: transaction.isPending,
      date: transaction.date,
      movements: [
        {
          id: null,
          account: { id: mockedAccountsResponse[0].id },
          invoice: null,
          sum: transaction.amount,
          fee: 0
        }
      ],
      merchant: {
        fullTitle: transaction.title,
        mcc: null,
        location: null
      },
      comment: null
    }
  ]))('converts transaction %#', (apiTransaction, account, expectedTransaction) => {
    const result = convertTransaction(
      apiTransaction as unknown as TransactionInfo,
      account as unknown as AccountInfo
    )
    expect(result).toEqual(expectedTransaction)
  })

  it('should convert regular transaction', () => {
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
        fullTitle: 'Payment',
        mcc: null,
        location: null
      },
      comment: null
    }

    expect(transaction).toEqual(expectedTransaction)
  })

  it('should convert pending transaction', () => {
    const transaction = convertTransaction(mockedTransactionsResponse[1], mockedAccountsResponse[0])

    const expectedTransaction: Transaction = {
      hold: true,
      date: new Date('2023-01-02'),
      movements: [
        {
          id: null,
          account: {
            id: mockedAccountsResponse[0].id
          },
          invoice: null,
          sum: -50,
          fee: 0
        }
      ],
      merchant: {
        fullTitle: 'Pending Payment',
        mcc: null,
        location: null
      },
      comment: null
    }

    expect(transaction).toEqual(expectedTransaction)
  })

  it('should convert deposit transaction', () => {
    const transaction = convertTransaction(mockedTransactionsResponse[2], mockedAccountsResponse[0])

    const expectedTransaction: Transaction = {
      hold: false,
      date: new Date('2023-01-03'),
      movements: [
        {
          id: null,
          account: {
            id: mockedAccountsResponse[0].id
          },
          invoice: null,
          sum: 200,
          fee: 0
        }
      ],
      merchant: {
        fullTitle: 'Deposit',
        mcc: null,
        location: null
      },
      comment: null
    }

    expect(transaction).toEqual(expectedTransaction)
  })
})
