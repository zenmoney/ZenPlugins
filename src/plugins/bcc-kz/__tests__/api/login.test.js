import { parse } from 'querystring'
import { InvalidOtpCodeError } from '../../../../errors'
import { login } from '../../api'

function makeNetworkResponse (body) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://m.bcc.kz/mock',
    headers: {
      forEach: () => {}
    },
    text: async () => JSON.stringify(body)
  }
}

function createJwt (payload) {
  const header = { alg: 'none', typ: 'JWT' }
  const encode = (obj) => Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${encode(header)}.${encode(payload)}.signature`
}

describe('bcc-kz login auth flow', () => {
  beforeEach(() => {
    global.ZenMoney = {
      device: { brand: 'Google', model: 'Pixel 7' },
      readLine: jest.fn().mockResolvedValue('2009')
    }
    global.fetch = jest.fn()
  })

  it('sends web auth payload with lowercase action in PASS and TOKEN', async () => {
    global.fetch
      .mockResolvedValueOnce(makeNetworkResponse({ success: true, verified: false, token: 'otp-token' }))
      .mockResolvedValueOnce(makeNetworkResponse({ success: true, verified: true }))
      .mockResolvedValueOnce(makeNetworkResponse({
        access_token: 'bearer-token',
        provider_response: {
          session_code: 'session-code'
        }
      }))

    const auth = { device: { deviceId: 'test-device-id' } }
    await login(
      { phone: '87000000000', password: 'test-password' },
      auth
    )

    expect(global.fetch).toHaveBeenCalledTimes(3)

    const passBody = parse(global.fetch.mock.calls[0][1].body)
    expect(passBody.action).toBe('SIGN')
    expect(passBody.ACTION).toBeUndefined()
    expect(passBody.authType).toBe('PASS')
    expect(passBody.client_id).toBe('dbp-channels-bcc-web')

    const otpBody = parse(global.fetch.mock.calls[1][1].body)
    expect(otpBody.action).toBe('SIGN')
    expect(otpBody.ACTION).toBeUndefined()
    expect(otpBody.authType).toBe('TOKEN')
    expect(otpBody.token).toBe('otp-token')
    expect(otpBody.verify_code).toBe('2009')

    const connectBody = parse(global.fetch.mock.calls[2][1].body)
    expect(global.fetch.mock.calls[2][0]).toBe('https://m.bcc.kz/auth/realms/bank/protocol/openid-connect/token')
    expect(connectBody.action).toBe('CONNECT')
    expect(connectBody.client_id).toBe('dbp-channels-bcc-web')
    expect(connectBody.device_id).toBe('test-device-id')
    expect(connectBody.OS).toContain('OS:Android10')
    expect(auth.accessToken).toBe('bearer-token')
    expect(auth.sessionCode).toBe('session-code')
  })

  it('maps OTP timeout response to InvalidOtpCodeError', async () => {
    global.fetch
      .mockResolvedValueOnce(makeNetworkResponse({ success: true, verified: false, token: 'otp-token' }))
      .mockResolvedValueOnce(makeNetworkResponse({ success: false, reason: 'Время жизни OTP истекло.' }))

    await expect(
      login(
        { phone: '87000000000', password: 'test-password' },
        { device: { deviceId: 'test-device-id' } }
      )
    ).rejects.toBeInstanceOf(InvalidOtpCodeError)
  })

  it('extracts session code from access token when CONNECT body has no session_code', async () => {
    global.fetch
      .mockResolvedValueOnce(makeNetworkResponse({ success: true, verified: true, token: 'otp-token' }))
      .mockResolvedValueOnce(makeNetworkResponse({
        access_token: createJwt({ session_state: 'jwt-session-code' })
      }))

    const auth = { device: { deviceId: 'test-device-id' } }
    await login(
      { phone: '87000000000', password: 'test-password' },
      auth
    )

    expect(auth.sessionCode).toBe('jwt-session-code')
  })
})
