import fetchMock from 'fetch-mock'
import { UserInteractionError, ZPAPIError } from '../../../errors'

const mockAuthorize = jest.fn()
jest.mock('../sso', () => ({ authorizeInWebView: mockAuthorize }))
const { authenticate } = jest.requireActual<typeof import('../api')>('../api')

// Model auth lifecycle obligations; token expiry is the JWT exp used by both bank clients.
// Protocol source: by.softclub.belarusbank 2026.6.0 (versionCode 1315), installed APK,
// SHA-256 750216e42b0bc6c2e77f4229e4f1f68426f1bcc1ccd65d120dab09a145d58d6a.
// assets/public/main-ASLV23YQ.js: refreshSession + HT$2 attach the saved access token;
// checkSessionTokenExpired uses JWT exp with TOKEN_REFRESH_SAFE_GAP = 10000 ms.
// Also confirmed in https://mb.asb.by/main-MMJYJCRQ.js on 2026-10-19.
describe('authentication lifecycle [model]', () => {
  const tokens = { sessionToken: 'model-session', refreshToken: 'model-refresh', tokenType: 'Bearer' }
  const now = Date.parse('2026-10-19T12:00:00Z')
  const jwt = (expiresAt: number): string => `e30.${Buffer.from(JSON.stringify({ exp: expiresAt / 1000 })).toString('base64url')}.signature`

  beforeEach(() => {
    mockAuthorize.mockReset().mockResolvedValue(tokens)
    jest.spyOn(Date, 'now').mockReturnValue(now)
    fetchMock.catch(() => { throw new Error('Unexpected model request') })
    global.ZenMoney = { getData: jest.fn(() => null), setData: jest.fn(), saveData: jest.fn() } as unknown as typeof ZenMoney
  })
  afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

  it('delegates missing persisted authorization to the official interactive flow', async () => {
    await expect(authenticate(null, false)).resolves.toEqual(tokens)
    expect(mockAuthorize).toHaveBeenCalledWith(false)
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
    const saved = { ...tokens, sessionToken: jwt(now + 10000) }
    await expect(authenticate(saved, isInBackground)).resolves.toEqual(saved)
    expect(fetchMock.called()).toBe(false)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it('keeps using a valid access token even when the refresh token has expired', async () => {
    const saved = { ...tokens, sessionToken: jwt(now + 60000), refreshToken: jwt(now - 1000) }
    await expect(authenticate(saved, true)).resolves.toEqual(saved)
    expect(fetchMock.called()).toBe(false)
    expect(mockAuthorize).not.toHaveBeenCalled()
  })

  it.each([-1000, 0, 1000, 9000])('refreshes an access token expiring in %s ms with its authorization header', async (remaining) => {
    const saved = { ...tokens, sessionToken: jwt(now + remaining), refreshToken: jwt(now + 60000) }
    const renewed = { sessionToken: jwt(now + 120000), refreshToken: jwt(now + 180000), tokenType: 'Bearer' }
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
    const saved = { ...tokens, sessionToken: jwt(now - 1000) }
    const renewed = { ...tokens, sessionToken: jwt(now + 60000), refreshToken: 'model-rotated-refresh' }
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
      expect(mockAuthorize).toHaveBeenCalledWith(false)
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
    expect(mockAuthorize).toHaveBeenCalledWith(true)
    expect(fetchMock.called()).toBe(false)
  })
})
