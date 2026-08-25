import SHA256 from 'crypto-js/sha256'
import {
  InvalidLoginOrPasswordError,
  InvalidOtpCodeError,
  TemporaryError,
  UserInteractionError,
  ZPAPIError
} from '../../../errors'

const mockFetchJson = jest.fn()

jest.mock('../../../common/network', () => ({ fetchJson: mockFetchJson }))

const api = require('../api')

const credentials = { login: '+380991112233', password: 'password' }
const device = {
  deviceId: '11111111-2222-4333-8444-555555555555',
  screenResolution: '1080x2400',
  model: 'SM-S928B',
  manufacturer: 'samsung',
  os: 'Android 15'
}

function response (body, status = 200, headers = {}) {
  return { ok: status >= 200 && status < 300, status, headers, body }
}

function storedAuth () {
  return {
    schemaVersion: 1,
    loginHash: SHA256(credentials.login).toString(),
    device,
    authorization: 'stored-authorization',
    refreshToken: 'stored-refresh-token',
    tokenValidUntil: Date.now() + 600000,
    dossierId: null
  }
}

async function captureError (promise) {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('Expected promise to reject')
}

describe('UKRSIB online 2.0 authorization', () => {
  beforeEach(() => {
    global.ZenMoney = {
      device: {},
      readLine: jest.fn(async () => '123456')
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('uses persisted authorization through the refresh endpoint', async () => {
    mockFetchJson.mockResolvedValueOnce(response(undefined, 200, {
      authorization: 'new-authorization',
      refreshtoken: 'new-refresh-token',
      tokenvalidfor: '600000'
    })).mockResolvedValueOnce(response({ actions: [] }))

    const session = await api.login(credentials, false, { auth: storedAuth() })

    expect(mockFetchJson).toHaveBeenCalledTimes(2)
    expect(mockFetchJson.mock.calls[0][0]).toMatch(/\/auth\/refreshtoken$/)
    expect(mockFetchJson.mock.calls[0][1].headers).toMatchObject({
      authorization: 'stored-authorization',
      RefreshToken: 'stored-refresh-token',
      clientVersion: '2.264.0'
    })
    expect(session.authState).toMatchObject({
      authorization: 'new-authorization',
      refreshToken: 'new-refresh-token'
    })
  })

  it('falls back to cold authorization only after a confirmed hot-auth rejection', async () => {
    mockFetchJson
      .mockResolvedValueOnce(response({ errorCode: '2050' }, 401))
      .mockResolvedValueOnce(response(undefined, 200, { authorization: 'verify-authorization' }))
      .mockResolvedValueOnce(response(undefined, 200, {
        authorization: 'login-authorization',
        refreshtoken: 'login-refresh-token'
      }))
      .mockResolvedValueOnce(response({ actions: [] }))

    const session = await api.login(credentials, false, { auth: storedAuth() })

    expect(mockFetchJson.mock.calls.map(call => call[0])).toEqual([
      'https://online.ukrsibbank.com/clientendpoint/auth/refreshtoken',
      'https://online.ukrsibbank.com/clientendpoint/auth/verify-app',
      'https://online.ukrsibbank.com/clientendpoint/auth/login',
      'https://online.ukrsibbank.com/clientendpoint/profile/postlogin-actions/mandatory'
    ])
    expect(session.authState.authorization).toBe('login-authorization')
  })

  it('preserves an unknown transport failure and does not start cold authorization', async () => {
    const transportError = new Error('socket failed')
    mockFetchJson.mockRejectedValueOnce(transportError)

    await expect(api.login(credentials, false, { auth: storedAuth() })).rejects.toBe(transportError)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })

  it('keeps an unknown server state as an ordinary reportable error', async () => {
    mockFetchJson.mockResolvedValueOnce(response({ errorCode: 'UNKNOWN_AUTH_STATE' }, 401))

    const error = await captureError(api.login(credentials, false, { auth: storedAuth() }))

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error.message).toContain('UKRSIB API request failed')
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })

  it('stops a background cold flow before the login request that initiates OTP', async () => {
    mockFetchJson.mockResolvedValueOnce(response(undefined, 200, { authorization: 'verify-authorization' }))

    const error = await captureError(api.login(credentials, true, {}))

    expect(error).toBeInstanceOf(UserInteractionError)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
    expect(mockFetchJson.mock.calls[0][0]).toMatch(/\/auth\/verify-app$/)
  })

  it('continues the foreground login with OTP headers', async () => {
    mockFetchJson
      .mockResolvedValueOnce(response(undefined, 200, { authorization: 'verify-authorization' }))
      .mockResolvedValueOnce(response({
        errorCode: 'OTP_REQUIRED',
        errorData: { otpId: 'otp-identifier', expiredTimeout: 90, otpLength: 6 }
      }, 401))
      .mockResolvedValueOnce(response(undefined, 200, {
        authorization: 'login-authorization',
        refreshtoken: 'login-refresh-token'
      }))
      .mockResolvedValueOnce(response({ actions: [] }))

    await expect(api.login(credentials, false, {})).resolves.toMatchObject({
      authState: {
        authorization: 'login-authorization',
        refreshToken: 'login-refresh-token'
      }
    })
    expect(ZenMoney.readLine).toHaveBeenCalledWith(expect.stringContaining('Введіть код'), {
      inputType: 'number',
      time: 90000
    })
    expect(mockFetchJson.mock.calls[2][1].headers).toMatchObject({
      otpId: 'otp-identifier',
      otpValue: '123456'
    })
  })

  it('classifies a confirmed rejected OTP as InvalidOtpCodeError', async () => {
    mockFetchJson
      .mockResolvedValueOnce(response(undefined, 200, { authorization: 'verify-authorization' }))
      .mockResolvedValueOnce(response({
        errorCode: '2020',
        errorData: { otpId: 'otp-identifier', expiredTimeout: 90, otpLength: 6 }
      }, 401))
      .mockResolvedValueOnce(response({
        errorCode: '2021',
        errorData: { otpId: 'otp-identifier', expiredTimeout: 90, otpLength: 6 }
      }, 401))

    const error = await captureError(api.login(credentials, false, {}))

    expect(error).toBeInstanceOf(InvalidOtpCodeError)
  })

  it('classifies the confirmed login error code as InvalidLoginOrPasswordError', async () => {
    mockFetchJson
      .mockResolvedValueOnce(response(undefined, 200, { authorization: 'verify-authorization' }))
      .mockResolvedValueOnce(response({
        description: 'Ви ввели неправильний пароль. Будь ласка, спробуйте ще раз.',
        errorCode: '2071',
        errorData: {
          message: 'wrong user credentials',
          type: 'MESSAGE'
        }
      }, 406))

    const error = await captureError(api.login(credentials, false, {}))

    expect(error).toBeInstanceOf(InvalidLoginOrPasswordError)
    expect(error.message).toBe('Неправильний номер телефону або пароль')
  })

  it('keeps a nearby login error reportable even when its text mentions wrong credentials', async () => {
    mockFetchJson
      .mockResolvedValueOnce(response(undefined, 200, { authorization: 'verify-authorization' }))
      .mockResolvedValueOnce(response({
        description: 'Ви ввели неправильний пароль. Будь ласка, спробуйте ще раз.',
        errorCode: '2072',
        errorData: {
          message: 'wrong user credentials',
          type: 'MESSAGE'
        }
      }, 406))

    const error = await captureError(api.login(credentials, false, {}))

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error.message).toContain('UKRSIB API request failed')
  })

  it.each([
    ['MUST_SET_PASSWORD', 'Відкрийте застосунок UKRSIB online 2.0 та встановіть новий пароль, потім повторіть синхронізацію.'],
    ['SHOULD_UPDATE_EMAIL', 'Відкрийте застосунок UKRSIB online 2.0 та додайте або оновіть email, потім повторіть синхронізацію.']
  ])('provides the exact next action for confirmed post-login state %s', async (action, message) => {
    mockFetchJson
      .mockResolvedValueOnce(response(undefined, 200, {
        authorization: 'new-authorization',
        refreshtoken: 'new-refresh-token'
      }))
      .mockResolvedValueOnce(response({ actions: [action] }))

    const error = await captureError(api.login(credentials, false, { auth: storedAuth() }))

    expect(error).toBeInstanceOf(TemporaryError)
    expect(error.message).toBe(message)
  })

  it('keeps an unknown post-login action reportable', async () => {
    mockFetchJson
      .mockResolvedValueOnce(response(undefined, 200, {
        authorization: 'new-authorization',
        refreshtoken: 'new-refresh-token'
      }))
      .mockResolvedValueOnce(response({ actions: ['NEW_UNKNOWN_ACTION'] }))

    const error = await captureError(api.login(credentials, false, { auth: storedAuth() }))

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error.message).toContain('UKRSIB post-login action is unsupported')
  })
})
