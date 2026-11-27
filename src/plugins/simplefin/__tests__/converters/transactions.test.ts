import { convertTransactions } from '../../converters'
import { SimpleFinAccount } from '../../models'

describe('convertTransactions', () => {
  it('converts posted and pending SimpleFIN transactions', () => {
    const account: SimpleFinAccount = {
      id: 'acc-1',
      name: 'Checking',
      connId: 'CON-1',
      currency: 'usd',
      balance: 10,
      transactions: [
        {
          id: 'tx-1',
          posted: 1717200000,
          amount: -12.34,
          description: 'Coffee Shop',
          extra: {
            category: 'food'
          }
        },
        {
          id: 'tx-2',
          posted: 0,
          transactedAt: 1717286400,
          amount: 100,
          description: 'Payroll',
          pending: true
        }
      ]
    }

    expect(convertTransactions(account)).toEqual([
      {
        hold: false,
        date: new Date('2024-06-01T00:00:00.000Z'),
        movements: [
          {
            id: 'CON-1:acc-1:tx-1',
            account: { id: 'CON-1:acc-1' },
            invoice: null,
            sum: -12.34,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Coffee Shop',
          mcc: null,
          location: null,
          category: 'food'
        },
        comment: null
      },
      {
        hold: true,
        date: new Date('2024-06-02T00:00:00.000Z'),
        movements: [
          {
            id: 'CON-1:acc-1:tx-2',
            account: { id: 'CON-1:acc-1' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Payroll',
          mcc: null,
          location: null
        },
        comment: null
      }
    ])
  })
})
