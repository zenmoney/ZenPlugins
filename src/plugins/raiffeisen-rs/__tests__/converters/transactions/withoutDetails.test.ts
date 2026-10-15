import { convertTransactions } from '../../../converters'
import { GetAccountTransactionsResponse } from '../../../models'

function makeTransaction (overrides: Partial<GetAccountTransactionsResponse>): GetAccountTransactionsResponse {
  return {
    CurrencyCode: 'RSD',
    TransactionID: '1',
    ProcessedDate: '2024-01-25T00:00:00',
    CurrencyCodeNumeric: 941,
    ChequeCardNumber: null,
    CreditAmount: 0,
    TransactionBeneficiary: 'Merchant',
    AccountNumber: '265057000005597777',
    DebitAmount: 100,
    Reference: '1',
    Description: 'Payment',
    Note: '',
    ValueDate: '2024-01-25T00:00:00',
    TransactionType: 'POS',
    ...overrides
  }
}

describe('transactions without details', () => {
  // The bank sometimes fails to return details of a transaction (Err_95136)
  it.each(['POS', 'ExchSell', 'ExchBuy', 'ATM'])('%s without details is converted', (TransactionType) => {
    const transactions = convertTransactions([makeTransaction({ TransactionType })])
    expect(transactions).toHaveLength(1)
    expect(transactions[0].date).toEqual(new Date('2024-01-25T00:00:00'))
    expect(transactions[0].movements[0]).toMatchObject({
      account: { id: '265057000005597777RSD' },
      invoice: null,
      sum: -100
    })
  })
})
