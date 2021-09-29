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
    ],
    [
      {
        accountType: '5',
        concreteType: '5',
        accountNumber: '0030008294',
        operationName: 'Капитализация по До востребования',
        transactionDate: 1630426620000,
        operationDate: 1630426620000,
        transactionAmount: 0,
        transactionCurrency: '933',
        operationAmount: 0,
        operationCurrency: '933',
        operationSign: '1',
        actionGroup: 19,
        clientName: 'Селявко Виктор Викторович',
        operationClosingBalance: 0,
        operationCode: 1001
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      false
    ]
  ])('converts intcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
