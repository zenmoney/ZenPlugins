import { convertAccount } from '../converters'
import { AccountType } from '../../../types/zenmoney'

describe('convertAccount', () => {
  it.each([
    [
      {
        id: 12345,
        currency: 'EUR',
        totalValue: 1000.50,
        cash: {
          availableToTrade: 100.00,
          reservedForOrders: 0,
          inPies: 50.00
        },
        investments: {
          currentValue: 800.50,
          totalCost: 900.00,
          realizedProfitLoss: 0,
          unrealizedProfitLoss: 100.50
        }
      },
      {
        account: {
          id: '12345',
          type: AccountType.investment,
          title: 'Trading212',
          instrument: 'EUR',
          balance: 900.50,
          syncIds: ['12345']
        },
        card: {
          id: '12345-card',
          type: AccountType.ccard,
          title: 'Trading212 Card',
          instrument: 'EUR',
          balance: 100.00,
          syncIds: ['12345-card']
        }
      }
    ],
    [
      {
        id: 99999,
        currency: 'USD',
        totalValue: 5000.00,
        cash: {
          availableToTrade: 2000.00,
          reservedForOrders: 500.00,
          inPies: 100.00
        },
        investments: {
          currentValue: 2500.00,
          totalCost: 2000.00,
          realizedProfitLoss: 100.00,
          unrealizedProfitLoss: 500.00
        }
      },
      {
        account: {
          id: '99999',
          type: AccountType.investment,
          title: 'Trading212',
          instrument: 'USD',
          balance: 4500.00,
          syncIds: ['99999']
        },
        card: {
          id: '99999-card',
          type: AccountType.ccard,
          title: 'Trading212 Card',
          instrument: 'USD',
          balance: 500.00,
          syncIds: ['99999-card']
        }
      }
    ]
  ])('converts account summary to investment account and card', (accountSummary, expected) => {
    expect(convertAccount(accountSummary as any)).toEqual(expected)
  })
})
