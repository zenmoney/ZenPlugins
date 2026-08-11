import { convertTransaction, parseTransactionDate } from '../../../converters'

describe('convertTransaction: purchase', () => {
  it('uses account amount for sum and operation amount for a foreign-currency invoice', () => {
    const account = {
      id: '101',
      type: 'ccard',
      title: '*1111',
      instrument: 'UAH',
      syncIds: ['UA111'],
      balance: 1000
    }
    const apiTransaction = {
      account_id: 101,
      source_system_id: 'purchase-1',
      order_date: '11.08.2026T11:15:16.123Z',
      transaction_type: 'Transactions',
      description: 'Оплата товарів',
      transaction_amount: {
        value: -2500,
        currency_code: 'USD'
      },
      transaction_details: {
        transaction_date: '11.08.2026T14:15:16',
        account_amount: {
          value: -102750,
          currency_code: 'UAH'
        },
        commission_amount: {
          value: 150,
          currency_code: 'UAH'
        }
      },
      merchant_category_data: {
        code: null
      }
    }

    expect(convertTransaction(apiTransaction, account)).toEqual({
      hold: false,
      date: new Date('2026-08-11T11:15:16.123Z'),
      movements: [{
        id: 'purchase-1',
        account: { id: '101' },
        invoice: {
          sum: -25,
          instrument: 'USD'
        },
        sum: -1027.5,
        fee: -1.5
      }],
      merchant: null,
      comment: 'Оплата товарів'
    })
  })

  it('respects the explicit offset in GraphQL orderDate', () => {
    expect(parseTransactionDate({
      orderDate: '2026-01-10T10:15:16.123+02:00',
      transaction_details: {
        transaction_date: '10.01.2026T10:15:16'
      }
    })).toEqual(new Date('2026-01-10T08:15:16.123Z'))
  })

  it('parses a naive bank date without accessing Intl', () => {
    const intlDescriptor = Object.getOwnPropertyDescriptor(global, 'Intl')
    Object.defineProperty(global, 'Intl', {
      configurable: true,
      get: () => {
        throw new Error('Intl is unavailable')
      }
    })
    try {
      expect(parseTransactionDate({
        transaction_details: {
          transaction_date: '10.01.2026T10:15:16'
        }
      })).toEqual(new Date('2026-01-10T08:15:16.000Z'))
    } finally {
      Object.defineProperty(global, 'Intl', intlDescriptor)
    }
  })
})
