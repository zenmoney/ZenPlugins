import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'Капитализация (%% тек.периода ко вкладу)',
        transactionDate: 1627663080000,
        operationDate: 1627749480000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 0,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 19,
        clientName: 'Николаев Николай Николаевич',
        operationClosingBalance: 1.72,
        operationCode: 999
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      false
    ]
  ])('converts intcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
