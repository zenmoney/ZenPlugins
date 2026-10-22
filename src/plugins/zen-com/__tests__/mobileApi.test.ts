import fetchMock from 'fetch-mock'
import get from '../../../types/get'
import { createMobileFaceAttempt, fastMobileLogin, fetchMobileIdentityRequirements, initializeMobileIdentity, notifyMobileFaceAttempt, startMobileAuthentication, verifyMobileFactor, verifyMobileIdentityFactor } from '../mobileApi'
import validationError from '../__fixtures__/mobile-validation-error.json'
import deviceValidationError from '../__fixtures__/mobile-device-validation-error.json'
import otpResponse from '../__fixtures__/mobile-otp-response.json'
import passcodeResponse from '../__fixtures__/mobile-passcode-response.json'
import identityResponse from '../__fixtures__/mobile-identity-response.json'
import identityInitializationResponse from '../__fixtures__/mobile-identity-initialization-response.json'
import identityRequirementsResponse from '../__fixtures__/mobile-identity-requirements-response.json'
import faceAttemptResponse from '../__fixtures__/mobile-face-attempt-response.json'
import faceRejectedResponse from '../__fixtures__/mobile-face-rejected-response.json'

afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// APK-derived extended envelope when both native SDK providers return empty values.
// This request model does not establish that the backend accepts this fallback.
const expectedFallback = 'ZEN;' + Buffer.from(JSON.stringify({
  version: '1.0',
  data: [{ name: 'SEON', value: '' }, { name: 'THREATMETRIX', value: '' }]
}), 'utf8').toString('base64')

