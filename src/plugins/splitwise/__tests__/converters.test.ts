import { convertAccounts, convertTransaction } from '../converters'
import { SplitwiseExpense } from '../models'
import { AccountType } from '../../../types/zenmoney'

describe('convertAccounts', () => {
  it('should create accounts for all currencies with owed money', () => {
    const expenses: SplitwiseExpense[] = [
      {
        id: 1,
        description: 'Lunch',
        details: '',
        payment: false,
        cost: '100.00',
        date: '2024-01-08',
        created_at: '2024-01-08T15:08:03Z',
        updated_at: '2024-01-08T15:08:03Z',
        currency_code: 'USD',
        users: [
          { user_id: 1, paid_share: '0', owed_share: '50.00' },
          { user_id: 2, paid_share: '100.00', owed_share: '50.00' }
        ]
      },
      {
        id: 2,
        description: 'Coffee',
        details: '',
        payment: false,
        cost: '10.00',
        date: '2024-01-08',
        created_at: '2024-01-08T15:08:03Z',
        updated_at: '2024-01-08T15:08:03Z',
        currency_code: 'EUR',
        users: [
          { user_id: 1, paid_share: '10.00', owed_share: '0' },
          { user_id: 2, paid_share: '0', owed_share: '10.00' }
        ]
      }
    ]

    const accounts = convertAccounts(expenses)
    expect(accounts).toHaveLength(2)
    expect(accounts).toEqual([
      {
        id: 'USD',
        type: AccountType.checking,
        title: 'Splitwise USD',
        instrument: 'USD',
        balance: -100,
        syncIds: ['SWUSD0']
      },
      {
        id: 'EUR',
        type: AccountType.checking,
        title: 'Splitwise EUR',
        instrument: 'EUR',
        balance: -10,
        syncIds: ['SWEUR0']
      }
    ])
  })

  it('should skip deleted expenses when creating accounts', () => {
    const expenses: SplitwiseExpense[] = [
      {
        id: 1,
        description: 'Lunch',
        details: '',
        payment: false,
        cost: '100.00',
        date: '2024-01-08',
        created_at: '2024-01-08T15:08:03Z',
        updated_at: '2024-01-08T15:08:03Z',
        deleted_at: '2024-01-09T10:00:00Z',
        currency_code: 'USD',
        users: [
          { user_id: 1, paid_share: '0', owed_share: '50.00' },
          { user_id: 2, paid_share: '100.00', owed_share: '50.00' }
        ]
      }
    ]

    const accounts = convertAccounts(expenses.filter(e => e.deleted_at == null))
    expect(accounts).toHaveLength(0)
  })
})

describe('convertTransaction', () => {
  it('should convert expense to transaction when user owes money', () => {
    const expense: SplitwiseExpense = {
      id: 1,
      description: 'Lunch',
      details: '',
      payment: false,
      cost: '100.00',
      date: '2024-01-08',
      created_at: '2024-01-08T15:08:03Z',
      updated_at: '2024-01-08T15:08:03Z',
      currency_code: 'USD',
      users: [
        { user_id: 1, paid_share: '0', owed_share: '50.00' },
        { user_id: 2, paid_share: '100.00', owed_share: '50.00' }
      ]
    }

    const transaction = convertTransaction(expense, 1)
    expect(transaction).toEqual({
      hold: false,
      date: new Date('2024-01-08'),
      movements: [{
        id: '1',
        account: { id: 'USD' },
        sum: -50,
        fee: 0,
        invoice: null
      }],
      merchant: {
        fullTitle: 'Lunch',
        mcc: null,
        location: null
      },
      comment: 'Lunch'
    })
  })

  it('should return null for deleted expenses', () => {
    const expense: SplitwiseExpense = {
      id: 1,
      description: 'Lunch',
      details: '',
      payment: false,
      cost: '100.00',
      date: '2024-01-08',
      created_at: '2024-01-08T15:08:03Z',
      updated_at: '2024-01-08T15:08:03Z',
      deleted_at: '2024-01-09T10:00:00Z',
      currency_code: 'USD',
      users: [
        { user_id: 1, paid_share: '0', owed_share: '50.00' },
        { user_id: 2, paid_share: '100.00', owed_share: '50.00' }
      ]
    }

    const transaction = convertTransaction(expense, 1)
    expect(transaction).toBeNull()
  })
})
