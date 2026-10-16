import { readFileSync } from 'fs'
import { join } from 'path'
import { InvalidLoginOrPasswordError, TemporaryError, UserInteractionError } from '../../../errors'
import { Auth, Preferences } from '../models'

jest.mock('../fetchApi', () => ({ refreshToken: jest.fn(), fetchClientAuthorization: jest.fn(), fetchAuthorizationPage: jest.fn(), submitCredentials: jest.fn(), fetchPushStatus: jest.fn(), confirmLogin: jest.fn(), exchangeToken: jest.fn(), fetchClientId: jest.fn() }))
jest.mock('../../../common/utils', () => ({ delay: jest.fn(async () => {}) }))
jest.mock('uuid', () => ({ v4: () => 'fixture-state' }))
const transport: typeof import('../fetchApi') = jest.requireMock('../fetchApi')
const { authenticate }: typeof import('../api') = jest.requireActual('../api')

// Bank HTML and rejection codes were captured on 2026-10-07; opaque token placeholders model persistence.
describe('MyAmeria authorization transitions', () => {
  const preferences: Preferences = { login: 'fixture-user', password: 'fixture-password' }
  const stored: Auth = { accessToken: 'old-access', refreshToken: 'old-refresh', clientAuth: 'old-client-auth', clientId: 'old-client', expiresAt: 1 }
  const responses: { token: unknown, pending: unknown, accepted: unknown, refused: unknown } = JSON.parse(readFileSync(join(__dirname, 'fixtures/auth/responses.json'), 'utf8'))
  const login = readFileSync(join(__dirname, 'fixtures/auth/login.html'), 'utf8')
  const push = readFileSync(join(__dirname, 'fixtures/auth/push.html'), 'utf8')
  const wrongPassword = readFileSync(join(__dirname, 'fixtures/auth/wrong-password.html'), 'utf8')

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1791378000000)
    Object.defineProperty(global, 'ZenMoney', { value: { alert: jest.fn(async () => {}) }, configurable: true })
    jest.mocked(transport.refreshToken).mockResolvedValue({ kind: 'token', token: responses.token })
    jest.mocked(transport.fetchClientAuthorization).mockResolvedValue('current-client-auth')
    jest.mocked(transport.fetchAuthorizationPage).mockResolvedValue(login)
    jest.mocked(transport.submitCredentials).mockResolvedValue(push)
    jest.mocked(transport.fetchPushStatus).mockResolvedValue(responses.accepted)
    jest.mocked(transport.confirmLogin).mockResolvedValue('https://myameria.am/#code=fixture-code&state=fixture-state')
    jest.mocked(transport.exchangeToken).mockResolvedValue(responses.token)
    jest.mocked(transport.fetchClientId).mockResolvedValue('discovered-client')
  })

  afterEach(() => { jest.resetAllMocks(); jest.restoreAllMocks(); Reflect.deleteProperty(global, 'ZenMoney') })

  it('preserves working saved authorization despite changed preferences in the background', async () => {
    const persist = jest.fn(async () => {})
    const result = await authenticate({ login: 'изменённый', password: 'новый пароль' }, stored, persist, true)
    expect(result).toEqual({ ...stored, accessToken: 'fixture-access_token', refreshToken: 'fixture-refresh_token', expiresAt: 1791378900000 })
    expect(transport.refreshToken).toHaveBeenCalledWith({ refreshToken: stored.refreshToken, clientAuth: stored.clientAuth, clientId: stored.clientId })
    expect(transport.submitCredentials).not.toHaveBeenCalled()
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('stops a missing-session background run before initiating bank interaction', async () => {
    const persist = jest.fn(async () => {})
    await expect(authenticate(preferences, {}, persist, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(transport.submitCredentials).not.toHaveBeenCalled()
    expect(transport.exchangeToken).not.toHaveBeenCalled()
    expect(persist).not.toHaveBeenCalled()
  })

  it('stops a rejected-refresh background run before sending push', async () => {
    jest.mocked(transport.refreshToken).mockResolvedValue({ kind: 'rejected' })
    await expect(authenticate(preferences, stored, async () => {}, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(transport.submitCredentials).not.toHaveBeenCalled()
  })

  it('uses current credentials after a confirmed refresh rejection and persists both auth updates', async () => {
    jest.mocked(transport.refreshToken).mockResolvedValue({ kind: 'rejected' })
    jest.mocked(transport.fetchPushStatus).mockResolvedValueOnce(responses.pending).mockResolvedValueOnce(responses.accepted)
    const persist = jest.fn(async () => {})
    const result = await authenticate(preferences, stored, persist, false)
    expect(transport.submitCredentials).toHaveBeenCalledWith(expect.any(String), preferences, expect.any(String))
    expect(transport.confirmLogin).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'fixture-push-session' }), expect.any(String))
    expect(transport.exchangeToken).toHaveBeenCalledWith('fixture-code', 'current-client-auth')
    expect(persist.mock.calls).toEqual([[{ ...result, clientId: '' }], [result]])
    expect(result.clientId).toBe('discovered-client')
  })

  it('classifies the captured wrong-password response without saving tokens', async () => {
    jest.mocked(transport.submitCredentials).mockResolvedValue(wrongPassword)
    const persist = jest.fn(async () => {})
    await expect(authenticate(preferences, {}, persist, false)).rejects.toBeInstanceOf(InvalidLoginOrPasswordError)
    expect(persist).not.toHaveBeenCalled()
    expect(transport.fetchPushStatus).not.toHaveBeenCalled()
  })

  it('classifies a captured refused push without submitting the confirmation', async () => {
    jest.mocked(transport.fetchPushStatus).mockResolvedValue(responses.refused)
    await expect(authenticate(preferences, {}, async () => {}, false)).rejects.toBeInstanceOf(TemporaryError)
    expect(transport.confirmLogin).not.toHaveBeenCalled()
  })

  // Model unknown failures and persistence ordering independently of bank response interpretation.
  it('[model] propagates transient hot-auth failures without starting cold auth', async () => {
    const failure = new Error('Modeled refresh network failure')
    jest.mocked(transport.refreshToken).mockRejectedValue(failure)
    const persist = jest.fn(async () => {})
    await expect(authenticate(preferences, stored, persist, false)).rejects.toBe(failure)
    expect(transport.submitCredentials).not.toHaveBeenCalled()
    expect(persist).not.toHaveBeenCalled()
  })

  it('[model] preserves issued tokens when later client discovery fails', async () => {
    const failure = new Error('Modeled client discovery failure')
    jest.mocked(transport.fetchClientId).mockRejectedValue(failure)
    const persist = jest.fn(async () => {})
    await expect(authenticate(preferences, {}, persist, false)).rejects.toBe(failure)
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ refreshToken: 'fixture-refresh_token', clientId: '' }))
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('[model] rejects unusable token candidates without replacing valid state', async () => {
    jest.mocked(transport.refreshToken).mockResolvedValue({ kind: 'token', token: {} })
    const persist = jest.fn(async () => {})
    await expect(authenticate(preferences, stored, persist, false)).rejects.toThrow()
    expect(persist).not.toHaveBeenCalled()
    expect(transport.submitCredentials).not.toHaveBeenCalled()
  })

  it('[model] resumes client discovery using tokens saved before an earlier discovery failure', async () => {
    const persist = jest.fn(async () => {})
    const result = await authenticate(preferences, { ...stored, clientId: '' }, persist, true)
    expect(result.clientId).toBe('discovered-client')
    expect(persist).toHaveBeenCalledTimes(2)
    expect(transport.submitCredentials).not.toHaveBeenCalled()
  })

  it('[model] stops unknown push states without confirming or saving tokens', async () => {
    jest.mocked(transport.fetchPushStatus).mockResolvedValue({ status: 'success', data: { sessionStatus: 'unrecognized-model-state' } })
    const persist = jest.fn(async () => {})
    await expect(authenticate(preferences, {}, persist, false)).rejects.toThrow()
    expect(transport.confirmLogin).not.toHaveBeenCalled()
    expect(persist).not.toHaveBeenCalled()
  })

  it('[model] preserves a polling transport failure without retrying or confirming', async () => {
    const failure = new Error('Modeled push transport failure')
    jest.mocked(transport.fetchPushStatus).mockRejectedValue(failure)
    await expect(authenticate(preferences, {}, async () => {}, false)).rejects.toBe(failure)
    expect(transport.fetchPushStatus).toHaveBeenCalledTimes(1)
    expect(transport.confirmLogin).not.toHaveBeenCalled()
  })

  it('[model] terminates pending polling after the local attempt limit', async () => {
    jest.mocked(transport.fetchPushStatus).mockResolvedValue(responses.pending)
    await expect(authenticate(preferences, {}, async () => {}, false)).rejects.toThrow()
    expect(transport.fetchPushStatus).toHaveBeenCalledTimes(40)
    expect(transport.confirmLogin).not.toHaveBeenCalled()
  })

  it('[model] treats incomplete legacy state as requiring a new foreground login', async () => {
    const result = await authenticate(preferences, { refreshToken: 'legacy-incomplete' }, async () => {}, false)
    expect(transport.refreshToken).not.toHaveBeenCalled()
    expect(transport.submitCredentials).toHaveBeenCalledWith(expect.any(String), preferences, expect.any(String))
    expect(result.clientId).toBe('discovered-client')
  })

  it('[model] refuses a token with a different nonce without overwriting state', async () => {
    jest.mocked(transport.exchangeToken).mockResolvedValue({ ...responses.token as object, id_token: 'e30.eyJub25jZSI6ImRpZmZlcmVudCJ9.signature' })
    const persist = jest.fn(async () => {})
    await expect(authenticate(preferences, {}, persist, false)).rejects.toThrow()
    expect(persist).not.toHaveBeenCalled()
  })
})
