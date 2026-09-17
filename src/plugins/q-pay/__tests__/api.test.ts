const mockLogin = jest.fn()
const mockFetchCurrentUser = jest.fn()
const mockFetchCards = jest.fn()
const mockFetchCardBalance = jest.fn()
const mockFetchWalletTransactions = jest.fn()
const mockFetchCardTransactions = jest.fn()

jest.mock('../fetchApi', () => {
  const actual = jest.requireActual('../fetchApi')
  return {
    ...actual,
    login: mockLogin,
    fetchCurrentUser: mockFetchCurrentUser,
    fetchCards: mockFetchCards,
    fetchCardBalance: mockFetchCardBalance,
    fetchWalletTransactions: mockFetchWalletTransactions,
    fetchCardTransactions: mockFetchCardTransactions
  }
})

describe('Q-Pay scrape orchestration', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrapeQPay } = require('../api') as typeof import('../api')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SessionExpiredError } = require('../fetchApi') as typeof import('../fetchApi')
  const fromDate = new Date('2026-01-01T00:00:00Z')
  const toDate = new Date('2026-12-31T23:59:59Z')

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchCurrentUser.mockResolvedValue({
      wallets: [{ address: '0x-example', network: 'evm:1', balances: [{ asset: 'USDT', value: '10' }] }]
    })
    mockFetchCards.mockResolvedValue([
      { id: 'open-card', status: 'ACTIVE', is_revoked: false },
      { id: 'closed-card', status: 'CLOSED', is_revoked: false },
      { id: 'revoked-card', status: 'ACTIVE', is_revoked: true }
    ])
    mockFetchCardBalance.mockResolvedValue({ available_balance: '20', card_currency: 'USD' })
    mockFetchWalletTransactions.mockResolvedValue([])
    mockFetchCardTransactions.mockResolvedValue([])
  })

  it('reuses a valid stored session and fetches balances and history only for open cards', async () => {
    const stored = { email: 'user@example.com', accessToken: 'stored-token' }
    const result = await scrapeQPay({ email: 'USER@example.com', password: 'password' }, stored, fromDate, toDate)

    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockFetchCardBalance).toHaveBeenCalledTimes(1)
    expect(mockFetchCardBalance).toHaveBeenCalledWith(stored, 'open-card')
    expect(mockFetchWalletTransactions).toHaveBeenCalledWith(stored, fromDate, toDate)
    expect(mockFetchCardTransactions).toHaveBeenCalledTimes(1)
    expect(mockFetchCardTransactions).toHaveBeenCalledWith(stored, 'open-card', fromDate, toDate)
    expect(result.accounts.map(account => account.id)).toEqual([
      'q-pay:wallet:evm:1:0x-example:USDT',
      'q-pay:card:open-card'
    ])
    expect(result.transactions).toEqual([])
  })

  it('logs in once more when the stored bearer session expired', async () => {
    const stored = { email: 'user@example.com', accessToken: 'expired-token' }
    const fresh = { email: 'user@example.com', accessToken: 'fresh-token' }
    mockFetchCurrentUser
      .mockRejectedValueOnce(new SessionExpiredError())
      .mockResolvedValueOnce({ wallets: [] })
    mockLogin.mockResolvedValue(fresh)

    const result = await scrapeQPay({ email: 'user@example.com', password: 'password' }, stored, fromDate, toDate)

    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(mockFetchCurrentUser).toHaveBeenLastCalledWith(fresh)
    expect(result.session).toBe(fresh)
  })

  it('does not reuse a session belonging to another login', async () => {
    const fresh = { email: 'new@example.com', accessToken: 'fresh-token' }
    mockLogin.mockResolvedValue(fresh)
    mockFetchCards.mockResolvedValue([])

    await scrapeQPay(
      { email: 'new@example.com', password: 'password' },
      { email: 'old@example.com', accessToken: 'old-token' },
      fromDate,
      toDate
    )

    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(mockFetchCurrentUser).toHaveBeenCalledWith(fresh)
  })
})
