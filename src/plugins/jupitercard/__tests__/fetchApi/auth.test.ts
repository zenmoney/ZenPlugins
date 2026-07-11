import { InvalidOtpCodeError, TemporaryError } from '../../../../errors'

const mockFetchJson = jest.fn()

jest.mock('../../../../common/network', () => ({ fetchJson: mockFetchJson }))

function cookie (name: string, value: string, domain: string): unknown {
  return { name, value, domain, path: '/', persistent: true, secure: null, expires: null }
}

describe('fetchApi — auth hardening', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sendCode, verifyCode, currentAuth } = require('../../fetchApi') as typeof import('../../fetchApi')

  let cookies: unknown[] = []

  beforeEach(() => {
    cookies = []
    global.ZenMoney = {
      setCookie: jest.fn(async () => {}),
      getCookies: jest.fn(async () => cookies)
    } as unknown as typeof ZenMoney
  })

  afterEach(() => { jest.clearAllMocks() })

  describe('currentAuth — cookie domain validation', () => {
    it('reads the session from jup.ag and its subdomains', async () => {
      cookies = [cookie('access_token', 'A', 'global.jup.ag'), cookie('refresh_token', 'R', '.jup.ag')]
      expect(await currentAuth()).toEqual({ accessToken: 'A', refreshToken: 'R' })
    })

    it('IGNORES a lookalike domain (jup.ag.evil.com) — must not be mistaken for our session', async () => {
      cookies = [
        cookie('access_token', 'EVIL', 'jup.ag.evil.com'),
        cookie('refresh_token', 'EVIL', 'jup.ag.evil.com')
      ]
      expect(await currentAuth()).toBeNull()
    })

    it('IGNORES a suffix-lookalike domain (notjup.ag)', async () => {
      cookies = [cookie('access_token', 'EVIL', 'notjup.ag'), cookie('refresh_token', 'EVIL', 'notjup.ag')]
      expect(await currentAuth()).toBeNull()
    })

    it('survives a host-only cookie whose domain is null (the real jar has these)', async () => {
      // The ZenMoney d.ts declares domain as `string`, but the runtime returns
      // tough-cookie's nullable domain. This crashed the live plugin.
      cookies = [
        { name: 'session', value: 'x', domain: null, path: '/', persistent: true, secure: null, expires: null },
        cookie('access_token', 'A', 'global.jup.ag'),
        cookie('refresh_token', 'R', 'global.jup.ag')
      ]
      expect(await currentAuth()).toEqual({ accessToken: 'A', refreshToken: 'R' })
    })

    it('a null-domain cookie is never mistaken for our session', async () => {
      cookies = [
        { name: 'access_token', value: 'EVIL', domain: null, path: '/', persistent: true, secure: null, expires: null },
        { name: 'refresh_token', value: 'EVIL', domain: null, path: '/', persistent: true, secure: null, expires: null }
      ]
      expect(await currentAuth()).toBeNull()
    })
  })

  describe('sendCode', () => {
    it('fails loudly when Jupiter did not actually send a code (e.g. rate-limited)', async () => {
      mockFetchJson.mockResolvedValue({ status: 429, url: '', headers: {}, body: {} })
      await expect(sendCode('a@b.c')).rejects.toBeInstanceOf(TemporaryError)
    })

    it('succeeds on 200', async () => {
      mockFetchJson.mockResolvedValue({ status: 200, url: '', headers: {}, body: {} })
      await expect(sendCode('a@b.c')).resolves.toBeUndefined()
    })
  })

  describe('verifyCode', () => {
    it('reports a rate-limit as transient, NOT as a wrong code', async () => {
      mockFetchJson.mockResolvedValue({ status: 429, url: '', headers: {}, body: {} })
      await expect(verifyCode('a@b.c', '123456')).rejects.toBeInstanceOf(TemporaryError)
    })

    it('reports an outage as transient, NOT as a wrong code', async () => {
      mockFetchJson.mockResolvedValue({ status: 503, url: '', headers: {}, body: {} })
      await expect(verifyCode('a@b.c', '123456')).rejects.toBeInstanceOf(TemporaryError)
    })

    it('reports a genuinely wrong code as InvalidOtpCodeError', async () => {
      mockFetchJson.mockResolvedValue({ status: 400, url: '', headers: {}, body: { error: 'bad code' } })
      await expect(verifyCode('a@b.c', '000000')).rejects.toBeInstanceOf(InvalidOtpCodeError)
    })

    it('returns the session on success', async () => {
      mockFetchJson.mockResolvedValue({
        status: 200, url: '', headers: {}, body: { accessToken: 'A', refreshToken: 'R' }
      })
      expect(await verifyCode('a@b.c', '123456')).toEqual({ accessToken: 'A', refreshToken: 'R' })
    })
  })
})
