import fetchMock from 'fetch-mock'
import { InvalidLoginOrPasswordError, ZPAPIError } from '../../../errors'
const { login }: { login: (preferences: object, auth: object) => Promise<void> } = jest.requireActual('../api')
const { installFetchMockDeveloperFriendlyFallback }: { installFetchMockDeveloperFriendlyFallback: (mock: typeof fetchMock) => void } = jest.requireActual('../../../testUtils')

installFetchMockDeveloperFriendlyFallback(fetchMock)

const base = 'https://online.kredobank.com.ua/ibank/api'
const url = base + '/v1/individual/light/auth/login/login-password/test-device'
const blocked: { body: object } = jest.requireActual('./blockedAuth.json')
const preferences = { login: 'test-login', password: 'test-password' }
const createAuth = (): { device: { deviceId: string } } => ({ device: { deviceId: 'test-device' } })

beforeEach(() => { Object.assign(global, { ZenMoney: { features: {}, device: { brand: 'Test', model: 'Device' }, readLine: jest.fn() } }) })

// The blocked-profile test uses the complete observed body; other cases model legacy error propagation and log masks.
describe('Kredobank authentication responses', () => {
  it('keeps the observed blocked-profile response reportable with safe diagnostic context', async () => {
    fetchMock.postOnce(url, {
      status: 403,
      headers: { authorization: 'secret-authorization', 'Set-Cookie': 'secret-cookie' },
      body: blocked.body
    })
    const error = await login(preferences, createAuth()).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error instanceof Error ? error.message : null).toContain('Unexpected Kredobank authentication response')
    expect(error instanceof Error ? error.message : null).toContain('account_temporary_locked_by_sp')
    expect(error instanceof Error ? error.message : null).not.toMatch(/secret-authorization|secret-cookie/)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect((fetchMock.calls() as unknown as { matched: unknown[] }).matched).toHaveLength(1)
  })

  it.each(['wrong_login_and_password_credentials', 'account_temporary_locked'])('classifies only the confirmed credential rejection %s', async errorMessageKey => {
    fetchMock.postOnce(url, { status: 403, body: { errorMessageKey, errorDescription: 'Wrong Credentials' } })
    await expect(login(preferences, createAuth())).rejects.toBeInstanceOf(InvalidLoginOrPasswordError)
  })

  it('preserves a hot-auth transport failure without starting cold auth or replacing the token', async () => {
    const auth = { ...createAuth(), accessToken: 'saved-token' }
    const error = new Error('Connection error')
    fetchMock.postOnce(base + '/v1/individual/light/auth/login/token/test-device', { throws: error })
    await expect(login(preferences, auth)).rejects.toBe(error)
    expect(auth.accessToken).toBe('saved-token')
    expect((fetchMock.calls() as unknown as { matched: unknown[] }).matched).toHaveLength(1)
  })

  it('does not read missing OTP parameters or log an authorization token', async () => {
    fetchMock.postOnce(url, { status: 200, headers: { authorization: 'private-token' }, body: { isAuthCompleted: false } })
    const error = await login(preferences, createAuth()).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error instanceof Error ? error.message : null).toContain('Kredobank OTP parameters are missing')
    expect(error instanceof Error ? error.message : null).not.toContain('private-token')
    expect((fetchMock.calls() as unknown as { matched: unknown[] }).matched).toHaveLength(1)
  })

  it('masks request and response credentials in actual network logs while preserving bank diagnostics', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    try {
      fetchMock.postOnce(url, {
        status: 403,
        headers: { authorization: 'private-token', 'Set-Cookie': 'private-cookie' },
        body: {
          errorMessageKey: 'account_temporary_locked_by_sp',
          errorDescription: 'User is blocked',
          userInfo: { name: 'Private Customer' },
          diagnosticId: 'request-123'
        }
      })
      await login(preferences, createAuth()).catch(() => {})
      const logs = JSON.stringify(debug.mock.calls)
      for (const secret of ['private-token', 'private-cookie', 'Private Customer', preferences.login, preferences.password]) {
        expect(logs).not.toContain(secret)
      }
      for (const value of ['account_temporary_locked_by_sp', 'User is blocked', 'request-123']) expect(logs).toContain(value)
    } finally {
      debug.mockRestore()
    }
  })
})
