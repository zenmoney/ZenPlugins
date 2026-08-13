import { Auth, JupiterTransaction } from '../../models'

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

function tx (id: string, cardId: string | null): JupiterTransaction {
  return {
    id,
    cardId,
    type: 'CARD',
    direction: 'DEBIT',
    settlementCurrency: 'USD',
    settlementAmount: '10.00',
    transactionCurrency: 'USD',
    transactionAmount: '10.00',
    onchainSignature: null,
    transactionTimestamp: '2026-02-01T12:00:00.000Z',
    card: { merchantName: 'SHOP', merchantCategoryCode: '5814', settlementTimestamp: '2026-02-01T12:01:00.000Z' }
  }
}

describe('scrapeJupiter — several card accounts', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrapeJupiter } = require('../../api') as typeof import('../../api')

  beforeEach(() => {
    mockFetchCards.mockResolvedValue([
      { id: 'card_1', cardAccountId: 'acct_1', last4: '1111' },
      { id: 'card_2', cardAccountId: 'acct_2', last4: '2222' }
    ])
    mockFetchBalance.mockResolvedValue({ currency: 'USD', spendableBalance: 10, withdrawableBalance: 10 })
    mockSeedCookies.mockResolvedValue(undefined)
    mockCurrentAuth.mockResolvedValue(auth)
    global.ZenMoney = { isAccountSkipped: jest.fn(() => false) } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  it('routes each transaction to the account of the card it was made with', async () => {
    mockFetchTransactions.mockResolvedValue([tx('a', 'card_1'), tx('b', 'card_2')])
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.accounts.map((a) => a.id)).toEqual(['acct_1', 'acct_2'])
    const byId = new Map(result.transactions.map((t) => [t.movements[0].id, t.movements[0].account]))
    expect(byId.get('a')).toEqual({ id: 'acct_1' })
    expect(byId.get('b')).toEqual({ id: 'acct_2' })
  })

  it('falls back to the primary account when a transaction has no cardId (e.g. a deposit)', async () => {
    mockFetchTransactions.mockResolvedValue([tx('deposit', null)])
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.transactions[0].movements[0].account).toEqual({ id: 'acct_1' })
  })

  it('drops transactions of a skipped account but keeps the others', async () => {
    const skipped = ZenMoney.isAccountSkipped as jest.Mock
    skipped.mockImplementation((id: string) => id === 'acct_2')
    mockFetchTransactions.mockResolvedValue([tx('a', 'card_1'), tx('b', 'card_2')])
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(result.accounts).toHaveLength(2) // both still reported
    expect(result.transactions.map((t) => t.movements[0].id)).toEqual(['a'])
  })
})
