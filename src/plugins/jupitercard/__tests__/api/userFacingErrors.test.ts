import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError, ZPAPIError } from '../../../../errors'

const mockFetchJson = jest.fn()

jest.mock('../../../../common/network', () => ({ fetchJson: mockFetchJson }))

const reply = (status: number, body: unknown = {}): unknown => ({ status, url: '', headers: {}, body })

describe('every error the user can see is a renderable ZenMoney error', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sendCode, verifyCode } = require('../../fetchApi') as typeof import('../../fetchApi')

  beforeEach(() => {
    global.ZenMoney = {
      setCookie: jest.fn(async () => {}),
      getCookies: jest.fn(async () => []),
      setData: jest.fn(),
      saveData: jest.fn()
    } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  describe('a rejected email must send the user to settings, not retry forever', () => {
    it.each([[400], [404], [422]])('status %i → InvalidPreferencesError (fatal → settings screen)', async (status) => {
      mockFetchJson.mockResolvedValue(reply(status))
      const error = await sendCode('nope@nowhere.tld').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(InvalidPreferencesError)
      // fatal=true is what makes ZenMoney redirect to preferences instead of
      // silently retrying an address Jupiter will never accept
      expect((error as ZPAPIError).fatal).toBe(true)
    })

    it.each([[429], [500], [503]])('status %i → TemporaryError (retry later, NOT a settings problem)', async (status) => {
      mockFetchJson.mockResolvedValue(reply(status))
      const error = await sendCode('a@b.c').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(TemporaryError)
      expect((error as ZPAPIError).fatal).toBe(false)
    })
  })

  describe('verifyCode', () => {
    it('a genuinely wrong code → InvalidOtpCodeError (non-fatal, re-prompt)', async () => {
      mockFetchJson.mockResolvedValue(reply(400, { error: 'bad code' }))
      const error = await verifyCode('a@b.c', '000000').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(InvalidOtpCodeError)
      expect((error as ZPAPIError).fatal).toBe(false)
    })

    it('an outage is NOT reported as a wrong code', async () => {
      mockFetchJson.mockResolvedValue(reply(503))
      const error = await verifyCode('a@b.c', '123456').catch((e: unknown) => e)
      expect(error).toBeInstanceOf(TemporaryError)
      expect(error).not.toBeInstanceOf(InvalidOtpCodeError)
    })
  })

  it('data-fetch failures surface as ZPAPIError, never a raw Error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { fetchCards } = require('../../fetchApi') as typeof import('../../fetchApi')
    mockFetchJson.mockResolvedValue(reply(500))
    const error = await fetchCards().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ZPAPIError)
  })
})
