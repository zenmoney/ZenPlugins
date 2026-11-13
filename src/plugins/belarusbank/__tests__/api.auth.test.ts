import fetchMock from 'fetch-mock'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, UserInteractionError, ZPAPIError } from '../../../errors'
import { APP_VERSION, type NativeAuthInput } from '../models'

const mockAuthorize = jest.fn()
jest.mock('../sso', () => ({ authorizeInWebView: mockAuthorize }))
const { authenticate } = jest.requireActual<typeof import('../api')>('../api')

// Lifecycle models, not live server captures. Request structure and transitions:
// official by.softclub.belarusbank APK 2026.6.0 (1315), downloaded 2026-10-07
// from AppGallery C118138757, SHA256 76514117D07A0195317220E672F81D62F721F8421F4B646352ACD7E6B43B3F9A.
// Packaged main-ASLV23YQ.js: backendApiService.loginPreparation/loginConfirmation,
// prepareAuthConfirmation, loginConfirmation, getLoginRequest, updateSession,
// secureStorageUtil.loginRequest/saveLoginData and AUTH_ERRORS/CONFIRMATION_ERRORS.
// Models verify state reuse, interaction guards and persistence independently of server availability.
describe('native authentication lifecycle [model]', () => {
  const base = 'https://mb.asb.by/ibanking/'
  const prepareUrl = `${base}users/auth/login/preparation`
  const pinUrl = `${prepareUrl}?loginMode=PIN`
  const confirmUrl = `${base}users/auth/login/model-request`
  const refreshUrl = `${base}users/auth/refresh-token`
  const jwt = (exp: number): string => `e30.${Buffer.from(JSON.stringify({ iat: 0, exp })).toString('base64url')}.signature`
  const tokens = { sessionToken: jwt(300), refreshToken: jwt(600), tokenType: 'Bearer' }
  const expired = { sessionToken: jwt(1), refreshToken: jwt(2), tokenType: 'Bearer' }
  const loginRequest = {
    appVersion: APP_VERSION,
    deviceModel: 'ZenMoney',
    deviceUid: 'model-device-id',
    login: 'model-login',
    password: 'model-password',
    osType: 'Android',
    osVersion: '16',
    token: ''
  }
  let input: NativeAuthInput

  beforeEach(() => {
    mockAuthorize.mockReset()
    jest.spyOn(Date, 'now').mockReturnValue(20000)
    input = { preferences: { login: 'model-login', password: 'model-password' }, deviceUid: 'model-device-id', onDeviceUid: jest.fn() }
    global.ZenMoney = { readLine: jest.fn().mockResolvedValue('123456'), getData: jest.fn(() => null), setData: jest.fn(), saveData: jest.fn() } as unknown as typeof ZenMoney
  })
  afterEach(() => {
    expect(mockAuthorize).not.toHaveBeenCalled()
    fetchMock.restore()
    jest.restoreAllMocks()
  })

  it('reuses a working session on repeated background runs despite preference changes', async () => {
    const stored = { ...tokens, loginRequest }
    const changed = { ...input, preferences: { login: 'changed-login', password: 'changed-password' } }
    const first = await authenticate(stored, true, undefined, changed)
    await expect(authenticate(first, true, undefined, changed)).resolves.toEqual(stored)
    expect(fetchMock.called()).toBe(false)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(input.onDeviceUid).not.toHaveBeenCalled()
  })

  it.each([undefined, 'pwa'] as const)('refreshes within the official 10 second access gap with platform %s', async (platformType) => {
    const platform = platformType != null ? { platformType } : {}
    const stored = { ...tokens, sessionToken: jwt(29), ...platform }
    fetchMock.post(refreshUrl, tokens)
    await expect(authenticate(stored, true)).resolves.toEqual({ ...tokens, ...platform })
    expect(fetchMock.lastCall(refreshUrl)?.[1]).toMatchObject({
      body: stored.refreshToken, headers: { Authorization: `Bearer ${stored.sessionToken}`, 'Platform-Type': platformType ?? 'mobile' }
    })
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('renews expired authorization with the saved native device without SMS', async () => {
    fetchMock.post(pinUrl, { requestId: 'model-request' })
    fetchMock.post(confirmUrl, tokens)
    await expect(authenticate({ ...expired, loginRequest }, true, undefined, input)).resolves.toEqual({ ...tokens, loginRequest })
    expect(JSON.parse(String(fetchMock.lastCall(pinUrl)?.[1]?.body))).toEqual(loginRequest)
    expect(fetchMock.lastCall(confirmUrl)?.[1]?.body).toBe(JSON.stringify({ requestId: 'model-request' }))
    expect(fetchMock.calls(pinUrl)).toHaveLength(1)
    expect(fetchMock.called(prepareUrl)).toBe(false)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('uses saved-device renewal after an explicit refresh rejection without initiating SMS', async () => {
    fetchMock.post(refreshUrl, { status: 400, body: { errorInfo: { code: 1011 } } })
    fetchMock.post(pinUrl, { requestId: 'model-request' })
    fetchMock.post(confirmUrl, tokens)
    await expect(authenticate({ ...tokens, sessionToken: jwt(1), loginRequest }, true, undefined, input))
      .resolves.toEqual({ ...tokens, loginRequest })
    expect(fetchMock.calls(refreshUrl)).toHaveLength(1)
    expect(fetchMock.calls(pinUrl)).toHaveLength(1)
    expect(fetchMock.called(prepareUrl)).toBe(false)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('migrates the legacy native device only after its saved session needs renewal', async () => {
    const stored = { ...tokens, login: 'model-login' }
    await expect(authenticate(stored, true, undefined, input)).resolves.toEqual(stored)
    fetchMock.post(pinUrl, { requestId: 'model-request' })
    fetchMock.post(confirmUrl, tokens)
    await expect(authenticate({ ...expired, login: 'model-login' }, true, undefined, input)).resolves.toEqual({ ...tokens, loginRequest })
    expect(JSON.parse(String(fetchMock.lastCall(pinUrl)?.[1]?.body))).toEqual(loginRequest)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('stops before the first SMS request in background, including expired web sessions', async () => {
    await expect(authenticate({ ...expired, platformType: 'pwa', loginRequest }, true, undefined, input)).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetchMock.called()).toBe(false)
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(input.onDeviceUid).not.toHaveBeenCalled()
  })

  it('activates natively once, persists the registered device and reuses it on the next sync', async () => {
    const persist = jest.fn()
    fetchMock.post(prepareUrl, () => {
      expect(input.onDeviceUid).toHaveBeenCalledWith('model-device-id')
      return { requestId: 'model-request', needCodeWord: true }
    })
    fetchMock.post(`${confirmUrl}?code=123456&codeWord=model-word`, tokens)
    ZenMoney.readLine = jest.fn().mockResolvedValueOnce('model-word').mockResolvedValueOnce('123456')
    const result = await authenticate(null, false, persist, input)
    expect(result).toEqual({ ...tokens, loginRequest })
    expect(persist).toHaveBeenCalledWith(result)
    expect(JSON.parse(String(fetchMock.lastCall(prepareUrl)?.[1]?.body))).toEqual(loginRequest)
    expect(fetchMock.lastCall(`${confirmUrl}?code=123456&codeWord=model-word`)?.[1]?.body)
      .toBe(JSON.stringify({ requestId: 'model-request', code: '123456', codeWord: 'model-word' }))
    await expect(authenticate(result, true, undefined, input)).resolves.toEqual(result)
    expect(fetchMock.calls(prepareUrl)).toHaveLength(1)
    expect(ZenMoney.readLine).toHaveBeenCalledTimes(2)
  })

  it('uses current credentials after saved-device rejection and retains its device UID', async () => {
    // Recorded PIN responses: logs 156874/build156, 157205/build157: AUTH_ERRORS 1011/1042.
    fetchMock.post(pinUrl, { status: 400, body: { errorInfo: { code: 1042 } } })
    fetchMock.post(prepareUrl, { requestId: 'model-request' })
    fetchMock.post(`${confirmUrl}?code=123456`, tokens)
    input.preferences = { login: 'changed-login', password: 'changed-password' }
    input.deviceUid = 'unrelated-device-id'
    const persist = jest.fn()
    await expect(authenticate({ ...expired, loginRequest }, false, persist, input)).resolves.toEqual({
      ...tokens, loginRequest: { ...loginRequest, login: 'changed-login', password: 'changed-password' }
    })
    expect(persist.mock.calls[0][0]).toEqual(expired)
    expect(input.onDeviceUid).toHaveBeenCalledWith(loginRequest.deviceUid)
  })

  it('persists rejected-device invalidation before stopping a background cold login', async () => {
    fetchMock.post(pinUrl, { status: 400, body: { errorInfo: { code: 1011 } } })
    const persist = jest.fn()
    await expect(authenticate({ ...expired, loginRequest }, true, persist, input)).rejects.toBeInstanceOf(UserInteractionError)
    expect(persist).toHaveBeenCalledWith(expired)
    expect(fetchMock.called(prepareUrl)).toBe(false)
  })

  it.each(['refresh', 'PIN'])('preserves the original %s transport failure without retry, fallback or state update', async (stage) => {
    const error = new Error('[NER] Model transport failure')
    const url = stage === 'refresh' ? refreshUrl : pinUrl
    const stored = stage === 'refresh' ? { ...tokens, sessionToken: jwt(1), loginRequest } : { ...expired, loginRequest }
    fetchMock.post(url, { throws: error })
    const persist = jest.fn()
    await expect(authenticate(stored, false, persist, input)).rejects.toBe(error)
    expect(fetchMock.calls(url)).toHaveLength(1)
    expect(persist).not.toHaveBeenCalled()
    expect(fetchMock.called(prepareUrl)).toBe(false)
  })

  it.each(['refresh', 'PIN'])('keeps an unknown %s response reportable without cold fallback', async (stage) => {
    // mail_inbound 182272/build163: refresh errorInfo {}; PIN logs 156284/build156: code1036.
    const url = stage === 'refresh' ? refreshUrl : pinUrl
    const stored = stage === 'refresh' ? { ...tokens, sessionToken: jwt(1) } : { ...expired, loginRequest }
    fetchMock.post(url, stage === 'refresh' ? { status: 400, body: { errorInfo: {} } } : { status: 400, body: { errorInfo: { code: 1036 } } })
    const error = await authenticate(stored, false, undefined, input).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(fetchMock.called(prepareUrl)).toBe(false)
  })

  it('does not confirm malformed PIN preparation or replace saved state', async () => {
    fetchMock.post(pinUrl, {})
    const persist = jest.fn()
    await expect(authenticate({ ...expired, loginRequest }, false, persist, input)).rejects.toBeInstanceOf(Error)
    expect(fetchMock.calls(pinUrl)).toHaveLength(1)
    expect(fetchMock.called(confirmUrl)).toBe(false)
    expect(persist).not.toHaveBeenCalled()
  })

  it('keeps an unknown PIN confirmation failure reportable without initiating SMS', async () => {
    fetchMock.post(pinUrl, { requestId: 'model-request' })
    fetchMock.post(confirmUrl, { status: 503, body: {} })
    const persist = jest.fn()
    const error = await authenticate({ ...expired, loginRequest }, false, persist, input).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(persist).not.toHaveBeenCalled()
    expect(fetchMock.called(prepareUrl)).toBe(false)
    expect(fetchMock.calls(confirmUrl)).toHaveLength(1)
  })

  it('keeps incomplete successful token rotation reportable', async () => {
    fetchMock.post(refreshUrl, { token: 'model-incomplete-session' })
    const persist = jest.fn()
    await expect(authenticate({ ...tokens, sessionToken: jwt(1) }, false, persist, input)).rejects.toBeInstanceOf(Error)
    expect(persist).not.toHaveBeenCalled()
    expect(fetchMock.called(prepareUrl)).toBe(false)
  })

  it.each([null, ''])('stops without sending absent required SMS input: %s', async (answer) => {
    fetchMock.post(prepareUrl, { requestId: 'model-request' })
    ZenMoney.readLine = jest.fn().mockResolvedValue(answer)
    const error = await authenticate(null, false, undefined, input).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(fetchMock.calls(prepareUrl)).toHaveLength(1)
    expect(fetchMock.called(`${confirmUrl}?code=123456`)).toBe(false)
  })

  it('classifies explicit credential rejection while leaving generic HTTP401 reportable', async () => {
    fetchMock.post(prepareUrl, { status: 400, body: { errorInfo: { code: 1011 } } })
    await expect(authenticate(null, false, undefined, input)).rejects.toBeInstanceOf(InvalidLoginOrPasswordError)
    fetchMock.restore()
    fetchMock.post(prepareUrl, { status: 401, body: {} })
    const error = await authenticate(null, false, undefined, input).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })

  it.each([5004, 1007])('classifies the official incorrect/expired SMS code %s', async (code) => {
    fetchMock.post(prepareUrl, { requestId: 'model-request' })
    fetchMock.post(`${confirmUrl}?code=123456`, { status: 400, body: { errorInfo: { code } } })
    await expect(authenticate(null, false, undefined, input)).rejects.toBeInstanceOf(InvalidOtpCodeError)
  })

  it.each(['cold', 'refresh', 'PIN'])('persists confirmed %s authorization before downstream product loading fails', async (stage) => {
    const { scrape } = jest.requireActual<typeof import('../index')>('../index')
    const data = new Map<string, unknown>([['belarusbankDeviceUid', 'model-device-id']])
    if (stage !== 'cold') data.set('belarusbankAuth', { ...(stage === 'PIN' ? expired : { ...tokens, sessionToken: jwt(1) }), loginRequest })
    ZenMoney.getData = jest.fn((key: string) => data.get(key)) as typeof ZenMoney.getData
    ZenMoney.setData = jest.fn((key: string, value: unknown) => data.set(key, value))
    if (stage === 'cold') {
      fetchMock.post(prepareUrl, () => {
        expect(data.get('belarusbankDeviceUid')).toBe('model-device-id')
        expect(ZenMoney.saveData).toHaveBeenCalled()
        return { requestId: 'model-request' }
      })
      fetchMock.post(`${confirmUrl}?code=123456`, tokens)
    } else if (stage === 'PIN') {
      fetchMock.post(pinUrl, { requestId: 'model-request' })
      fetchMock.post(confirmUrl, tokens)
    } else fetchMock.post(refreshUrl, tokens)
    const error = new Error('Model product loading failure')
    for (const path of ['cards', 'accounts', 'deposits', 'credits']) {
      fetchMock.get(`${base}${path}?ibState=VISIBLE&refresh=true`, () => {
        expect(data.get('belarusbankAuth')).toEqual({ ...tokens, loginRequest })
        expect(ZenMoney.saveData).toHaveBeenCalled()
        throw error
      })
    }
    await expect(scrape({ preferences: input.preferences, fromDate: new Date(0), isFirstRun: true, isInBackground: false })).rejects.toBe(error)
    expect(data.get('belarusbankAuth')).toEqual({ ...tokens, loginRequest })
  })

  it('logs token lifetimes without tokens or registered-device credentials', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    fetchMock.post(prepareUrl, { requestId: 'model-request' })
    fetchMock.post(`${confirmUrl}?code=123456`, tokens)
    await authenticate(null, false, undefined, input)
    expect(log).toHaveBeenCalledWith('[auth/cold] Token lifetime in seconds', { access: 300, refresh: 600 })
    const output = JSON.stringify(log.mock.calls)
    for (const secret of [tokens.sessionToken, tokens.refreshToken, loginRequest.login, loginRequest.password, loginRequest.deviceUid]) expect(output).not.toContain(secret)
  })

  it('fails visibly when the card/account linking request fails', async () => {
    // A failed source needed to consolidate balances cannot become a successful partial graph.
    const { getProducts } = jest.requireActual<typeof import('../api')>('../api')
    for (const path of ['cards', 'deposits', 'credits']) fetchMock.get(`${base}${path}?ibState=VISIBLE&refresh=true`, {})
    fetchMock.get(`${base}accounts?ibState=VISIBLE&refresh=true`, { accounts: [{ productId: 'model-account', contractNumber: 'model-contract' }] })
    fetchMock.get(`${base}cards?contractNumber=model-contract`, { status: 503, body: {} })
    const error = await getProducts(tokens).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })
})
