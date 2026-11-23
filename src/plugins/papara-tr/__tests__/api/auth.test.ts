import fetchMock from 'fetch-mock'
import { CookieJar } from 'tough-cookie'
import type { Auth } from '../../api'
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError, UserInteractionError, ZPAPIError } from '../../../../errors'

jest.mock('../../turnstile', () => ({ solveTurnstile: jest.fn(async () => 'turnstile-token') }))
jest.mock('../../../../common/ui', () => ({ ui: { readLine: jest.fn(async () => '123456') } }))
jest.mock('../../../../common/utils', () => ({
  delay: jest.fn(async (ms: number) => { jest.setSystemTime(Date.now() + ms) })
}))
const { solveTurnstile } = jest.requireMock<typeof import('../../turnstile')>('../../turnstile')
const { ui } = jest.requireMock<typeof import('../../../../common/ui')>('../../../../common/ui')
const { authenticateAndFetchBalance } = jest.requireActual<typeof import('../../api')>('../../api')

// Responses are reduced from the 2026-11-24 Bootloader log (prototype build, Papara web login);
// profile fields and unused flags are omitted, tokens and the phone number are replaced.
const API = 'https://webapi.papara.com'
const validatePhone = { data: '+905000000000', succeeded: true }
const passwordStep = { data: { access_token: 'password-step-token', token_type: 'bearer', '.issued': '2026-11-23T22:25:29', '.expires': '2026-11-23T22:28:29', tokenType: 'PasswordStep' }, succeeded: true, error: null }
const pushStep = { data: { access_token: 'push-step-token', token_type: 'bearer', '.issued': '2026-11-23T22:25:29', '.expires': '2026-11-23T22:28:29', tokenType: 'WebLoginPushNotification' }, succeeded: true, error: null }
const deviceStep = { data: { access_token: 'device-step-token', token_type: 'bearer', '.issued': '2026-11-23T22:25:42', '.expires': '2026-11-23T22:28:42', tokenType: 'ValidateUserDevice' }, succeeded: true, error: null }
const deviceNotVerified = { data: null, succeeded: false, error: { data: null, message: 'Cihaz henüz onaylanmadı.', code: 1004, externalCode: null, externalMessage: null } }
// Public-safe 32-hex placeholders for deviceIdentifier values.
const SAVED_DEVICE = '0123456789abcdef0123456789abcdef'
const ISSUED_DEVICE = 'fedcba9876543210fedcba9876543210'
const master = { data: { access_token: 'master-token', token_type: 'bearer', '.issued': '2026-11-23T22:25:52', '.expires': '2026-11-23T22:55:52', tokenType: 'Master', deviceIdentifier: ISSUED_DEVICE }, succeeded: true, error: null }
const balance = { data: { balances: [], savingBalancesSum: { balances: [] } }, succeeded: true, error: null }
const preferences = { phone: '+90 500 000 00 00', password: 'secret' }

function mockColdLogin (): void {
  fetchMock.post(`${API}/validate/phone`, validatePhone)
  fetchMock.post(`${API}/login/phone`, passwordStep)
  fetchMock.post(`${API}/login/password`, pushStep)
  fetchMock.post(`${API}/login/tfapush`, deviceStep)
}

type Call = [string, RequestInit | undefined]

// fetch-mock 5 returns { matched, unmatched } from calls().
function matchedCalls (): Call[] {
  return (fetchMock.calls() as unknown as { matched: Call[] }).matched
}

function urlCount (url: string): number {
  return matchedCalls().filter(([callUrl]) => callUrl === url).length
}

// The shared cookie jar lives on the fetch polyfill; fetch-mock replaces global.fetch, so attach one to it.
function installJar (): CookieJar {
  const jar = new CookieJar()
  Object.defineProperty(global.fetch, 'cookieJar', { value: jar, configurable: true })
  return jar
}

