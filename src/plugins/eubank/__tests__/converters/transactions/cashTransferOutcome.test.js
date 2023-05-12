import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'KZT'
  }
  it.each([
    [
      [
        {
          id: 'MOVEMENT_6201226754',
          type: 'MOVEMENT',
          executionDate: 1585245600000,
          status: 'DONE',
          transactionDate: 1585290867000,
          dateCreated: 1585290867000,
          amount: -15000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -15000,
          totalAmountCurrency: 'KZT',
          purpose: 'ATM KAZ KOSTANAY MAGAZIN 29'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1585290867000),
          movements: [
            {
              id: 'MOVEMENT_6201226754',
              account: { id: 'account' },
              invoice: null,
              sum: -15000,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'cash',
                instrument: 'KZT',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: 15000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'ATM KAZ KOSTANAY MAGAZIN 29'
        }
      ]
    ]
  ])('converts cash transfer outcome', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
})
