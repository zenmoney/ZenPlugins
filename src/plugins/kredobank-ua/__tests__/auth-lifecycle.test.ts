import fetchMock from 'fetch-mock'
import { UserInteractionError, ZPAPIError } from '../../../errors'
const { login }: { login: (preferences: object, auth: object, background: boolean, onAuth?: (auth: unknown) => unknown) => Promise<void> } = jest.requireActual('../api')
const { installFetchMockDeveloperFriendlyFallback }: { installFetchMockDeveloperFriendlyFallback: (mock: typeof fetchMock) => void } = jest.requireActual('../../../testUtils')

installFetchMockDeveloperFriendlyFallback(fetchMock)
const base = 'https://online.kredobank.com.ua/ibank/api'
const credentials = { login: 'model-login', password: 'model-password' }

// These models inject existing protocol states solely to verify interaction and persistence ordering.
// They do not establish new bank response classifications or financial parsing behavior.
describe('[model] Kredobank authentication lifecycle', () => {
  beforeEach(() => {
    Object.assign(global, { ZenMoney: { features: {}, device: { brand: 'Test', model: 'Device' }, readLine: jest.fn(async () => null) } })
  })

  it.each([true, false])('guards the SMS request in background mode %s', async isInBackground => {
    fetchMock.postOnce(base + '/v1/individual/light/auth/login/login-password/model-device', {
      status: 200,
      headers: { authorization: 'challenge-authorization' },
      body: { isAuthCompleted: false, userInfo: { name: 'model-user' } }
    })
    const error = new Error('SMS delivery failed')
    fetchMock.getOnce(base + '/v1/individual/light/auth/login/otp_sms/challenge?userName=model-user', { throws: error })
    const promise = login(credentials, { device: { deviceId: 'model-device' } }, isInBackground)
    if (isInBackground) await expect(promise).rejects.toBeInstanceOf(UserInteractionError)
    else await expect(promise).rejects.toBe(error)
    expect((fetchMock.calls() as unknown as { matched: unknown[] }).matched).toHaveLength(isInBackground ? 1 : 2)
  })

  it('persists the rotated token before a later session request fails', async () => {
    fetchMock.postOnce(base + '/v1/individual/light/auth/login/token/model-device', {
      status: 200, headers: { authorization: 'rotated-token' }, body: { isAuthCompleted: true }
    })
    const error = new Error('Session request failed')
    const persist = jest.fn()
    fetchMock.getOnce(base + '/v1/individual/light/auth/session', () => {
      expect(persist).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'rotated-token' }))
      throw error
    })
    await expect(login(credentials, { device: { deviceId: 'model-device' }, accessToken: 'old-token' }, false, persist)).rejects.toBe(error)
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('keeps absent OTP input reportable without sending an unchecked credential', async () => {
    fetchMock.postOnce(base + '/v1/individual/light/auth/login/login-password/model-device', {
      status: 200, headers: { authorization: 'challenge-authorization' }, body: { isAuthCompleted: false, userInfo: { name: 'model-user' } }
    })
    fetchMock.getOnce(base + '/v1/individual/light/auth/login/otp_sms/challenge?userName=model-user', { challengeId: 'model-challenge' })
    const error: unknown = await login(credentials, { device: { deviceId: 'model-device' } }, false).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect((fetchMock.calls() as unknown as { matched: unknown[] }).matched).toHaveLength(2)
    expect(ZenMoney.readLine).toHaveBeenCalledWith('Введіть код із SMS', { inputType: 'number' })
  })
})