function requests (): Array<{ url: string, authorization: string | null, body: unknown }> {
  return matchedCalls().map(([url, options]) => {
    const headers = (options?.headers ?? {}) as Record<string, string>
    return { url, authorization: headers.Authorization ?? null, body: typeof options?.body === 'string' ? JSON.parse(options.body) : null }
  })
}

describe('authentication', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance', 'setTimeout', 'clearTimeout'] })
    jest.setSystemTime(new Date('2026-11-23T22:25:20Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
    fetchMock.restore()
    jest.clearAllMocks()
  })

  it('walks the observed cold login, polls device approval through 1004 and persists the Master token before loading', async () => {
    mockColdLogin()
    let polls = 0
    fetchMock.get(`${API}/login/isUserDeviceVerified`, () => ++polls === 1 ? deviceNotVerified : master)
    const persisted: Array<{ auth: Auth, requestsBefore: number }> = []
    fetchMock.get(`${API}/balance`, () => balance)
    installJar()

    const result = await authenticateAndFetchBalance(preferences, undefined, false, auth => persisted.push({ auth, requestsBefore: matchedCalls().length }))

    const auth = { token: 'master-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: ISSUED_DEVICE }
    expect(result).toEqual({ auth, balance: balance.data })
    expect(persisted).toEqual([{ auth, requestsBefore: 6 }])
    expect(requests()).toEqual([
      { url: `${API}/validate/phone`, authorization: null, body: { phoneNumber: '+905000000000', locale: 'TR', platform: 0 } },
      { url: `${API}/login/phone`, authorization: null, body: { phoneNumber: '+905000000000', humanVerificationToken: 'turnstile-token', locale: 'TR', platform: 0 } },
      { url: `${API}/login/password`, authorization: 'Bearer password-step-token', body: { password: 'secret' } },
      { url: `${API}/login/tfapush`, authorization: 'Bearer push-step-token', body: { tfaCode: '123456', platform: 0 } },
      { url: `${API}/login/isUserDeviceVerified`, authorization: 'Bearer device-step-token', body: null },
      { url: `${API}/login/isUserDeviceVerified`, authorization: 'Bearer device-step-token', body: null },
      { url: `${API}/balance`, authorization: 'Bearer master-token', body: null }
    ])
    expect(solveTurnstile).toHaveBeenCalledWith('https://www.papara.com/', false)
    expect(ui.readLine).toHaveBeenCalledWith('Papara uygulamasına gelen kodu girin. Uygulamada giriş onayı istenirse kabul edin.', { inputType: 'number' })
  })

  it('reuses a saved token that has not expired, in the background and with changed preferences', async () => {
    fetchMock.get(`${API}/balance`, balance)
    const jar = installJar()
    const saved = { token: 'saved-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: SAVED_DEVICE }
    const onAuth = jest.fn()
    const result = await authenticateAndFetchBalance({ phone: '+905111111111', password: 'changed' }, saved, true, onAuth)
    expect(result.auth).toBe(saved)
    // user/ledgers rejects a saved token without the device cookie, so it is restored before loading.
    expect(await jar.getCookieString(`${API}/user/ledgers`)).toBe(`Papara-Device-Identifier=${SAVED_DEVICE}`)
    expect(requests()).toEqual([{ url: `${API}/balance`, authorization: 'Bearer saved-token', body: null }])
    expect(onAuth).not.toHaveBeenCalled()
    expect(solveTurnstile).not.toHaveBeenCalled()
  })

  it('starts an interactive login after the saved token is rejected with 401', async () => {
    // Observed 2026-11-26: balance answered 401, code 296, after a login from another browser ended the session.
    const sessionEnded = { succeeded: false, error: { data: null, message: 'Başka bir cihaz veya tarayıcı üzerinden giriş yaptığın için bu oturumun sonlandırılmıştır.', code: 296, externalCode: null, externalMessage: null }, result: null, traceId: null }
    fetchMock.get(`${API}/balance`, (_url, options) => {
      const authorization = (options.headers as Record<string, string>).Authorization
      return authorization === 'Bearer saved-token' ? { status: 401, body: sessionEnded } : balance
    })
    mockColdLogin()
    fetchMock.get(`${API}/login/isUserDeviceVerified`, master)
    const onAuth = jest.fn()
    const jar = installJar()
    const result = await authenticateAndFetchBalance(preferences, { token: 'saved-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: SAVED_DEVICE }, false, onAuth)
    expect(result.auth).toEqual({ token: 'master-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: ISSUED_DEVICE })
    expect(await jar.getCookieString(`${API}/user/ledgers`)).toBe(`Papara-Device-Identifier=${ISSUED_DEVICE}`)
    expect(onAuth).toHaveBeenCalledWith(result.auth)
    expect(requests().map(request => request.url)).toEqual([
      `${API}/balance`, `${API}/validate/phone`, `${API}/login/phone`, `${API}/login/password`,
      `${API}/login/tfapush`, `${API}/login/isUserDeviceVerified`, `${API}/balance`
    ])
  })

  it('[model] stops in the background after a 401 before any login request or Turnstile window', async () => {
    fetchMock.get(`${API}/balance`, { status: 401, body: '' })
    installJar()
    await expect(authenticateAndFetchBalance(preferences, { token: 'saved-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: SAVED_DEVICE }, true, jest.fn()))
      .rejects.toBeInstanceOf(UserInteractionError)
    expect(requests().map(request => request.url)).toEqual([`${API}/balance`])
    expect(solveTurnstile).not.toHaveBeenCalled()
  })

  it('[model] stops in the background for an expired saved token without sending any request', async () => {
    installJar()
    await expect(authenticateAndFetchBalance(preferences, { token: 'saved-token', expiresAt: '2026-11-23T22:26:00.000Z', deviceIdentifier: SAVED_DEVICE }, true, jest.fn()))
      .rejects.toBeInstanceOf(UserInteractionError)
    expect(matchedCalls()).toHaveLength(0)
    expect(solveTurnstile).not.toHaveBeenCalled()
  })

  it('[model] propagates a transport failure of the saved session unchanged without starting a login', async () => {
    const failure = new Error('Network down')
    fetchMock.get(`${API}/balance`, { throws: failure })
    installJar()
    await expect(authenticateAndFetchBalance(preferences, { token: 'saved-token', expiresAt: '2026-11-23T22:55:52.000Z', deviceIdentifier: SAVED_DEVICE }, false, jest.fn()))
      .rejects.toBe(failure)
    expect(requests().map(request => request.url)).toEqual([`${API}/balance`])
  })

  it('sends the saved deviceIdentifier cookie and skips device approval when tfapush returns the Master token', async () => {
    // Reduced from the 2026-11-26 web client login (DevTools, approved browser): the browser sent the
    // Papara-Device-Identifier cookie with tfapush, and tfapush answered with the Master token.
    // Identifiers and the token are replaced.
    fetchMock.post(`${API}/validate/phone`, validatePhone)
    fetchMock.post(`${API}/login/phone`, passwordStep)
    fetchMock.post(`${API}/login/password`, pushStep)
    fetchMock.post(`${API}/login/tfapush`, {
      data: { access_token: 'trusted-master-token', token_type: 'bearer', '.issued': '2026-11-26T19:52:30', '.expires': '2026-11-26T20:22:30', tokenType: 'Master', hasPhoneNumber: false, approvalInfoRemainingDay: 0, deviceIdentifier: SAVED_DEVICE },
      succeeded: true,
      error: null
    })
    fetchMock.get(`${API}/balance`, balance)
    const jar = installJar()
    const onAuth = jest.fn()
    const expired = { token: 'expired-token', expiresAt: '2026-11-23T22:00:00.000Z', deviceIdentifier: SAVED_DEVICE }
    const result = await authenticateAndFetchBalance(preferences, expired, false, onAuth)
    expect(result.auth).toEqual({ token: 'trusted-master-token', expiresAt: '2026-11-26T20:22:30.000Z', deviceIdentifier: SAVED_DEVICE })
    expect(onAuth).toHaveBeenCalledWith(result.auth)
    expect(await jar.getCookieString(`${API}/login/tfapush`)).toBe(`Papara-Device-Identifier=${SAVED_DEVICE}`)
    expect(requests().map(request => request.url)).toEqual([
      `${API}/validate/phone`, `${API}/login/phone`, `${API}/login/password`, `${API}/login/tfapush`, `${API}/balance`
    ])
  })

  it('[model] logs in without a device cookie the first time and sets the issued deviceIdentifier for loading', async () => {
    let jar = new CookieJar()
    const cookieAt: Record<string, string> = {}
    const record = (step: string, response: unknown) => async (url: string): Promise<unknown> => {
      cookieAt[step] = await jar.getCookieString(url)
      return response
    }
    fetchMock.post(`${API}/validate/phone`, record('validate/phone', validatePhone))
    fetchMock.post(`${API}/login/phone`, passwordStep)
    fetchMock.post(`${API}/login/password`, pushStep)
    fetchMock.post(`${API}/login/tfapush`, record('login/tfapush', deviceStep))
    fetchMock.get(`${API}/login/isUserDeviceVerified`, master)
    fetchMock.get(`${API}/balance`, record('balance', balance))
    jar = installJar()
    await authenticateAndFetchBalance(preferences, undefined, false, jest.fn())
    expect(cookieAt).toEqual({
      'validate/phone': '',
      'login/tfapush': '',
      balance: `Papara-Device-Identifier=${ISSUED_DEVICE}`
    })
  })

  it('[model] rejects a missing push code before sending tfapush', async () => {
    mockColdLogin()
    jest.mocked(ui.readLine).mockResolvedValueOnce(null)
    await expect(authenticateAndFetchBalance(preferences, undefined, false, jest.fn())).rejects.toBeInstanceOf(InvalidOtpCodeError)
    expect(requests().map(request => request.url)).not.toContain(`${API}/login/tfapush`)
  })

  it('reports a temporary error when the login is not approved before the device step token expires', async () => {
    mockColdLogin()
    fetchMock.get(`${API}/login/isUserDeviceVerified`, deviceNotVerified)
    const onAuth = jest.fn()
    await expect(authenticateAndFetchBalance(preferences, undefined, false, onAuth)).rejects.toBeInstanceOf(TemporaryError)
    expect(urlCount(`${API}/login/isUserDeviceVerified`)).toBeGreaterThan(50)
    expect(Date.now() - new Date('2026-11-23T22:25:20Z').valueOf()).toBeLessThan(180000)
    expect(onAuth).not.toHaveBeenCalled()
  })

  it('[model] fails visibly on an unknown device verification error instead of waiting', async () => {
    mockColdLogin()
    fetchMock.get(`${API}/login/isUserDeviceVerified`, { data: null, succeeded: false, error: { message: 'Model failure', code: 5000 } })
    let error: unknown
    try { await authenticateAndFetchBalance(preferences, undefined, false, jest.fn()) } catch (e) { error = e }
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(String(error)).toContain('Unexpected Papara isUserDeviceVerified response')
    expect(urlCount(`${API}/login/isUserDeviceVerified`)).toBe(1)
  })

  it.each([
    [{ phone: '05000000000', password: 'secret' }, 'Telefon numarasını ülke koduyla birlikte girin, örneğin +905xxxxxxxxx.'],
    [{ phone: '+905000000000', password: '' }, 'Papara şifrenizi girin.']
  ])('[model] asks to correct invalid settings in Turkish before any login request', async (invalid, message) => {
    const error = await authenticateAndFetchBalance(invalid, undefined, false, jest.fn()).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(InvalidPreferencesError)
    expect((error as InvalidPreferencesError).message).toBe(message)
    expect(matchedCalls()).toHaveLength(0)
  })
})
