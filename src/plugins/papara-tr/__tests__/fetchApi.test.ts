import fetchMock from 'fetch-mock'
import { fetchBalance, fetchIsUserDeviceVerified, fetchLoginPassword, fetchLoginPhone, fetchLoginTfaPush, fetchValidatePhone, UnauthorizedError } from '../fetchApi'

// Response shapes follow the 2026-11-24 Bootloader log; secret and personal values are sentinels
// so that the actual console.debug output can be searched for leaks.
const API = 'https://webapi.papara.com'

function logs (debug: jest.SpyInstance): string {
  return JSON.stringify(debug.mock.calls)
}

describe('network logs', () => {
  afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

  it('[model] masks the phone in validate/phone requests and its bare string response', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post(`${API}/validate/phone`, { headers: { 'Set-Cookie': '__cf_bm=cookie-secret' }, body: { data: '+905000000123', succeeded: true } })
    await fetchValidatePhone('+905000000123')
    const output = logs(debug)
    expect(output).not.toContain('5000000123')
    expect(output).not.toContain('cookie-secret')
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
  })

  it('[model] masks login tokens, credentials and profile data while keeping protocol fields visible', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post(`${API}/login/phone`, { data: { access_token: 'phone-token-secret', token_type: 'bearer', '.expires': '2026-11-23T22:28:29', tokenType: 'PasswordStep' }, succeeded: true })
    fetchMock.post(`${API}/login/password`, {
      data: { access_token: 'push-token-secret', tokenType: 'WebLoginPushNotification', email: 'user-secret@example.com', name: 'Name-secret', phone: '+905000000123', otpResendExpireTime: 30 },
      succeeded: true
    })
    fetchMock.post(`${API}/login/tfapush`, { data: { access_token: 'device-token-secret', tokenType: 'ValidateUserDevice', deviceIdentifier: 'device-id-secret' }, succeeded: true })
    fetchMock.get(`${API}/login/isUserDeviceVerified`, {
      data: { access_token: 'master-token-secret', tokenType: 'Master', sessionId: 'session-secret', externalUserId: 'external-user-secret', userId: 'user-id-secret', deviceIdentifier: 'device-id-secret' },
      succeeded: true
    })
    await fetchLoginPhone('+905000000123', 'turnstile-secret')
    await fetchLoginPassword('bearer-secret-1', 'password-secret')
    await fetchLoginTfaPush('bearer-secret-2', '654321')
    await fetchIsUserDeviceVerified('bearer-secret-3')
    const output = logs(debug)
    for (const secret of [
      '5000000123', 'turnstile-secret', 'phone-token-secret', 'push-token-secret', 'device-token-secret', 'master-token-secret',
      'bearer-secret-1', 'bearer-secret-2', 'bearer-secret-3', 'password-secret', '654321', 'user-secret@example.com',
      'Name-secret', 'device-id-secret', 'session-secret', 'external-user-secret', 'user-id-secret'
    ]) {
      expect(output).not.toContain(secret)
    }
    for (const visible of ['PasswordStep', 'WebLoginPushNotification', 'ValidateUserDevice', 'Master', '2026-11-23T22:28:29', 'otpResendExpireTime']) {
      expect(output).toContain(visible)
    }
  })

  it('[model] masks the IBAN but keeps balances, currency reference data and bank errors', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get(`${API}/balance`, {
      data: { balances: [{ currency: 0, currencyInfo: { code: 'TRY', name: 'Currency-name-visible' }, totalBalance: 5714.56, iban: 'TR990000000000000000000123' }] },
      succeeded: false,
      error: { message: 'Bank error visible', code: 1004 }
    })
    await fetchBalance('token-secret')
    const output = logs(debug)
    expect(output).not.toContain('TR990000000000000000000123')
    expect(output).not.toContain('token-secret')
    for (const visible of ['Currency-name-visible', '5714.56', 'Bank error visible', '1004', 'TRY']) expect(output).toContain(visible)
  })
})

describe('transport', () => {
  afterEach(() => { fetchMock.restore() })

  it('[model] turns HTTP 401 on an authorized request into the internal UnauthorizedError', async () => {
    fetchMock.get(`${API}/balance`, { status: 401, body: '' })
    await expect(fetchBalance('token')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('[model] rejects a non-envelope response with an ordinary error', async () => {
    fetchMock.get(`${API}/balance`, { status: 502, body: '<html>bad gateway</html>' })
    await expect(fetchBalance('token')).rejects.toThrow('Unexpected Papara response envelope')
  })
})
