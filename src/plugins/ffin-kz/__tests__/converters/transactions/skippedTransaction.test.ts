import { convertPdfStatementTransaction } from '../../../converters/transactions'

describe('convertTransaction', () => {
  it.each([
    [
      {
        hold: false,
        date: '2025-05-09T00:00:00.000',
        originalAmount: '-0.00 KZT',
        amount: '-0.00',
        description: 'Другое',
        statementUid: 'a70f4256-c0c3-4c20-8c81-6216a9055eaa',
        originString: '09.05.2025 -0.00 ₸ KZT Другое'
      },
      {
        id: 'KZ00000Z000000003',
        instrument: 'KZT'
      },
      null
    ]
  ])('skips specific transactions', (rawTransaction, account, transaction) => {
    const currencyRates = {}
    expect(convertPdfStatementTransaction(rawTransaction, account, currencyRates)).toEqual(transaction)
  })
})
