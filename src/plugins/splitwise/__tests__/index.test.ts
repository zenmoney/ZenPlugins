import { scrape } from '../index'
import { fetchCurrentUser, fetchExpenses, fetchBalances } from '../fetchApi'
import { SplitwiseExpense, SplitwiseUser } from '../models'

jest.mock('../fetchApi')

describe('scrape', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should fetch and convert expenses', async () => {
    const mockUser: SplitwiseUser = {
      id: 1,
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      registration_status: 'confirmed',
      picture: {
        small: '',
        medium: '',
        large: ''
      },
      default_currency: 'USD',
      locale: 'en'
    }

    const mockExpenses: SplitwiseExpense[] = [{
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
    }]

    const mockBalances = {
      USD: -50
    }

    ;(fetchCurrentUser as jest.Mock).mockResolvedValue(mockUser)
    ;(fetchExpenses as jest.Mock).mockResolvedValue(mockExpenses)
    ;(fetchBalances as jest.Mock).mockResolvedValue(mockBalances)

    const result = await scrape({
      preferences: {
        token: 'test-token',
        startDate: '2024-01-01'
      },
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31'),
      isFirstRun: true,
      isInBackground: false
    })

    expect(result.accounts).toHaveLength(1)
    expect(result.transactions).toHaveLength(1)
    expect(fetchExpenses).toHaveBeenCalledTimes(1)
  })
})
