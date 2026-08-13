import { convertAccounts } from '../../converters'
import { JupiterBalance } from '../../models'

const mockSeedCookies = jest.fn()
const mockCurrentAuth = jest.fn()
const mockFetchCards = jest.fn()
const mockFetchBalance = jest.fn()
const mockFetchTransactions = jest.fn()
const mockSendCode = jest.fn()

jest.mock('../../fetchApi', () => ({
  ...jest.requireActual('../../fetchApi'),
  seedCookies: mockSeedCookies,
  currentAuth: mockCurrentAuth,
  fetchCards: mockFetchCards,
  fetchBalance: mockFetchBalance,
  fetchTransactions: mockFetchTransactions,
  sendCode: mockSendCode
}))

const auth = { accessToken: 'AT', refreshToken: 'RT' }
const preferences = { email: 'a@b.c' }
const fromDate = new Date('2026-01-01T00:00:00Z')
const balance: JupiterBalance = { currency: 'USD', spendableBalance: 100, withdrawableBalance: 100 }

describe('degenerate Jupiter responses must not corrupt the ledger', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrapeJupiter } = require('../../api') as typeof import('../../api')

  beforeEach(() => {
    mockFetchBalance.mockResolvedValue(balance)
    mockFetchTransactions.mockResolvedValue([])
    mockSeedCookies.mockResolvedValue(undefined)
    mockCurrentAuth.mockResolvedValue(auth)
    global.ZenMoney = { isAccountSkipped: jest.fn(() => false) } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  it('an empty cards list produces NO account — never a phantom duplicate', () => {
    // inventing an account here would give it a different id from the real one,
    // and ZenMoney would create a second "Jupiter Card" account alongside it
    expect(convertAccounts([], balance)).toEqual([])
  })

  it('a transient empty cards response reports nothing rather than a phantom account', async () => {
    mockFetchCards.mockResolvedValue([])
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.accounts).toEqual([])
    expect(result.transactions).toEqual([])
    expect(mockFetchTransactions).not.toHaveBeenCalled() // nothing to attach them to
  })

  it('an empty balance body does not crash (would have been undefined.currency)', async () => {
    mockFetchCards.mockResolvedValue([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }])
    mockFetchBalance.mockResolvedValue({}) // what fetchBalance now returns for a garbage body
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.accounts).toHaveLength(1)
    expect(result.accounts[0].instrument).toBe('USD') // safe default
    expect(result.accounts[0].balance).toBeNull() // honestly unknown, not NaN
  })

  it('a card without an id still yields an account keyed by its card account', async () => {
    mockFetchCards.mockResolvedValue([{ cardAccountId: 'acct_1', last4: '1234' }])
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.accounts).toHaveLength(1)
    expect(result.accounts[0].id).toBe('acct_1')
  })
})
