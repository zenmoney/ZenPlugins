import { CookieJar } from 'tough-cookie'
import { loginMobile, accountIdentity, recoverMobile } from '../mobileAuth'
import { MOBILE_ORIGIN, WEB_ORIGIN, MobileSession, isMobileAuth } from '../mobileSession'
import { UserInteractionError, ZPAPIError } from '../../../errors'

// [model] Native input, cookie scope, persistence boundaries and bounded failures.
// Control-state names come from the observed direct-login run, not invented
// credentials/error formats. No request reaches the bank or the native database.
const parents = [1001, 1002].map(accountNumber => ({ bankNumber: 12, branchNumber: 702, accountNumber }))
const land = { flow: 'AUTHENTICATE', state: 'LANDPAGE', error: null }
const otp = { flow: 'AUTHENTICATE', state: 'LOGONOTP', error: null }
const originalHost = global.ZenMoney
const originalFetch = global.fetch
const globalCookie = 'CANARY_UNRELATED_GLOBAL_COOKIE'
const flush = async (): Promise<void> => { for (let i = 0; i < 30; i++) await Promise.resolve() }

function response (url: string, body: unknown, cookies?: string, status = 200): Response {
  const result = new Response(status === 204 ? null : JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json', ...cookies === undefined ? {} : { 'set-cookie': cookies } }
  })
  Object.defineProperty(result, 'url', { value: url })
  return result
}

function setup (needsOtp = false): { fetch: jest.MockedFunction<typeof global.fetch>, input: jest.Mock, save: jest.Mock } {
  const answers = ['CANARY_USER', 'CANARY_PASSWORD', '123456']
  const input = jest.fn(async () => answers.shift() ?? null)
  const save = jest.fn(async () => {})
  Object.defineProperty(global, 'ZenMoney', {
    configurable: true,
    writable: true,
    value: {
      device: { model: 'MODEL', manufacturer: 'MODEL', brand: 'MODEL', os: { name: 'android', version: '14' } },
      readLine: input
    }
  })
  const fetch = jest.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
    const url = String(input)
    expect(options?.credentials).toBe('omit')
    expect(options?.redirect).toBe('manual')
    expect(new Headers(options?.headers).get('cookie') ?? '').not.toContain(globalCookie)
    const path = new URL(url).pathname
    if (path === '/authenticate/verify') return response(url, needsOtp ? otp : land, 'SMSESSION=MODEL_SESSION; Domain=bankhapoalim.co.il; Path=/; Secure; HttpOnly')
    if (path === '/authenticate/logonotp/init') return response(url, otp, 'csrfcookie=MODEL_CSRF; Domain=bankhapoalim.co.il; Path=/; Secure')
    if (path === '/authenticate/logonotp/verify') return response(url, land)
    expect(path).toBe('/ServerServices/general/accounts')
    expect(new Headers(options?.headers).get('cookie')).toContain('SMSESSION=MODEL_SESSION')
    return response(url, parents)
  })
  global.fetch = fetch
  return { fetch, input, save }
}

