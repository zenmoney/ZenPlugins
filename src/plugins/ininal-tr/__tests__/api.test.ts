import fetchMock from 'fetch-mock'
import { IninalApi } from '../api'
import { InvalidOtpCodeError, UserInteractionError, ZPAPIError } from '../../../errors'

const api = new IninalApi({
  baseUrl: 'https://api.ininal.com/', anonymousToken: 'test-anonymous', authDeviceName: 'test-device', userAgent: 'test-agent'
})
const preferences = { login: '+900000000000', password: '000000' }

beforeEach(() => {
  global.ZenMoney = { readLine: jest.fn() } as unknown as typeof ZenMoney
  fetchMock.catch({ throws: new Error('Unexpected model request') })
})
afterEach(() => {
  fetchMock.restore()
  jest.restoreAllMocks()
})

describe('[model] authentication safeguards', () => {
  // Local state and injected transport errors do not establish bank protocol states.
  it('stops background cold login before requests can initiate a challenge', async () => {
    await expect(api.login(preferences, true)).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetchMock.calls()).toEqual({ matched: [], unmatched: [] })
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('preserves the session and original transport failure without cold login', async () => {
    const session = { deviceId: 'test-device', userId: 'test-user', accessToken: 'test-access' }
    const failure = new Error('Model transport failure')
    fetchMock.getOnce('https://api.ininal.com/v3.0/users/test-user', { throws: failure })
    await expect(api.login({ ...preferences, password: 'changed' }, false, session)).rejects.toBe(failure)
    expect(session.accessToken).toBe('test-access')
    expect(fetchMock.calls('https://api.ininal.com/v3.0/users/test-user')).toHaveLength(1)
  })

  it('rejects absent required OTP before verification and uses a Turkish prompt', async () => {
    // Model validated internal auth results, without manufacturing bank responses.
    jest.spyOn(api as unknown as { authSignin: () => Promise<string> }, 'authSignin').mockResolvedValue('test-confirmation')
    jest.spyOn(api as unknown as {
      authCheckPassword: () => Promise<{ authToken: null, userId: string, needOtp: boolean }>
    }, 'authCheckPassword').mockResolvedValue({ authToken: null, userId: 'test-user', needOtp: true })
    jest.mocked(ZenMoney.readLine).mockResolvedValue(null)
    await expect(api.login(preferences, false)).rejects.toBeInstanceOf(InvalidOtpCodeError)
    expect(ZenMoney.readLine).toHaveBeenCalledWith('SMS doğrulama kodunu girin', undefined)
    expect(fetchMock.calls()).toEqual({ matched: [], unmatched: [] })
  })

  it('keeps an unsupported auth outcome reportable', async () => {
    // The internal workflow has no valid continuation; no credential rejection is inferred.
    jest.spyOn(api as unknown as { authSignin: () => Promise<string> }, 'authSignin').mockResolvedValue('test-confirmation')
    jest.spyOn(api as unknown as {
      authCheckPassword: () => Promise<{ authToken: null, userId: string, needOtp: boolean }>
    }, 'authCheckPassword').mockResolvedValue({ authToken: null, userId: 'test-user', needOtp: false })
    const failure: unknown = await api.login(preferences, false).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(Error)
    expect(failure).not.toBeInstanceOf(ZPAPIError)
  })
})
