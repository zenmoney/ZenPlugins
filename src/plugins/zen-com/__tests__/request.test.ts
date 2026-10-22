import fetchMock from 'fetch-mock'
import get from '../../../types/get'
import { requestMobile } from '../request'
import fastLoginResponse from '../__fixtures__/mobile-fast-login.json'

beforeEach(() => {
  global.ZenMoney = { device: { os: { name: 'android' } } } as unknown as typeof ZenMoney
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Model logging invariants only; these responses do not establish bank protocol support.
describe('ZEN.COM selective diagnostics [model]', () => {
  it('preserves structured metadata, validation fields and messages while masking nested credentials and echoes', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const response = {
      authenticationId: 'model-authentication-id',
      accessToken: { token: 'model-response-token', validUntil: '2026-10-22T12:00:00Z', scope: 'MODEL_SCOPE' },
      user: { login: 'model-private-login', contextId: 'model-context-id', state: 'MODEL_STATE' },
      data: [{ provider: 'ivp_model_new_provider', authToken: 'model-provider-token', url: 'https://example.test/verify?token=model-url-token&attempt=model-attempt' }],
      error: {
        code: 'MODEL_ERROR',
        traceId: 'model-trace-id',
        message: 'Model failure for model-request-phone using model-request-token',
        errors: [{ field: 'model.newField', message: 'Model validation: rejected value [model-request-phone]; size must be between 10 and 20; rejected value [model-device-id]' }]
      }
    }
    const url = 'https://api.zen.com/mobile/model-diagnostics?token=model-query-token&requestId=model-query-id'
    fetchMock.post(url, { body: JSON.stringify(response), headers: { Authorization: 'model-response-authorization', 'Set-Cookie': 'model-response-cookie', 'Request-Id': 'model-response-id' } })
    await expect(requestMobile('model-device-id', 'model-diagnostics?token=model-query-token&requestId=model-query-id', { phoneNumber: 'model-request-phone' }, { 'Access-Token': 'model-request-token', Cookie: 'model-request-cookie' })).resolves.toEqual(response)
    const logs = JSON.stringify(debug.mock.calls)
    for (const value of ['model-response-token', 'model-private-login', 'model-provider-token', 'model-url-token', 'model-request-phone', 'model-request-token', 'model-query-token', 'model-response-cookie', 'model-response-authorization', 'model-request-cookie']) expect(logs).not.toContain(value)
    for (const value of ['model-authentication-id', 'MODEL_SCOPE', '2026-10-22T12:00:00Z', 'model-context-id', 'MODEL_STATE', 'ivp_model_new_provider', 'attempt=model-attempt', 'MODEL_ERROR', 'model-trace-id', 'Model failure for', 'model.newField', 'rejected value [model-device-id]', 'size must be between 10 and 20', 'model-device-id', 'model-response-id', 'requestId=model-query-id']) expect(logs).toContain(value)
    expect(debug.mock.calls.some(call => call[0] === 'request')).toBe(true)
    expect(debug.mock.calls.some(call => call[0] === 'response')).toBe(true)
  })

  it('keeps the complete observed fast-login envelope except credential fields', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://api.zen.com/mobile/model-fast-login', JSON.stringify(fastLoginResponse))
    await expect(requestMobile('model-device-id', 'model-fast-login', undefined)).resolves.toEqual(fastLoginResponse)
    expect(debug.mock.calls.find(call => call[0] === 'response')?.[1]).toEqual(expect.objectContaining({
      body: {
        authenticationId: get(fastLoginResponse, 'authenticationId'),
        nextFactor: null,
        accessToken: { token: '<redacted>', validUntil: get(fastLoginResponse, 'accessToken.validUntil') },
        refreshToken: { token: '<redacted>', validUntil: get(fastLoginResponse, 'refreshToken.validUntil') },
        user: {
          contextId: get(fastLoginResponse, 'user.contextId'),
          externalReferenceId: get(fastLoginResponse, 'user.externalReferenceId'),
          state: 'EXISTING',
          login: '<redacted>'
        },
        blockadeExpirationTime: null
      }
    }))
  })
})
