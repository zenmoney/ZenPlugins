import { TemporaryError } from '../../../../errors'
import { Auth } from '../../models'

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

const auth: Auth = { accessToken: 'AT', refreshToken: 'RT' }
const preferences = { email: 'a@b.c' }
const fromDate = new Date('2026-01-01T00:00:00Z')

describe('scrapeJupiter — re-login only when the session is really dead', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { scrapeJupiter } = require('../../api') as typeof import('../../api')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SessionExpiredError } = require('../../fetchApi') as typeof import('../../fetchApi')

  beforeEach(() => {
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

  it('does NOT send a new OTP when Jupiter fails transiently', async () => {
    mockFetchCards.mockRejectedValue(new TemporaryError('Jupiter 503 for /api/proxy/cards'))
    // NB: toThrow() can't be used — ZPAPIError does not extend Error at runtime
    await expect(scrapeJupiter(preferences, fromDate, auth)).rejects.toBeInstanceOf(TemporaryError)
    // the whole point: a 5xx must not email the user a code
    expect(mockSendCode).not.toHaveBeenCalled()
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('re-logins (new OTP) only when the session is expired', async () => {
    mockFetchCards
      .mockRejectedValueOnce(new SessionExpiredError())
      .mockResolvedValue([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }])
    const result = await scrapeJupiter(preferences, fromDate, auth)
    expect(mockSendCode).toHaveBeenCalledWith('a@b.c')
    expect(ZenMoney.readLine).toHaveBeenCalled()
    expect(mockVerifyCode).toHaveBeenCalledWith('a@b.c', '123456')
    expect(result.accounts).toHaveLength(1)
  })
})
