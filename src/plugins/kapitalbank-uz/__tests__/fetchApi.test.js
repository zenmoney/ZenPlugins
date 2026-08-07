import fetchMock from 'fetch-mock'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { IncompatibleVersionError, InvalidOtpCodeError, TemporaryError } from '../../../errors'
import {
  AuthenticationError,
  fetchAccounts,
  fetchPasswordSession,
  fetchPasswordVerification,
  fetchPhoneExists
} from '../fetchApi'

const BASE_URL = 'https://b2c-api.kapitalbank.uz/api/v1'
const auth = {
  deviceId: 'device-id',
  sessionId: 'session-id',
  accessToken: 'access-token',
  refreshToken: 'refresh-token'
}

describe('Kapitalbank fetch API', () => {
  beforeEach(() => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = pluginData.methods
  })

  afterEach(() => fetchMock.restore())

  it('sends headers from the current official Android app', async () => {
    fetchMock.once(`${BASE_URL}/auth/phone-number/998000000000`, {
      status: 200,
      body: { exist: false }
    })

    await expect(fetchPhoneExists(auth, '+998 (00) 000-00-00')).resolves.toBe(false)

    const [, request] = fetchMock.lastCall()
    expect(request).toEqual(expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        DeviceId: 'device-id',
        'User-Agent': 'okhttp/5.3.2',
        'X-App-Version': '3.5.6',
        'X-Device-Info': 'Android; 15; Google; Pixel 8; 3.5.6; XXHDPI; device-id',
        'X-Device-OS': 'ANDROID',
        'X-Trace-Info': expect.stringMatching(/^sessionId=session-id requestId=[0-9a-f-]{36}$/)
      })
    }))
  })

  it('normalizes the phone and sends the same password request as the Android app', async () => {
    const verification = {
      verificationCode: 'verification-code',
      maskedPhoneNumber: '+998 ** *** ** 00',
      otpRequired: true,
      isSDKNeeded: false,
      sendingSources: [
        { source: 'SMS', isAllowed: true },
        { source: 'TELEGRAM', isAllowed: true }
      ]
    }
    fetchMock.once(`${BASE_URL}/auth/by-password`, {
      status: 200,
      body: verification
    })

    await expect(fetchPasswordVerification(auth, '+998 (00) 000-00-00', 'test-password')).resolves.toEqual(verification)

    const [, request] = fetchMock.lastCall()
    expect(JSON.parse(request.body)).toEqual({
      phoneNumber: '998000000000',
      password: 'test-password',
      otpSendingSource: 'SMS'
    })
  })

  it('omits the OTP code when the bank does not require one', async () => {
    fetchMock.once(`${BASE_URL}/auth/verify-by-password`, {
      status: 200,
      body: {
        guid: 'user-guid',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }
    })

    await fetchPasswordSession(auth, 'verification-code', null)

    const [, request] = fetchMock.lastCall()
    expect(JSON.parse(request.body)).toEqual({
      verificationCode: 'verification-code'
    })
  })

  it('reports an expired access token without masking it as a generic API failure', async () => {
    fetchMock.once(`${BASE_URL}/accounts`, {
      status: 401,
      body: { errorDetail: 'Token expired' }
    })

    await expect(fetchAccounts(auth)).rejects.toBeInstanceOf(AuthenticationError)
  })

  it('classifies a rejected app version explicitly', async () => {
    fetchMock.once(`${BASE_URL}/accounts`, {
      status: 426,
      body: { errorDetail: 'Unsupported application version' }
    })

    await expect(fetchAccounts(auth)).rejects.toBeInstanceOf(IncompatibleVersionError)
  })

  it('rejects a malformed accounts response instead of treating it as empty', async () => {
    fetchMock.once(`${BASE_URL}/accounts`, {
      status: 200,
      body: {}
    })

    await expect(fetchAccounts(auth)).rejects.toBeInstanceOf(TemporaryError)
  })

  it('classifies an invalid SMS code explicitly', async () => {
    fetchMock.once(`${BASE_URL}/auth/verify-by-password`, {
      status: 400,
      body: { errorDetail: 'Invalid confirmation code' }
    })

    await expect(fetchPasswordSession(auth, 'verification-code', '000000')).rejects.toBeInstanceOf(InvalidOtpCodeError)
  })
})
