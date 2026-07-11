import { Auth } from '../../models'

const mockSeedCookies = jest.fn()
const mockCurrentAuth = jest.fn()
const mockFetchCards = jest.fn()
const mockFetchBalance = jest.fn()
const mockFetchTransactions = jest.fn()

jest.mock('../../fetchApi', () => ({
  ...jest.requireActual('../../fetchApi'),
  seedCookies: mockSeedCookies,
  currentAuth: mockCurrentAuth,
  fetchCards: mockFetchCards,
  fetchBalance: mockFetchBalance,
  fetchTransactions: mockFetchTransactions
}))

const auth: Auth = { accessToken: 'AT', refreshToken: 'RT' }
const preferences = { email: 'a@b.c' }
const fromDate = new Date('2026-01-01T00:00:00Z')

describe('scrapeJupiter — account skipping', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrapeJupiter } = require('../../api') as typeof import('../../api')

  beforeEach(() => {
    mockFetchCards.mockResolvedValue([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }])
    mockFetchBalance.mockResolvedValue({ currency: 'USD', spendableBalance: 10, withdrawableBalance: 10 })
    mockFetchTransactions.mockResolvedValue([])
    mockSeedCookies.mockResolvedValue(undefined)
    mockCurrentAuth.mockResolvedValue(auth)
    global.ZenMoney = { isAccountSkipped: jest.fn(() => false) } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  it('fetches transactions when the account is not skipped', async () => {
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.accounts).toHaveLength(1)
    expect(ZenMoney.isAccountSkipped).toHaveBeenCalledWith('acct_1')
    expect(mockFetchTransactions).toHaveBeenCalled()
  })

  it('still reports the account but skips fetching transactions when the user disabled it', async () => {
    const skipped = ZenMoney.isAccountSkipped as jest.Mock
    skipped.mockReturnValue(true)
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.accounts).toHaveLength(1)
    expect(result.accounts[0].id).toBe('acct_1')
    expect(result.transactions).toEqual([])
    expect(mockFetchTransactions).not.toHaveBeenCalled()
  })
})
