import { convertAccount } from '../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        id: 12345,
        currency: 'EUR',
        totalValue: 1000.50,
        cash: {
          availableToTrade: 0,
          reservedForOrders: 0,
          inPies: 0
        },
        investments: {
          currentValue: 1000.50,
          totalCost: 900.00,
          realizedProfitLoss: 0,
          unrealizedProfitLoss: 100.50
        }
      },
      {
        id: '12345',
        type: 'investment',
        title: 'Trading212',
        instrument: 'EUR',
        balance: 1000.50,
        syncIds: ['12345']
      }
    ]
  ])('converts account summary to investment account', (accountSummary, expected) => {
    expect(convertAccount(accountSummary)).toEqual(expected)
  })
})
