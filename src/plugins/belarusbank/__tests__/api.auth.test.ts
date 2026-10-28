import fetchMock from 'fetch-mock'
import { UserInteractionError, ZPAPIError } from '../../../errors'

// Recorded PIN responses: logs 156874/build156, 157205/build157, 156284/build156.
// Only classification fields retained at the user's request.
const credentialRejections = [1011, 1042].map(code => ({ status: 400, body: { errorInfo: { code } } }))
const unknownPinFailure = { status: 400, body: { errorInfo: { code: 1036 } } }

// mail_inbound 182272, build 163: POST users/auth/refresh-token.
const unknownRefreshFailure = { status: 400, body: { errorInfo: {} } }

const mockAuthorize = jest.fn()
jest.mock('../sso', () => ({ authorizeInWebView: mockAuthorize }))
const { authenticate } = jest.requireActual<typeof import('../api')>('../api')

// Model auth lifecycle obligations. Protocol: Android 2026.7.0 main-N6E6C6MF.js,
// loginConfirmation (PIN preparation/confirmation), WT$2 (authorization header), H$h (10s access expiry gap).
describe('authentication lifecycle [model]', () => {
  const tokens = { sessionToken: 'model-session', refreshToken: 'model-refresh', tokenType: 'Bearer' }
  const now = 20000
  const jwt = (exp: number): string => `e30.${Buffer.from(JSON.stringify({ iat: 0, exp })).toString('base64url')}.signature`
  const loginRequest = {
    appVersion: '2026.7.0',
    deviceModel: 'model-device',
    deviceUid: 'model-device-id',
    login: 'model-login',
    password: 'model-password',
    osType: 'Android',
    osVersion: '16',
    token: ''
  }

  beforeEach(() => {
    mockAuthorize.mockReset().mockResolvedValue(tokens)
    jest.spyOn(Date, 'now').mockReturnValue(now)
    global.ZenMoney = { getData: jest.fn(() => null), setData: jest.fn(), saveData: jest.fn() } as unknown as typeof ZenMoney
  })
  afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

  it('reuses an access token outside the official 10 second refresh gap', async () => {
    const stored = { ...tokens, sessionToken: jwt(31) }
    await expect(authenticate(stored, true)).resolves.toEqual(stored)
    expect(fetchMock.called()).toBe(false)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it.each([undefined, 'pwa'] as const)('refreshes within the access expiry gap with saved authorization and platform %s', async (platformType) => {
    const platform = platformType != null ? { platformType } : {}
    const stored = { ...tokens, sessionToken: jwt(29), refreshToken: jwt(100), loginRequest, ...platform }
    const url = 'https://mb.asb.by/ibanking/users/auth/refresh-token'
    fetchMock.post(url, tokens)
    await expect(authenticate(stored, true)).resolves.toEqual({ ...tokens, loginRequest, ...platform })
    expect(fetchMock.lastCall(url)?.[1]).toMatchObject({
      body: stored.refreshToken,
      headers: { Authorization: `Bearer ${stored.sessionToken}`, 'Platform-Type': platformType ?? 'mobile' }
    })
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('renews an expired refresh session through the official saved-device PIN flow in background', async () => {
    const stored = { ...tokens, sessionToken: jwt(1), refreshToken: jwt(2), loginRequest }
    const prepareUrl = 'https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN'
    const confirmUrl = 'https://mb.asb.by/ibanking/users/auth/login/model-request'
    fetchMock.post(prepareUrl, { requestId: 'model-request' })
    fetchMock.post(confirmUrl, tokens)
    await expect(authenticate(stored, true)).resolves.toEqual({ ...tokens, loginRequest })
    expect(JSON.parse(String(fetchMock.lastCall(prepareUrl)?.[1]?.body))).toEqual(loginRequest)
    expect(fetchMock.lastCall(confirmUrl)?.[1]?.body).toBe(JSON.stringify({ requestId: 'model-request' }))
    expect(fetchMock.calls(prepareUrl)).toHaveLength(1)
    expect(fetchMock.calls(confirmUrl)).toHaveLength(1)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it.each(credentialRejections)('falls back after recorded saved-device credential rejection %#', async (response) => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN', response)
    await expect(authenticate({ ...tokens, refreshToken: jwt(1), loginRequest }, false)).resolves.toEqual(tokens)
    expect(mockAuthorize).toHaveBeenCalledWith(false, expect.any(Function))
  })

  it('keeps the recorded generic PIN failure reportable without starting another login attempt', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN', unknownPinFailure)
    const error = await authenticate({ ...tokens, refreshToken: jwt(1), loginRequest }, false).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('keeps the recorded empty refresh failure reportable even with saved-device credentials', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', unknownRefreshFailure)
    await expect(authenticate({ ...tokens, loginRequest }, false)).rejects.toBeInstanceOf(Error)
    expect(mockAuthorize).not.toHaveBeenCalled()
    expect(fetchMock.called('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN')).toBe(false)
  })

  it.each(['preparation', 'confirmation'])('keeps an unknown PIN %s failure reportable without cold fallback', async (stage) => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN', stage === 'preparation'
      ? { status: 400, body: { errorInfo: {} } }
      : { requestId: 'model-request' })
    if (stage === 'confirmation') fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/model-request', { status: 503, body: {} })
    const error = await authenticate({ ...tokens, refreshToken: jwt(1), loginRequest }, true).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('does not send confirmation for a malformed PIN preparation response', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN', {})
    await expect(authenticate({ ...tokens, refreshToken: jwt(1), loginRequest }, false)).rejects.toBeInstanceOf(Error)
    expect(fetchMock.calls('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN')).toHaveLength(1)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('preserves a saved-device transport failure without retries or cold fallback', async () => {
    const error = new Error('[NER] Model saved-device transport failure')
    const url = 'https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN'
    fetchMock.post(url, { throws: error })
    await expect(authenticate({ ...tokens, refreshToken: jwt(1), loginRequest }, false)).rejects.toBe(error)
    expect(fetchMock.calls(url)).toHaveLength(1)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('rejects malformed saved-device token rotation without replacing persisted authorization', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN', { requestId: 'model-request' })
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/model-request', { token: 'model-incomplete-session' })
    const persist = jest.fn()
    await expect(authenticate({ ...tokens, refreshToken: jwt(1), loginRequest }, false, persist)).rejects.toBeInstanceOf(Error)
    expect(persist).not.toHaveBeenCalled()
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('keeps the captured login request only after successful cold authorization', async () => {
    const { token, ...webLoginRequest } = loginRequest
    mockAuthorize.mockResolvedValue({ ...tokens, loginRequest: webLoginRequest, platformType: 'pwa' })
    await expect(authenticate(null, false)).resolves.toEqual({ ...tokens, loginRequest: webLoginRequest, platformType: 'pwa' })
  })

  it('persists captured cold authorization before a subsequent WebView cleanup failure', async () => {
    const { scrape } = jest.requireActual<typeof import('../index')>('../index')
    const saved = { ...tokens, loginRequest, platformType: 'pwa' }
    const error = new Error('Model WebView cleanup failure after authorization')
    mockAuthorize.mockImplementation(async (_background: boolean, onAuthorized: (value: unknown) => void) => {
      onAuthorized(saved)
      expect(ZenMoney.setData).toHaveBeenCalledWith('belarusbankAuth', saved)
      expect(ZenMoney.saveData).toHaveBeenCalled()
      throw error
    })
    await expect(scrape({ preferences: {}, fromDate: new Date(0), isFirstRun: true, isInBackground: false })).rejects.toBe(error)
    expect(fetchMock.called()).toBe(false)
  })

  it('invalidates rejected saved credentials before background cold auth stops', async () => {
    const { scrape } = jest.requireActual<typeof import('../index')>('../index')
    const stored = { ...tokens, refreshToken: jwt(1), loginRequest }
    ZenMoney.getData = jest.fn((key: string) => key === 'belarusbankAuth' ? stored : undefined) as typeof ZenMoney.getData
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN', credentialRejections[1])
    const error = new UserInteractionError()
    mockAuthorize.mockRejectedValue(error)
    await expect(scrape({ preferences: {}, fromDate: new Date(0), isFirstRun: false, isInBackground: true })).rejects.toBe(error)
    expect(ZenMoney.setData).toHaveBeenCalledWith('belarusbankAuth', { ...tokens, refreshToken: stored.refreshToken })
    expect(ZenMoney.saveData).toHaveBeenCalled()
    expect(fetchMock.calls('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN')).toHaveLength(1)
  })

  it('logs only numeric token lifetimes from successful authorization', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    const result = { sessionToken: jwt(300), refreshToken: jwt(600), tokenType: 'Bearer', loginRequest }
    mockAuthorize.mockResolvedValue(result)
    await expect(authenticate(null, false)).resolves.toEqual(result)
    expect(log).toHaveBeenCalledWith('[auth/cold] Token lifetime in seconds', { access: 300, refresh: 600 })
    const output = JSON.stringify(log.mock.calls)
    for (const secret of [result.sessionToken, result.refreshToken, loginRequest.login, loginRequest.password, loginRequest.deviceUid]) {
      expect(output).not.toContain(secret)
    }
  })

  it('persists renewed saved-device tokens before a downstream loading failure', async () => {
    const { scrape } = jest.requireActual<typeof import('../index')>('../index')
    const stored = { ...tokens, refreshToken: jwt(1), loginRequest }
    ZenMoney.getData = jest.fn((key: string) => key === 'belarusbankAuth' ? stored : undefined) as typeof ZenMoney.getData
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/preparation?loginMode=PIN', { requestId: 'model-request' })
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/login/model-request', tokens)
    const error = new Error('Model product loading failure')
    for (const path of ['cards', 'accounts', 'deposits', 'credits']) {
      fetchMock.get(`https://mb.asb.by/ibanking/${path}?ibState=VISIBLE&refresh=true`, () => {
        expect(ZenMoney.setData).toHaveBeenCalledWith('belarusbankAuth', { ...tokens, loginRequest })
        expect(ZenMoney.saveData).toHaveBeenCalled()
        throw error
      })
    }
    await expect(scrape({ preferences: { login: 'changed-login', password: 'changed-password' }, fromDate: new Date(0), isFirstRun: false, isInBackground: true })).rejects.toBe(error)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('fails visibly when the card/account linking request fails [model]', async () => {
    // A failed source needed to consolidate balances cannot become a successful partial graph.
    const { getProducts } = jest.requireActual<typeof import('../api')>('../api')
    for (const path of ['cards', 'deposits', 'credits']) fetchMock.get(`https://mb.asb.by/ibanking/${path}?ibState=VISIBLE&refresh=true`, {})
    fetchMock.get('https://mb.asb.by/ibanking/accounts?ibState=VISIBLE&refresh=true', { accounts: [{ productId: 'model-account', contractNumber: 'model-contract' }] })
    fetchMock.get('https://mb.asb.by/ibanking/cards?contractNumber=model-contract', { status: 503, body: {} })
    const error = await getProducts(tokens).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })

  it('delegates missing persisted authorization to the official interactive flow', async () => {
    await expect(authenticate(null, false)).resolves.toEqual(tokens)
    expect(mockAuthorize).toHaveBeenCalledWith(false, expect.any(Function))
    expect(fetchMock.called()).toBe(false)
  })

  it('refreshes a compatible legacy session independently of preference credentials', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { token: 'model-rotated', refreshToken: 'model-rotated-refresh', tokenType: 'Bearer' })
    await expect(authenticate({ login: 'legacy-login', ...tokens }, true)).resolves.toEqual({
      sessionToken: 'model-rotated', refreshToken: 'model-rotated-refresh', tokenType: 'Bearer'
    })
    expect(mockAuthorize).not.toHaveBeenCalled()
    const request = fetchMock.lastCall()?.[1]
    expect(request?.headers).toMatchObject({ Authorization: 'Bearer model-session' })
    expect(request?.body).toBe(tokens.refreshToken)
    expect(fetchMock.calls('https://mb.asb.by/ibanking/users/auth/refresh-token')).toHaveLength(1)
  })

  it.each([false, true])('reuses an unexpired access token without refreshing (background: %s)', async (isInBackground) => {
    const saved = { ...tokens, sessionToken: jwt((now + 10000) / 1000) }
    await expect(authenticate(saved, isInBackground)).resolves.toEqual(saved)
    expect(fetchMock.called()).toBe(false)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('keeps using a valid access token even when the refresh token has expired', async () => {
    const saved = { ...tokens, sessionToken: jwt((now + 60000) / 1000), refreshToken: jwt((now - 1000) / 1000) }
    await expect(authenticate(saved, true)).resolves.toEqual(saved)
    expect(fetchMock.called()).toBe(false)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it.each([-1000, 0, 1000, 9000])('refreshes an access token expiring in %s ms with its authorization header', async (remaining) => {
    const saved = { ...tokens, sessionToken: jwt((now + remaining) / 1000), refreshToken: jwt((now + 60000) / 1000) }
    const renewed = { sessionToken: jwt((now + 120000) / 1000), refreshToken: jwt((now + 180000) / 1000), tokenType: 'Bearer' }
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', {
      token: renewed.sessionToken, refreshToken: renewed.refreshToken, tokenType: renewed.tokenType
    })
    await expect(authenticate(saved, true)).resolves.toEqual(renewed)
    expect(fetchMock.lastCall()?.[1]).toMatchObject({
      body: saved.refreshToken,
      headers: { Authorization: `Bearer ${saved.sessionToken}` }
    })
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('persists rotated tokens before an actual downstream request fails', async () => {
    const { scrape } = jest.requireActual<typeof import('../index')>('../index')
    const saved = { ...tokens, sessionToken: jwt((now - 1000) / 1000) }
    const renewed = { ...tokens, sessionToken: jwt((now + 60000) / 1000), refreshToken: 'model-rotated-refresh' }
    const data = new Map<string, unknown>([['belarusbankAuth', saved]])
    ZenMoney.getData = jest.fn((key: string) => data.get(key)) as typeof ZenMoney.getData
    ZenMoney.setData = jest.fn((key: string, value: unknown) => { data.set(key, value) })
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', renewed)
    const error = new Error('Model product fetch failure after rotation')
    fetchMock.get('https://mb.asb.by/ibanking/cards?ibState=VISIBLE&refresh=true', () => {
      expect(data.get('belarusbankAuth')).toEqual(renewed)
      expect(ZenMoney.saveData).toHaveBeenCalled()
      throw error
    })
    for (const path of ['accounts', 'deposits', 'credits']) {
      fetchMock.get(`https://mb.asb.by/ibanking/${path}?ibState=VISIBLE&refresh=true`, {})
    }
    await expect(scrape({
      preferences: { login: 'changed-login', password: 'changed-password' },
      fromDate: new Date('2026-10-01T00:00:00Z'),
      isFirstRun: false,
      isInBackground: true
    })).rejects.toBe(error)
    expect(data.get('belarusbankAuth')).toEqual(renewed)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('starts cold authentication when the saved refresh JWT has expired', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(2000)
    try {
      await expect(authenticate({ ...tokens, refreshToken: 'e30.eyJleHAiOjF9.signature' }, false)).resolves.toEqual(tokens)
      expect(mockAuthorize).toHaveBeenCalledWith(false, expect.any(Function))
      expect(fetchMock.called()).toBe(false)
    } finally { jest.restoreAllMocks() }
  })

  it.each([400, 401, 403, 503])('keeps an unclassified refresh HTTP %s reportable without cold fallback', async (status) => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { status, body: {} })
    const error = await authenticate(tokens, false).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toHaveProperty('message', expect.stringContaining('[auth/hot]'))
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it.each(['Model transport failure', 'ECONNRESET', '[NER]'])('preserves the original refresh transport error: %s', async (message) => {
    const error = new Error(message)
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { throws: error })
    await expect(authenticate(tokens, false)).rejects.toBe(error)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('rejects incomplete successful refresh data without replacing it with old tokens', async () => {
    fetchMock.post('https://mb.asb.by/ibanking/users/auth/refresh-token', { token: 'model-new-session' })
    await expect(authenticate(tokens, false)).rejects.toBeInstanceOf(Error)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('keeps incomplete successful browser authorization reportable', async () => {
    mockAuthorize.mockResolvedValue({ sessionToken: 'model-incomplete' })
    const error = await authenticate(null, false).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toHaveProperty('message', expect.stringContaining('[auth/cold]'))
    expect(error).toHaveProperty('message', expect.not.stringContaining('model-incomplete'))
  })

  it('passes the background guard through unchanged for incompatible saved state', async () => {
    const error = new UserInteractionError()
    mockAuthorize.mockRejectedValue(error)
    await expect(authenticate({ sessionToken: 'model-incomplete' }, true)).rejects.toBe(error)
    expect(mockAuthorize).toHaveBeenCalledWith(true, expect.any(Function))
    expect(fetchMock.called()).toBe(false)
  })
})
