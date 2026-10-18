import fetchMock from 'fetch-mock'
import { fetchAuthorization } from '../fetchApi'
import { ZPAPIError } from '../../../errors'

const base = 'https://psl.pskb.com'
const loginInfoUrl = base + '/mobileService/3.0/json/loginInfo'
const loginPageUrl = base + '/auth-clustered/realms/mdse_multi/protocol/openid-connect/auth?state=state-secret'
const actionUrl = base + '/auth-clustered/realms/mdse_multi/login-actions/authenticate?session_code=form-secret'
const callbackUrl = base + '/mobileService/sso/login?code=code-secret'
const preferences = { login: 'login-secret', password: 'password-secret' }

// [model] Minimal pages isolate completion ordering, cookie rotation and logging.
// The request order is from the authorized 2026-10-18 browser HAR (entries 28-35).
// These model pages do not establish coverage of the bank's HTML/OTP parser.

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'] }).setSystemTime(new Date('2026-10-18T13:10:00.000Z'))
  Object.assign(global, { ZenMoney: { readLine: jest.fn() } })
  fetchMock.postOnce(loginInfoUrl, {
    headers: { 'Set-Cookie': 'SESSION=initial-cookie-secret; Path=/' },
    body: { result: 33, object: { redirectUrl: loginPageUrl } }
  })
  fetchMock.get(loginPageUrl, '<form action="' + actionUrl + '"><input name="fingerprint" type="hidden"/></form>')
  fetchMock.post(actionUrl, { status: 302, headers: { Location: callbackUrl } })
  fetchMock.get(callbackUrl, { status: 302, headers: { Location: '/login/' } })
  fetchMock.get(base + '/login/', '<html><script src="index.js"></script></html>')
})

afterEach(() => {
  fetchMock.restore()
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe('[model] Primsocbank SSO completion', () => {
  it('finishes loginInfo before returning authorization and retains its rotated cookie', async () => {
    fetchMock.postOnce(loginInfoUrl, {
      headers: { 'Set-Cookie': 'SESSION=completed-cookie-secret; Path=/' },
      body: { response: { result: 0 } }
    }, { overwriteRoutes: false })

    const auth = await fetchAuthorization(preferences)
    const completion = fetchMock.lastOptions(loginInfoUrl)
    const fingerprint = new URLSearchParams(String(fetchMock.lastOptions(actionUrl)?.body)).get('fingerprint')
    expect(fingerprint).toMatch(/^[a-f0-9-]{36}$/)
    expect(new URLSearchParams(String(completion?.body)).get('fingerprint')).toBe(fingerprint)
    expect(completion?.headers).toMatchObject({
      'X-Login-Script-Request': 'true',
      Cookie: 'SESSION=initial-cookie-secret'
    })
    expect(auth).toEqual({
      cookieHeader: 'SESSION=completed-cookie-secret',
      updatedAt: '2026-10-18T13:10:00.000Z',
      fingerprint
    })
    expect(fetchMock.calls(loginInfoUrl)).toHaveLength(2)
    expect(global.ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('propagates a completion transport failure without returning an unconfirmed session', async () => {
    const error = new Error('Model transport failure')
    fetchMock.postOnce(loginInfoUrl, { throws: error }, { overwriteRoutes: false })
    await expect(fetchAuthorization(preferences)).rejects.toBe(error)
  })

  it('reuses the saved fingerprint throughout a new login', async () => {
    fetchMock.postOnce(loginInfoUrl, { body: { response: { result: 0 } } }, { overwriteRoutes: false })
    const fingerprint = '12345678-1234-4234-8234-123456789abc'
    const auth = await fetchAuthorization(preferences, fingerprint)
    expect(auth.fingerprint).toBe(fingerprint)
    for (const url of [actionUrl, loginInfoUrl]) {
      expect(new URLSearchParams(String(fetchMock.lastOptions(url)?.body)).get('fingerprint')).toBe(fingerprint)
    }
  })

  it('keeps an uncompleted authorization reportable', async () => {
    // Exact rejection body shown in the user-provided 2026-10-18 synchronization screenshot.
    fetchMock.postOnce(loginInfoUrl, {
      body: { response: { result: 3, message: 'Full authentication is required to access this resource' } }
    }, { overwriteRoutes: false })
    const error = await fetchAuthorization(preferences).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })

  it('masks credential bodies, auth URLs, redirects and cookies in actual network logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.postOnce(loginInfoUrl, {
      headers: { 'Set-Cookie': 'SESSION=completed-cookie-secret', 'X-Request-Id': 'request-42' },
      body: { response: { result: 0 } }
    }, { overwriteRoutes: false })
    await fetchAuthorization(preferences)
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['login-secret', 'password-secret', 'state-secret', 'form-secret', 'code-secret', 'initial-cookie-secret', 'completed-cookie-secret']) {
      expect(logs).not.toContain(secret)
    }
    expect(logs).toContain('request-42')
    expect(logs).toContain('/mobileService/3.0/json/loginInfo')
    expect(logs).toContain('302')
  })
})
