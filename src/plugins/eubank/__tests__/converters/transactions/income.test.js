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
          id: 'MOVEMENT_9032932014',
          type: 'MOVEMENT',
          executionDate: 1588528800000,
          status: 'DONE',
          transactionDate: 1588399266000,
          dateCreated: 1588399266000,
          amount: 930.43,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: 930.43,
          totalAmountCurrency: 'KZT',
          purpose: 'Трата Бонусов   '
        }
      ],
      [
        {
          hold: false,
          date: new Date(1588399266000),
          movements: [
            {
              id: 'MOVEMENT_9032932014',
              account: { id: 'account' },
              invoice: null,
              sum: 930.43,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Трата Бонусов'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_3797748924',
          type: 'MOVEMENT',
          executionDate: 1588199940000,
          status: 'DONE',
          transactionDate: 1588199940000,
          dateCreated: 1588199940000,
          amount: 36.01,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ16948KZT126070014G',
          totalAmount: 36.01,
          totalAmountCurrency: 'KZT',
          purpose: 'Проценты, начисленные на 30.04.2020'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1588199940000),
          movements: [
            {
              id: 'MOVEMENT_3797748924',
              account: { id: 'account' },
              invoice: null,
              sum: 36.01,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Проценты, начисленные на 30.04.2020'
        }
      ]
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
})
