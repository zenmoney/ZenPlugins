import { readFileSync } from 'fs'
import { join } from 'path'
import fetchMock from 'fetch-mock'
import get from '../../../types/get'
import { refreshToken, submitCredentials, confirmLogin, fetchAuthorizationPage, fetchPushStatus, exchangeToken, fetchClientAuthorization, fetchClientId } from '../fetchApi'
import { pushPage } from '../authPage'
import { authenticate } from '../api'
import { UserInteractionError } from '../../../errors'

// Complete sanitized auth responses are from the authorized MyAmeria capture on 2026-10-07.
describe('MyAmeria captured authorization transport', () => {
  afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

  it('recognizes the captured invalid refresh grant', async () => {
    const fixture: { refreshRejection: { status: number, body: unknown } } = JSON.parse(readFileSync(join(__dirname, 'fixtures/auth/responses.json'), 'utf8'))
    fetchMock.post(/openid-connect\/token/, fixture.refreshRejection)
    expect(await refreshToken({ refreshToken: 'invalid-research-token', clientAuth: 'fixture-basic', clientId: 'fixture-client' })).toEqual({ kind: 'rejected' })
  })

  it('uses dynamic actions, form encoding and the external request identity on confirmation', async () => {
    const page = pushPage(readFileSync(join(__dirname, 'fixtures/auth/push.html'), 'utf8'))
    fetchMock.post(page.action, { status: 302, headers: { Location: 'https://myameria.am/#code=fixture-code&state=fixture-state' } })
    const result = await confirmLogin(page, 'fixture-cddc')
    expect({ result, body: fetchMock.lastOptions()?.body, redirect: get(fetchMock.lastOptions(), 'redirect') }).toEqual({
      result: 'https://myameria.am/#code=fixture-code&state=fixture-state',
      body: 'evaluated_request_id=fixture-evaluated-request&X-Banqr-CDDC=fixture-cddc&evaluate_action=true&form_action=submit_button&totp=fixture-push-session',
      redirect: 'manual'
    })
  })

  // Model secret sentinels around observed payloads to verify the actual shared logging layer.
  it('[model] masks credentials, inline HTML, auth URLs, cookies and callback fragments in actual logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const action = 'https://account.myameria.am/auth/realms/ameria/login-actions/authenticate?session_code=form-session-secret&execution=execution-secret&client_id=banqr-online&tab_id=tab-secret'
    fetchMock.post(action, { headers: { 'Set-Cookie': 'cookie-secret', 'X-Request-Id': 'request-42' }, body: '<html>inline-session-secret</html>' })
    await submitCredentials(action, { login: 'логин-secret', password: 'пароль-secret' }, 'diagnostic-cddc')
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['form-session-secret', 'execution-secret', 'tab-secret', 'cookie-secret', 'inline-session-secret', 'логин-secret', 'пароль-secret']) expect(logs).not.toContain(secret)
    expect(logs).toContain('request-42')
    expect(logs).toContain('diagnostic-cddc')
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
  })

  it('[model] masks authorization codes and tokens while preserving bank error codes', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post(/openid-connect\/token/, { status: 400, body: { error: 'MODEL_UNKNOWN', error_description: 'Visible diagnostic', access_token: 'access-secret', refresh_token: 'refresh-secret' } })
    await expect(exchangeToken('code-secret', 'basic-secret')).rejects.toThrow()
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['code-secret', 'basic-secret', 'access-secret', 'refresh-secret']) expect(logs).not.toContain(secret)
    expect(logs).toContain('MODEL_UNKNOWN')
    expect(logs).toContain('Visible diagnostic')
  })

  it('[model] masks sensitive query fields in both authorization request and response URLs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get(/openid-connect\/auth/, { body: 'private-page-secret' })
    await fetchAuthorizationPage('state-secret', 'nonce-secret')
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['state-secret', 'nonce-secret', 'private-page-secret']) expect(logs).not.toContain(secret)
    expect(logs).toContain('response_type=code')
    expect(logs).toContain('client_id=banqr-online')
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
  })

  it('[model] masks push session URLs while keeping status and error diagnostics', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get(/push-status/, { body: { status: 'success', data: { sessionStatus: 'pending' }, errorMessages: null } })
    await fetchPushStatus('push-session-secret')
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('push-session-secret')
    expect(logs).toContain('pending')
    expect(logs).toContain('errorMessages')
  })

  it('[model] keeps client configuration secrets out of logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get('https://myameria.am/js/vendors~main.js', 'KEYCLOAK_CONFIG:{realm:"ameria",credentials:{secret:"configuration-secret"}}')
    await fetchClientAuthorization()
    expect(JSON.stringify(debug.mock.calls)).not.toContain('configuration-secret')
  })

  it('[model] masks callback fragments in actual response headers', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const page = pushPage(readFileSync(join(__dirname, 'fixtures/auth/push.html'), 'utf8'))
    fetchMock.post(page.action, { status: 302, headers: { Location: 'https://myameria.am/#code=callback-code-secret&state=callback-state-secret&session_state=callback-session-secret', 'Set-Cookie': 'callback-cookie-secret' } })
    await confirmLogin(page, 'diagnostic-cddc')
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['callback-code-secret', 'callback-state-secret', 'callback-session-secret', 'callback-cookie-secret']) expect(logs).not.toContain(secret)
    expect(logs).toContain('302')
    expect(logs).toContain('login-actions/authenticate')
  })

  it('discovers the bank client from the complete captured user and client responses', async () => {
    const fixture: { userInfo: unknown, clients: unknown } = JSON.parse(readFileSync(join(__dirname, 'fixtures/auth/clients.json'), 'utf8'))
    fetchMock.get('https://ob.myameria.am/api/users/info?', { body: fixture.userInfo })
    fetchMock.get('https://ob.myameria.am/api/users/fixture-id/clients?', { body: fixture.clients })
    expect(await fetchClientId('fixture-access')).toBe('fixture-client')
  })

  it('[model] sends no bank request when a missing session needs background interaction', async () => {
    fetchMock.post(/login-actions\/authenticate/, { body: 'unexpected background submission' })
    const result = await authenticate({ login: 'fixture-user', password: 'fixture-password' }, {}, async () => {}, true).catch((error: unknown) => error)
    expect({ interactionRequired: result instanceof UserInteractionError, requests: fetchMock.calls(/login-actions\/authenticate/).length }).toEqual({ interactionRequired: true, requests: 0 })
  })

  it('[model] keeps unknown refresh rejection errors reportable', async () => {
    fetchMock.post(/openid-connect\/token/, { status: 400, body: { error: 'MODEL_UNKNOWN', error_description: 'Unclassified model rejection' } })
    await expect(refreshToken({ refreshToken: 'fixture-refresh', clientAuth: 'fixture-basic', clientId: 'fixture-client' })).rejects.toThrow()
  })

  it('[model] masks complete private client discovery responses and user identity URL paths', async () => {
    const fixture: { userInfo: unknown, clients: unknown } = JSON.parse(readFileSync(join(__dirname, 'fixtures/auth/clients.json'), 'utf8'))
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get('https://ob.myameria.am/api/users/info?', { body: fixture.userInfo })
    fetchMock.get('https://ob.myameria.am/api/users/fixture-id/clients?', { body: fixture.clients })
    await fetchClientId('private-access-secret')
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['private-access-secret', 'fixture-id', 'fixture-firstName', 'fixture-lastName', 'fixture-email']) expect(logs).not.toContain(secret)
    expect(logs).toContain('users/')
    expect(logs).toContain('/clients')
  })
})