beforeEach(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})
afterEach(() => {
  global.ZenMoney = originalHost
  global.fetch = originalFetch
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('[model] direct native authentication', () => {
  it.each([false, true])('confirms a scoped session and persists no entered secrets (OTP: %s)', async needsOtp => {
    const { fetch, input, save } = setup(needsOtp)
    const auth = await loginMobile({ onAuthUpdate: save })
    expect(isMobileAuth(auth)).toBe(true)
    expect(input.mock.calls.map(call => (call as unknown[])[1])).toEqual([
      { inputType: 'text', time: 180000 }, { inputType: 'textPassword', time: 180000 },
      ...needsOtp ? [{ inputType: 'numberPassword', time: 180000 }] : []
    ])
    expect(fetch.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      '/authenticate/verify', ...needsOtp ? ['/authenticate/logonotp/init', '/authenticate/logonotp/verify'] : [], '/ServerServices/general/accounts'
    ])
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(auth)
    expect(auth.identity).toBe(accountIdentity(parents))
    expect(auth.identity).toBe(accountIdentity([...parents].reverse()))
    const persisted = JSON.stringify(auth)
    for (const secret of ['CANARY_USER', 'CANARY_PASSWORD', '123456']) {
      expect(persisted).not.toContain(secret)
      expect(JSON.stringify(jest.mocked(console.debug).mock.calls)).not.toContain(secret)
    }
    const restored = new MobileSession(auth.cookieStore)
    expect(restored.hasSession()).toBe(true)
    expect(restored.snapshot(auth.identity, auth.acquiredAt)).toEqual(auth)
  })

  it('does not request input or start an SMS/login request in background', async () => {
    const { fetch, input, save } = setup(true)
    await expect(loginMobile({ isInBackground: true, onAuthUpdate: save })).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetch).not.toHaveBeenCalled()
    expect(input).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })

  it.each([0, 1, 2])('stops required absent input at step%s without a second login or SMS', async position => {
    const { fetch, input, save } = setup(true)
    input.mockImplementationOnce(async () => position === 0 ? null : 'CANARY_USER')
      .mockImplementationOnce(async () => position === 1 ? null : 'CANARY_PASSWORD')
      .mockImplementationOnce(async () => position === 2 ? null : '123456')
    const error = await loginMobile({ onAuthUpdate: save }).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(save).not.toHaveBeenCalled()
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('/authenticate/verify'))).toHaveLength(position < 2 ? 0 : 1)
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('/logonotp/init'))).toHaveLength(position === 2 ? 1 : 0)
  })

  it('preserves the original transport failure and does not persist a candidate', async () => {
    const { fetch, save } = setup()
    const failure = new Error('MODEL_TRANSPORT_FAILURE')
    fetch.mockRejectedValueOnce(failure)
    await expect(loginMobile({ onAuthUpdate: save })).rejects.toBe(failure)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(save).not.toHaveBeenCalled()
  })

  it('rejects an authenticated different customer before saving or loading financial history', async () => {
    const { fetch, save } = setup()
    await expect(loginMobile({ previousIdentity: accountIdentity(parents.slice(0, 1)), onAuthUpdate: save })).rejects.toThrow('account set differs')
    expect(save).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('propagates a confirmed-state persistence failure without another request', async () => {
    const { fetch, save } = setup()
    const failure = new Error('MODEL_PERSISTENCE_FAILURE')
    save.mockRejectedValueOnce(failure)
    await expect(loginMobile({ onAuthUpdate: save })).rejects.toBe(failure)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('recovers scoped cookies without asking for credentials or sending SMS', async () => {
    const { input, save, fetch } = setup()
    const auth = await loginMobile({ onAuthUpdate: save })
    input.mockClear()
    fetch.mockClear()
    save.mockClear()
    expect(await recoverMobile(auth.cookieStore, auth.identity, save)).toMatchObject({ identity: auth.identity, transport: 'mobile' })
    expect(input).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(String(fetch.mock.calls[0][0])).toContain(WEB_ORIGIN)
  })

  it('does not copy a host-only web cookie to the mobile origin', async () => {
    const { input, save, fetch } = setup()
    const jar = new CookieJar()
    jar.setCookieSync('SMSESSION=MODEL_WEB_ONLY; Path=/; Secure', WEB_ORIGIN)
    const snapshot = JSON.stringify(jar.serializeSync())
    expect(await recoverMobile(snapshot, undefined, save)).toBeNull()
    expect(input).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })

  it.each(['https://example.invalid/', MOBILE_ORIGIN + '/payments/submit'])('rejects unsupported request destinations %s without any transport', async url => {
    const { fetch } = setup()
    await expect(new MobileSession().request(url, { method: 'POST', headers: {} })).rejects.toThrow('Unsupported')
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['request', 'body'])('bounds a never-settling native %s and revokes late cookie writes', async stage => {
    const { fetch } = setup()
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let release: (() => void) | undefined
    const gate = new Promise<void>(resolve => { release = resolve })
    fetch.mockImplementation(async url => {
      if (stage === 'request') await gate
      const result = response(String(url), parents, 'SMSESSION=CANARY_LATE; Domain=bankhapoalim.co.il; Path=/; Secure')
      if (stage === 'body') result.text = async () => { await gate; return JSON.stringify(parents) }
      return result
    })
    const session = new MobileSession()
    let failure: unknown
    const pending = session.request(WEB_ORIGIN + '/ServerServices/general/accounts?lang=he', { method: 'GET', headers: {} }).catch((error: unknown) => { failure = error })
    await flush()
    const writes = jest.spyOn(CookieJar.prototype, 'setCookieSync')
    writes.mockClear()
    jest.advanceTimersByTime(15000)
    await flush()
    expect(failure).toEqual(expect.objectContaining({ message: 'Bank Hapoalim direct request timed out' }))
    expect(session.isActive()).toBe(false)
    release?.()
    await flush()
    await pending
    expect(writes).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(0)
  })
})
