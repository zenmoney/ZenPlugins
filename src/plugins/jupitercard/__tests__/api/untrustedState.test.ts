import { InvalidPreferencesError } from '../../../../errors'

const mockSeedCookies = jest.fn()
const mockCurrentAuth = jest.fn()
const mockFetchCards = jest.fn()
const mockFetchBalance = jest.fn()
const mockFetchTransactions = jest.fn()
const mockSendCode = jest.fn()
const mockVerifyCode = jest.fn()

jest.mock('../../fetchApi', () => ({
  ...jest.requireActual('../../fetchApi'),
  seedCookies: mockSeedCookies,
  currentAuth: mockCurrentAuth,
  fetchCards: mockFetchCards,
  fetchBalance: mockFetchBalance,
  fetchTransactions: mockFetchTransactions,
  sendCode: mockSendCode,
  verifyCode: mockVerifyCode
}))

const auth = { accessToken: 'AT', refreshToken: 'RT' }
const preferences = { email: 'a@b.c' }
// eslint-disable-next-line @typescript-eslint/no-var-requires

describe('scrapeJupiter — untrusted inputs', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrapeJupiter } = require('../../api') as typeof import('../../api')

  beforeEach(() => {
    mockFetchCards.mockResolvedValue([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }])
    mockFetchBalance.mockResolvedValue({ currency: 'USD', spendableBalance: 10, withdrawableBalance: 10 })
    mockFetchTransactions.mockResolvedValue([])
    mockSeedCookies.mockResolvedValue(undefined)
    mockCurrentAuth.mockResolvedValue(auth)
    mockVerifyCode.mockResolvedValue(auth)
    global.ZenMoney = {
      isAccountSkipped: jest.fn(() => false),
      readLine: jest.fn(async () => '123456'),
      setData: jest.fn(),
      saveData: jest.fn()
    } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  describe('persisted auth is validated, not trusted', () => {
    const fromDate = new Date('2026-01-01T00:00:00Z')

    it.each([
      ['corrupted object', { accessToken: undefined, refreshToken: 'R' }],
      ['empty tokens', { accessToken: '', refreshToken: '' }],
      ['wrong shape', { token: 'x' }],
      ['a string', 'garbage'],
      ['null', null],
      ['undefined', undefined]
    ])('re-logins cleanly instead of poisoning the cookie jar: %s', async (_label, stored) => {
      await scrapeJupiter(preferences, fromDate, stored)
      // a bad blob must NOT be seeded into setCookie (undefined = delete cookie)
      expect(mockSeedCookies).not.toHaveBeenCalled()
      expect(mockSendCode).toHaveBeenCalledWith('a@b.c')
    })

    it('uses a well-formed stored session without asking for a code', async () => {
      await scrapeJupiter(preferences, fromDate, auth)
      expect(mockSeedCookies).toHaveBeenCalledWith(auth)
      expect(mockSendCode).not.toHaveBeenCalled()
    })
  })

  describe('year range is bounded and boundary-safe', () => {
    const yearsFetched = (): number[] => mockFetchTransactions.mock.calls.map((c) => c[0] as number)

    it('a far-past startDate never crawls years before the card existed (2025)', async () => {
      const thisYear = new Date().getUTCFullYear()
      // naively, 1990 would be ~36 years of paginated crawls per sync
      await scrapeJupiter(preferences, new Date('1990-01-01T00:00:00Z'), auth)
      expect(Math.min(...yearsFetched())).toBe(2025) // Jupiter Card launch year
      expect(Math.max(...yearsFetched())).toBe(thisYear)
    })

    it('queries one year BEFORE fromDate, so a New-Year transaction cannot be missed', async () => {
      const thisYear = new Date().getUTCFullYear()
      // Jupiter's `year` bucket may not be UTC: a Jan-1 transaction can be filed
      // under the previous year, so querying only fromDate's year would lose it.
      await scrapeJupiter(preferences, new Date(`${thisYear}-06-01T00:00:00Z`), auth)
      expect(yearsFetched()).toContain(thisYear - 1)
      expect(yearsFetched()).toContain(thisYear)
    })
  })

  describe('a malformed email is rejected up front, not sent to Jupiter', () => {
    const fromDate = new Date('2026-01-01T00:00:00Z')

    it.each([
      ['not an email at all', 'notanemail'],
      ['no domain', 'user@'],
      ['no local part', '@example.com'],
      ['no TLD', 'user@localhost'],
      ['contains a space', 'user name@example.com'],
      ['empty', '']
    ])('%s → InvalidPreferencesError (fatal → settings screen), no request spent', async (_label, email) => {
      const error = await scrapeJupiter({ email }, fromDate, undefined).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(InvalidPreferencesError)
      // fatal is what makes ZenMoney send the user back to fix it, rather than
      // retrying a hopeless address forever
      expect((error as InvalidPreferencesError).fatal).toBe(true)
      // and we never asked Jupiter about it, nor prompted for a code that can't come
      expect(mockSendCode).not.toHaveBeenCalled()
      expect(ZenMoney.readLine).not.toHaveBeenCalled()
    })

    it('accepts a normal address (including plus-addressing)', async () => {
      mockFetchCards.mockResolvedValue([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }])
      await scrapeJupiter({ email: 'user+jupiter@example.co.uk' }, fromDate, undefined)
      expect(mockSendCode).toHaveBeenCalledWith('user+jupiter@example.co.uk')
    })
  })

  describe('an unusable startDate fails loudly, never silently', () => {
    it('an invalid fromDate → InvalidPreferencesError, not a silent zero-transaction sync', async () => {
      // NaN year → Math.max(NaN, …) is NaN → the year loop never runs → 0 transactions
      // with no error, which is indistinguishable from "you have no transactions".
      const error = await scrapeJupiter(preferences, new Date('not-a-date'), auth).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(InvalidPreferencesError)
      expect((error as InvalidPreferencesError).fatal).toBe(true)
      expect(mockFetchTransactions).not.toHaveBeenCalled()
    })

    it('a normal past date works', async () => {
      mockFetchCards.mockResolvedValue([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }])
      const result = await scrapeJupiter(preferences, new Date('2026-01-01T00:00:00Z'), auth)
      expect(result.accounts).toHaveLength(1)
    })
  })
})
