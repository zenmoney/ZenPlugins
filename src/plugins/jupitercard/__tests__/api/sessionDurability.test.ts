import { TemporaryError } from '../../../../errors'

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

const freshAuth = { accessToken: 'NEW', refreshToken: 'NEW_R' }
const preferences = { email: 'a@b.c' }
const fromDate = new Date('2026-01-01T00:00:00Z')

describe('a session the user paid an OTP for is never discarded', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrapeJupiter } = require('../../api') as typeof import('../../api')

  beforeEach(() => {
    mockFetchBalance.mockResolvedValue({ currency: 'USD', spendableBalance: 10, withdrawableBalance: 10 })
    mockFetchTransactions.mockResolvedValue([])
    mockSeedCookies.mockResolvedValue(undefined)
    mockCurrentAuth.mockResolvedValue(freshAuth)
    mockVerifyCode.mockResolvedValue(freshAuth)
    global.ZenMoney = {
      isAccountSkipped: jest.fn(() => false),
      readLine: jest.fn(async () => '123456'),
      setData: jest.fn(),
      saveData: jest.fn()
    } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  it('persists the new session IMMEDIATELY after login, before fetching', async () => {
    mockFetchCards.mockResolvedValue([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }])
    await scrapeJupiter(preferences, fromDate, undefined)
    expect(ZenMoney.setData).toHaveBeenCalledWith('auth', freshAuth)
    expect(ZenMoney.saveData).toHaveBeenCalled()
  })

  it('keeps the session even when the fetch fails right after login (no second OTP next run)', async () => {
    // login succeeds → then Jupiter wobbles. The session must survive, otherwise
    // the next sync would demand another code for a session we already have.
    mockFetchCards.mockRejectedValue(new TemporaryError('Jupiter 503'))
    await expect(scrapeJupiter(preferences, fromDate, undefined)).rejects.toBeInstanceOf(TemporaryError)
    expect(ZenMoney.setData).toHaveBeenCalledWith('auth', freshAuth)
    expect(ZenMoney.saveData).toHaveBeenCalled()
  })
})