// The response is the complete observed credential-free validation failure.
// Model request secrets test wire shape and sanitization, not server acceptance.
describe('ZEN.COM mobile transport [model requests, observed responses]', () => {
  beforeEach(() => {
    global.ZenMoney = { device: { model: 'Sync', os: { name: 'android', version: '9' } } } as unknown as typeof ZenMoney
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-18T12:00:13Z'))
    const options = new Intl.DateTimeFormat().resolvedOptions()
    jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ ...options, timeZone: 'Etc/UTC' })
  })
  it('sends initial authentication with fallback headers and masks the phone', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications', {
      status: 400, body: JSON.stringify(validationError), headers: { 'App-Check-Token': 'model-attestation-secret' }
    })
    await expect(startMobileAuthentication('model-device-id', '+12345678901')).rejects.toThrow()
    const request = fetchMock.lastOptions()
    expect(JSON.parse(String(request?.body))).toEqual({
      userIdentification: { phoneNumber: '+12345678901' }, operationType: 'LOGIN_INDIVIDUAL_CONTEXT', fingerPrintId: expectedFallback
    })
    expect(request?.headers).toEqual(expect.objectContaining({
      'Instance-Id': '',
      'Mobile-Device-Id': 'model-device-id',
      'Installation-Id': 'model-device-id',
      'Device-Os-Name': 'Android',
      'Device-Os-Subtype': 'HUAWEI',
      'Device-Os-Version': '9',
      'Device-Platform': 'Android',
      'Device-Timestamp': String(Date.parse('2026-10-18T12:00:13Z')),
      'Device-Timezone': 'Etc/UTC',
      'Device-Model': 'Sync',
      'User-Agent': 'ZEN Mobile'
    }))
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('+12345678901')
    expect(logs).toContain(expectedFallback)
    expect(logs).toContain('model-device-id')
    expect(logs).not.toContain('model-attestation-secret')
    expect(logs).toContain('AuthenticationController')
    expect(logs).toContain('validation_error')
    expect(logs).toContain('HUAWEI')
    expect(logs).toContain('Etc/UTC')
  })

  it('retains the observed validation details while masking the login phone', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications', {
      status: 400, body: JSON.stringify(deviceValidationError)
    })
    await expect(startMobileAuthentication('model-device-id', '+12345678901')).rejects.toThrow()
    const responseLog = debug.mock.calls.find(call => call[0] === 'response')?.[1]
    expect(responseLog).toEqual(expect.objectContaining({
      status: 400,
      body: expect.objectContaining({ error: expect.objectContaining({ code: 'validation_error', errors: get(deviceValidationError, 'error.errors') }) })
    }))
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('+12345678901')
    for (const value of ['AuthenticationControllerV2', 'size must be between', 'model-device-id']) expect(logs).toContain(value)
  })

  it('accepts the observed 201 OTP step with its timer and masks the access token', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    // The observed response arrived at 12:23:02, before the supplied timer expiry.
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-18T12:23:02Z'))
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications', {
      status: 201, body: JSON.stringify(otpResponse)
    })
    await expect(startMobileAuthentication('model-device-id', '+12345678901')).resolves.toEqual({
      authenticationId: '00000000-0000-4000-8000-000000000001',
      accessToken: 'fixture-mobile-otp-access-token',
      refreshToken: null,
      nextFactor: 'OTP'
    })
    const responseLog = debug.mock.calls.find(call => call[0] === 'response')?.[1]
    expect(responseLog).toEqual(expect.objectContaining({
      status: 201,
      body: expect.objectContaining({ nextFactor: 'OTP', blockadeExpirationTime: '2026-10-18T12:23:32Z' })
    }))
    expect(JSON.stringify(debug.mock.calls)).not.toContain('fixture-mobile-otp-access-token')
  })

  it('[model] reports the host timezone offset when Intl is unavailable', async () => {
    const originalIntl = global.Intl
    Object.defineProperty(global, 'Intl', { value: undefined, configurable: true, writable: true })
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120)
    try {
      const error = new Error('Model network failure')
      fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications', { throws: error })
      await expect(startMobileAuthentication('model-device-id', '+12345678901')).rejects.toBe(error)
      expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Device-Timezone': 'GMT+02:00' }))
    } finally {
      Object.defineProperty(global, 'Intl', { value: originalIntl, configurable: true, writable: true })
    }
  })

  it('parses the observed passcode and identity steps without treating them as completed authorization', async () => {
    const step = { accessToken: 'model-otp-token', refreshToken: null, authenticationId: '00000000-0000-4000-8000-000000000001', nextFactor: 'OTP' as const }
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications/' + step.authenticationId + '/factors/otp/verify', { status: 200, body: JSON.stringify(passcodeResponse) })
    const passcode = await verifyMobileFactor('model-device-id', step, 'model-sms')
    expect(passcode).toEqual({ ...step, accessToken: 'fixture-mobile-passcode-access-token', nextFactor: 'PASSCODE' })
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications/' + step.authenticationId + '/factors/passcode/verify', { status: 200, body: JSON.stringify(identityResponse) })
    await expect(verifyMobileFactor('model-device-id', passcode, 'model-passcode')).resolves.toEqual({
      ...step, accessToken: 'fixture-mobile-identity-access-token', nextFactor: 'IDENTITY'
    })
  })

  it('[model] initializes identity without a body and masks its authentication token', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const error = new Error('Model identity initialization network failure')
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications/model-id/factors/identity/initialize', { throws: error })
    await expect(initializeMobileIdentity('model-device-id', {
      accessToken: 'model-identity-token', refreshToken: null, authenticationId: 'model-id', nextFactor: 'IDENTITY'
    })).rejects.toBe(error)
    expect(fetchMock.lastOptions()?.body).toBeUndefined()
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Authentication-Access-Token': 'model-identity-token' }))
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-identity-token')
  })

  it('parses the observed identity initialization with no nextFactor and a future timer, then requests requirements', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-18T12:36:37Z'))
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications/model-id/factors/identity/initialize', {
      status: 200, body: JSON.stringify(identityInitializationResponse)
    })
    const initialized = await initializeMobileIdentity('model-device-id', {
      accessToken: 'model-identity-token', refreshToken: null, authenticationId: 'model-id', nextFactor: 'IDENTITY'
    })
    expect(initialized).toEqual({
      verificationId: '00000000-0000-4000-8000-000000000002', accessToken: 'fixture-mobile-initialized-identity-token'
    })
    // Model a network failure after the observed initialization response.
    const error = new Error('Model requirements network failure after observed initialization')
    fetchMock.get('https://api.zen.com/mobile/reauth/00000000-0000-4000-8000-000000000002/v2', { throws: error })
    await expect(fetchMobileIdentityRequirements('model-device-id', initialized)).rejects.toBe(error)
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Access-Token': 'fixture-mobile-initialized-identity-token' }))
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('fixture-mobile-initialized-identity-token')
    expect(logs).not.toContain('model-identity-token')
    expect(logs).toContain('2026-10-18T12:37:06Z')
  })

  it('[model] reads identity requirements using the current access token without submitting verification', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const error = new Error('Model identity requirements network failure')
    fetchMock.get('https://api.zen.com/mobile/reauth/model-verification/v2', { throws: error })
    await expect(fetchMobileIdentityRequirements('model-device-id', { verificationId: 'model-verification', accessToken: 'model-identity-token' })).rejects.toBe(error)
    expect(fetchMock.lastOptions()?.method).toBe('GET')
    expect(fetchMock.lastOptions()?.body).toBeUndefined()
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Access-Token': 'model-identity-token' }))
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-identity-token')
    expect(fetchMock.done()).toBe(true)
  })

  it('reads the observed active face verification without returning or logging customer names', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get('https://api.zen.com/mobile/reauth/00000000-0000-4000-8000-000000000002/v2', {
      status: 200, body: JSON.stringify(identityRequirementsResponse)
    })
    const requirements = await fetchMobileIdentityRequirements('model-device-id', {
      verificationId: '00000000-0000-4000-8000-000000000002', accessToken: 'model-identity-token'
    })
    expect(requirements).toEqual({ method: 'FACE_REAUTH', status: 'ACTIVE', providers: [], attempts: [] })
    const logs = JSON.stringify(debug.mock.calls)
    for (const value of ['Fixture', 'Customer', 'model-identity-token']) expect(logs).not.toContain(value)
  })

  it('retains the observed FAILED attempt despite ACTIVE verification and masks provider data', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get('https://api.zen.com/mobile/reauth/model-verification/v2', { status: 200, body: JSON.stringify(faceRejectedResponse) })
    await expect(fetchMobileIdentityRequirements('model-device', { verificationId: 'model-verification', accessToken: 'model-access-token' })).resolves.toEqual({
      method: 'FACE_REAUTH',
      status: 'ACTIVE',
      providers: ['IVP_IDENFY'],
      attempts: [{ id: '00000000-0000-4000-8000-000000000003', status: 'FAILED' }]
    })
    const logs = JSON.stringify(debug.mock.calls)
    for (const value of ['Fixture', 'Customer', 'fixture-rejected-face-token', 'model-access-token']) expect(logs).not.toContain(value)
  })

  it('creates the observed iDenfy attempt and masks its provider credential', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://api.zen.com/mobile/reauth/model-verification/init-attempt/v2', { status: 200, body: JSON.stringify(faceAttemptResponse) })
    await expect(createMobileFaceAttempt('model-device', { verificationId: 'model-verification', accessToken: 'model-access-token' })).resolves.toEqual({
      id: '00000000-0000-4000-8000-000000000003', token: 'fixture-idenfy-face-token'
    })
    expect(JSON.parse(String(fetchMock.lastOptions()?.body))).toEqual({ country: null })
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Access-Token': 'model-access-token', 'Full-Reauth-Process-Flow': 'V2_USER_DATA_CONFIRMATION' }))
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('fixture-idenfy-face-token')
    expect(logs).not.toContain('model-access-token')
    expect(logs).toContain('IVP_IDENFY')
  })

  it('[model] preserves an unknown face provider in logs and the reportable error', async () => {
    // Model diagnostic preservation, not support for a new bank provider.
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://api.zen.com/mobile/reauth/model-verification/init-attempt/v2', {
      status: 200, body: JSON.stringify({ provider: 'ivp_model_new_provider', data: { token: 'model-provider-secret' } })
    })
    await expect(createMobileFaceAttempt('model-device', { verificationId: 'model-verification', accessToken: 'model-access-token' }))
      .rejects.toThrow("provider: 'ivp_model_new_provider'")
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).toContain('ivp_model_new_provider')
    expect(logs).not.toContain('model-provider-secret')
    expect(logs).not.toContain('UNKNOWN')
  })

  it('[model] preserves new identity method, provider and status labels verbatim', async () => {
    // Unknown protocol labels must remain diagnosable, not become successful auth.
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get('https://api.zen.com/mobile/reauth/model-verification/v2', JSON.stringify({
      method: 'MODEL_NEW_METHOD',
      status: 'MODEL_NEW_STATUS',
      firstName: 'model-person-name',
      attempts: [{ id: 'model-attempt', provider: 'ivp_model_new_provider', status: 'MODEL_NEW_ATTEMPT_STATUS', data: { authToken: 'model-provider-secret' } }]
    }))
    await expect(fetchMobileIdentityRequirements('model-device', { verificationId: 'model-verification', accessToken: 'model-access-token' })).resolves.toEqual({
      method: 'MODEL_NEW_METHOD',
      status: 'MODEL_NEW_STATUS',
      providers: ['ivp_model_new_provider'],
      attempts: [{ id: 'model-attempt', status: 'MODEL_NEW_ATTEMPT_STATUS' }]
    })
    const logs = JSON.stringify(debug.mock.calls)
    for (const value of ['MODEL_NEW_METHOD', 'MODEL_NEW_STATUS', 'ivp_model_new_provider', 'MODEL_NEW_ATTEMPT_STATUS', 'model-attempt']) expect(logs).toContain(value)
    for (const value of ['model-provider-secret', 'model-person-name', 'model-access-token']) expect(logs).not.toContain(value)
  })

  it('[model] notifies and verifies through separate routes without inventing successful responses', async () => {
    const session = { verificationId: 'model-verification', accessToken: 'model-access-token' }
    const error = new Error('Model notification network failure')
    fetchMock.post('https://api.zen.com/mobile/reauth/model-verification/attempts/model-attempt/notify', { throws: error })
    await expect(notifyMobileFaceAttempt('model-device', session, 'model-attempt')).rejects.toBe(error)
    expect(fetchMock.lastOptions()?.body).toBeUndefined()
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Access-Token': 'model-access-token' }))
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications/model-auth/factors/identity/verify', { throws: error })
    await expect(verifyMobileIdentityFactor('model-device', 'model-auth', session)).rejects.toBe(error)
    expect(fetchMock.lastOptions()?.body).toBeUndefined()
    expect(fetchMock.lastOptions()?.headers).toEqual(expect.objectContaining({ 'Authentication-Access-Token': 'model-access-token' }))
  })

  it('masks fast-login credentials and factor access tokens', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications/fast-login', { status: 400, body: JSON.stringify(validationError) })
    await expect(fastMobileLogin('model-device-id', 'model-login-secret', 'model-passcode-secret')).rejects.toThrow()
    expect(JSON.parse(String(fetchMock.lastOptions()?.body))).toEqual({
      accessToken: 'model-login-secret', secret: 'model-passcode-secret', factorType: 'PASSCODE', operationType: 'LOGIN_INDIVIDUAL_CONTEXT', fingerPrintId: expectedFallback
    })
    fetchMock.post('https://api.zen.com/mobile/mobile-authentication/authentications/model-id/factors/passcode/verify', { status: 400, body: JSON.stringify(validationError) })
    await expect(verifyMobileFactor('model-device-id', {
      authenticationId: 'model-id', accessToken: 'model-factor-secret', refreshToken: null, nextFactor: 'PASSCODE'
    }, 'model-passcode-secret')).rejects.toThrow()
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['model-login-secret', 'model-passcode-secret', 'model-factor-secret']) expect(logs).not.toContain(secret)
  })
})
