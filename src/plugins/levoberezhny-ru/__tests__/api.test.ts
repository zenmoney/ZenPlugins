import fetchMock from 'fetch-mock'
import { fetchAccounts, fetchTransactions, login } from '../api'
import { Auth, Session } from '../models'
import { request } from '../fetchApi'
import { InvalidLoginOrPasswordError, UserInteractionError, ZPAPIError } from '../../../errors'

const base = 'https://bl-online.nskbl.ru'
const info = base + '/mobileService/3.0/json/loginInfo'
const tape = base + '/mobileService/3.0/json/pfmTape'
const page = base + '/auth-clustered/realms/mdse_multi/protocol/openid-connect/auth?state=state-secret'
const action = base + '/auth-clustered/realms/mdse_multi/login-actions/authenticate?session_code=code-secret'
const preferences = { login: 'login-secret', password: 'password-secret' }
const saved: Auth = { cookieHeader: 'SESSION=cookie-secret', fingerprint: 'model-device' }
const ok = (object: unknown): { response: { result: number, object: unknown } } => ({ response: { result: 0, object } })

afterEach(() => {
  fetchMock.restore()
  jest.restoreAllMocks()
})

// These synthetic responses model sequencing/security invariants, not bank fixture coverage.
describe('[model] authorization lifecycle', () => {
  it('preserves a working session despite changed preferences and persists a rotation immediately', async () => {
    fetchMock.post(info, { headers: { 'Set-Cookie': 'SESSION=rotated-secret' }, body: ok({}) })
    const persist = jest.fn()
    const session = await login({ login: '', password: '' }, saved, true, persist)
    expect(session.cookieHeader).toBe('SESSION=rotated-secret')
    expect(persist).toHaveBeenCalledWith({
      ...saved,
      cookieHeader: 'SESSION=rotated-secret',
      cookies: [{ name: 'SESSION', value: 'rotated-secret', path: '/', expires: null }]
    })
    expect(fetchMock.calls(info)).toHaveLength(1)
  })

  it('propagates a transport failure without cold login or overwriting confirmed state', async () => {
    const error = new Error('Model transport failure')
    fetchMock.post(info, { throws: error })
    const persist = jest.fn()
    await expect(login(preferences, saved, false, persist)).rejects.toBe(error)
    expect(fetchMock.calls(info)).toHaveLength(1)
    expect(persist).not.toHaveBeenCalled()
    expect(saved.cookieHeader).toBe('SESSION=cookie-secret')
  })

  it('stops before opening a cold login page in the background', async () => {
    fetchMock.post(info, { result: 33, object: { redirectUrl: page } })
    await expect(login(preferences, undefined, true, jest.fn())).rejects.toBeInstanceOf(UserInteractionError)
    expect(fetchMock.calls(info)).toHaveLength(1)
  })

  it('completes a no-challenge form login without exposing secrets in diagnostics', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.postOnce(info, { result: 33, object: { redirectUrl: page } })
    fetchMock.get(page, `<form id="kc-form-login" action="${action.replace(/&/g, '&amp;')}"><input type="hidden" name="fingerprint" value=""/></form>`)
    fetchMock.post(action, { status: 302, headers: { Location: '/login/' } })
    fetchMock.get(base + '/login/', '<html>completion</html>')
    fetchMock.postOnce(info, { headers: { 'Set-Cookie': 'SESSION=completed-secret' }, body: ok({}) }, { overwriteRoutes: false })
    const persist = jest.fn()
    await login(preferences, undefined, false, persist)
    expect(persist).toHaveBeenCalledTimes(1)
    const fields = new URLSearchParams(String(fetchMock.lastOptions(action)?.body))
    expect(fields.get('fsitecode')).toBe('nskbl')
    expect(fields.get('username')).toBe(preferences.login)
    expect(fields.get('password')).toBe(preferences.password)
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['login-secret', 'password-secret', 'state-secret', 'code-secret', 'completed-secret']) {
      expect(logs).not.toContain(secret)
    }
    expect(logs).toContain('302')
    expect(logs).toContain('/mobileService/3.0/json/loginInfo')
  })

  it('keeps trusted-device cookies when an expired SSO session reaches the credential form', async () => {
    const staleAction = action + '&attempt=stale'
    const staleSaved = {
      cookieHeader: '',
      cookies: [
        { name: 'SRWSID', value: 'stale-mobile', path: '/', expires: null },
        { name: 'instanceId', value: 'trusted-device', path: '/', expires: null },
        { name: 'session-cookie', value: 'trusted-session', path: '/', expires: null },
        { name: 'KEYCLOAK_SESSION', value: 'stale-sso', path: '/auth-clustered/realms/mdse_multi/', expires: null }
      ],
      fingerprint: 'model-device'
    }
    fetchMock.postOnce(info, { result: 33, object: { redirectUrl: page } })
    fetchMock.get(page, {
      headers: { 'Set-Cookie': 'KEYCLOAK_SESSION=; Max-Age=0; Path=/auth-clustered/realms/mdse_multi/' },
      body: `<form id="kc-form-login" action="${staleAction.replace(/&/g, '&amp;')}"></form>`
    })
    fetchMock.post(staleAction, { status: 302, headers: { Location: '/priv/home' } })
    fetchMock.get(base + '/priv/home', '<html>completion</html>')
    fetchMock.postOnce(info, ok({}), { overwriteRoutes: false })

    await login(preferences, staleSaved, false, jest.fn())

    expect(fetchMock.calls(staleAction)).toHaveLength(1)
    expect(fetchMock.calls(info)).toHaveLength(2)
    expect(fetchMock.lastOptions(staleAction)?.headers).toMatchObject({
      Cookie: 'SRWSID=stale-mobile; instanceId=trusted-device; session-cookie=trusted-session'
    })
    expect(String(fetchMock.lastOptions(staleAction)?.headers)).not.toContain('stale-sso')
  })

  it('rejects an external authorization destination before sending cookies', async () => {
    fetchMock.post(info, { result: 33, object: { redirectUrl: 'https://example.org/login' } })
    await expect(login(preferences, saved, false, jest.fn())).rejects.toThrow('Unsafe bank redirect')
    expect(fetchMock.calls(info)).toHaveLength(1)
  })

  it('keeps unknown authorization states reportable', async () => {
    fetchMock.post(info, { response: { result: 999 } })
    const error = await login(preferences, saved, false, jest.fn()).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })

  it('records only additional form structure and stops before a misleading completion request', async () => {
    // [model] This tests redaction and sequencing, not the bank's OTP field format.
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.postOnce(info, { result: 33, object: { redirectUrl: page } })
    fetchMock.get(page, `<form id="kc-form-login" action="${action}"></form>`)
    fetchMock.post(action, `<form method="post" action="${action}&amp;execution=challenge-secret">
      <label>Customer-name-secret +79001234567</label>
      <input name="session" type="hidden" value="hidden-secret"/>
      <input name="model-code" type="text" autocomplete="one-time-code" value="123456"/>
      <button name="confirm" type="submit">Confirm</button>
    </form>`)
    const persist = jest.fn()
    await expect(login(preferences, undefined, false, persist)).rejects.toThrow('Additional bank login form detected')
    expect(fetchMock.calls(info)).toHaveLength(1)
    expect(persist).not.toHaveBeenCalled()
    expect(debug).toHaveBeenCalledWith('Levoberezhny additional login form schema', [{
      method: 'POST',
      actionPath: '/auth-clustered/realms/mdse_multi/login-actions/authenticate',
      inputs: [
        { name: 'session', type: 'hidden', autocomplete: '' },
        { name: 'model-code', type: 'text', autocomplete: 'one-time-code' },
        { name: 'confirm', type: 'submit', autocomplete: '' }
      ]
    }])
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['hidden-secret', '123456', 'Customer-name-secret', '+79001234567', 'challenge-secret', 'password-secret', 'code-secret']) {
      expect(logs).not.toContain(secret)
    }
  })
})

describe('[model] history completeness', () => {
  const session = (): Session => ({ ...saved, persist: jest.fn() })
  const items = Array.from({ length: 50 }, (_, index) => ({ id: index + 1 }))
  const from = new Date('2026-09-01T00:00:00+03:00')
  const to = new Date('2026-09-30T23:59:59+03:00')

  it('requests account-level history and retains distinct boundary records', async () => {
    fetchMock.postOnce(tape, ok({ operations: items }))
    fetchMock.postOnce(tape, ok({ operations: [{ id: 49 }, { id: 50 }, { id: 51 }] }), { overwriteRoutes: false })
    const result = await fetchTransactions(session(), { accountId: 'model-account' }, from, to)
    expect(result).toEqual([...items, { id: 51 }])
    const calls = fetchMock.calls(tape)
    expect(new URLSearchParams(String(calls[0][1]?.body)).get('product')).toBe('AC_model-account')
    expect(new URLSearchParams(String(calls[1][1]?.body)).get('lastOperationId')).toBe('49')
  })

  it('rejects a repeated full page rather than silently returning partial history', async () => {
    fetchMock.post(tape, ok({ operations: items }))
    await expect(fetchTransactions(session(), { accountId: 'model-account' }, from, to)).rejects.toThrow('did not advance')
  })

  it('propagates a later page failure after persisting an earlier cookie rotation', async () => {
    const error = new Error('Model second-page failure')
    const current = session()
    fetchMock.postOnce(tape, { headers: { 'Set-Cookie': 'SESSION=rotated-secret' }, body: ok({ operations: items }) })
    fetchMock.postOnce(tape, { throws: error }, { overwriteRoutes: false })
    await expect(fetchTransactions(current, { accountId: 'model-account' }, from, to)).rejects.toBe(error)
    expect(current.persist).toHaveBeenCalledWith({
      ...saved,
      cookieHeader: 'SESSION=rotated-secret',
      cookies: [{ name: 'SESSION', value: 'rotated-secret', path: '/', expires: null }]
    })
  })
})

it('[model] keeps declared current-account scope when opaque loan products are present', async () => {
  // The loanList.loans presence was observed on Android. Its records are opaque
  // here: this model tests scope, not loan parsing or financial interpretation.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const source = require('./fixtures/accounts.json') as { accounts: unknown[] }
  fetchMock.post(base + '/mobileService/3.0/json/getMyFinancesPage', ok({
    accounts: { accounts: source.accounts, savingAccounts: [] },
    loanList: { loans: [{ opaqueModelProduct: true }] },
    depositList: { deposits: [] }
  }))
  const persist = jest.fn()
  expect(await fetchAccounts({ ...saved, persist })).toEqual(source.accounts)
  expect(persist).toHaveBeenCalledWith({
    ...saved,
    cookies: [{ name: 'SESSION', value: 'cookie-secret', path: '/', expires: null }]
  })
})

it('[model] persists authenticated cookie rotation before subsequent product validation fails', async () => {
  // Model a business/schema failure after an authenticated envelope, not a bank error code.
  fetchMock.post(base + '/mobileService/3.0/json/getMyFinancesPage', {
    headers: { 'Set-Cookie': 'SESSION=rotated-secret' },
    body: ok({})
  })
  const persist = jest.fn()
  await expect(fetchAccounts({ ...saved, persist })).rejects.toThrow('Missing bank accounts')
  expect(persist).toHaveBeenCalledWith({
    ...saved,
    cookieHeader: 'SESSION=rotated-secret',
    cookies: [{ name: 'SESSION', value: 'rotated-secret', path: '/', expires: null }]
  })
})

// [model] Existing bank-provided SSO redirects must be tried before prompting.
it('[model] restores a saved SSO session without credentials, including in background', async () => {
  fetchMock.postOnce(info, { result: 33, object: { redirectUrl: page } })
  fetchMock.get(page, { status: 302, headers: { Location: '/priv/home' } })
  fetchMock.get(base + '/priv/home', '<html>authenticated completion</html>')
  fetchMock.postOnce(info, { headers: { 'Set-Cookie': 'SESSION=renewed-model' }, body: ok({}) }, { overwriteRoutes: false })
  const persist = jest.fn()
  await expect(login({ login: '', password: '' }, saved, true, persist)).resolves.toMatchObject({ cookieHeader: 'SESSION=renewed-model' })
  expect(persist).toHaveBeenCalledTimes(1)
  expect(fetchMock.calls(action)).toHaveLength(0)
})

it('[model] renews an expired saved session in background with stored credentials when no challenge follows', async () => {
  fetchMock.postOnce(info, { result: 33, object: { redirectUrl: page } })
  fetchMock.get(page, `<form id="kc-form-login" action="${action}"></form>`)
  fetchMock.post(action, { status: 302, headers: { Location: '/priv/home' } })
  fetchMock.get(base + '/priv/home', '<html>authenticated completion</html>')
  fetchMock.postOnce(info, { headers: { 'Set-Cookie': 'SESSION=background-renewed-model' }, body: ok({}) }, { overwriteRoutes: false })
  const persist = jest.fn()
  await expect(login(preferences, saved, true, persist)).resolves.toMatchObject({ cookieHeader: 'SESSION=background-renewed-model' })
  const fields = new URLSearchParams(String(fetchMock.lastOptions(action)?.body))
  expect(fields.get('username')).toBe(preferences.login)
  expect(fields.get('password')).toBe(preferences.password)
  expect(fetchMock.calls(action)).toHaveLength(1)
  expect(fetchMock.calls(info)).toHaveLength(2)
  expect(persist).toHaveBeenCalledTimes(1)
})

it('[model] stops at the credential form in background when stored credentials are unavailable', async () => {
  fetchMock.post(info, { result: 33, object: { redirectUrl: page } })
  fetchMock.get(page, `<form id="kc-form-login" action="${action}"></form>`)
  const persist = jest.fn()
  await expect(login({ login: '', password: '' }, saved, true, persist)).rejects.toBeInstanceOf(UserInteractionError)
  expect(fetchMock.calls(action)).toHaveLength(0)
  expect(persist).not.toHaveBeenCalled()
})

// [model] HTTP cookie deletion must not leave a revoked SSO cookie in the header.
it('[model] removes explicitly expired cookies while keeping other session cookies', async () => {
  const current = { cookieHeader: 'SSO=old-model; SESSION=keep-model', fingerprint: 'model-device' }
  fetchMock.get(base + '/cookie-model', {
    headers: { 'Set-Cookie': 'SSO=; Max-Age=0; Path=/' }, body: ''
  })
  await request(current, base + '/cookie-model')
  expect(current.cookieHeader).toBe('SESSION=keep-model')
})

it('[model] sends mobile and Keycloak cookies only on their own paths', async () => {
  const current: Auth = {
    cookieHeader: '',
    fingerprint: 'model-device',
    cookies: [
      { name: 'MOBILE', value: 'mobile-secret', path: '/mobileService/', expires: null },
      { name: 'KEYCLOAK_SESSION', value: 'keycloak-secret', path: '/auth-clustered/realms/mdse_multi/', expires: null }
    ]
  }
  const mobile = base + '/mobileService/3.0/json/model'
  const keycloak = base + '/auth-clustered/realms/mdse_multi/protocol/openid-connect/auth'
  fetchMock.get(mobile, { body: '' })
  fetchMock.get(keycloak, { body: '' })
  await request(current, mobile)
  await request(current, keycloak)
  expect(fetchMock.lastOptions(mobile)?.headers).toMatchObject({ Cookie: 'MOBILE=mobile-secret' })
  expect(fetchMock.lastOptions(keycloak)?.headers).toMatchObject({ Cookie: 'KEYCLOAK_SESSION=keycloak-secret' })
})

it('[model] keeps an unavailable bank response reportable and preserves confirmed auth', async () => {
  fetchMock.post(info, { status: 503, body: 'model maintenance response' })
  const persist = jest.fn()
  const error = await login(preferences, saved, false, persist).catch((error: unknown) => error)
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
  expect(persist).not.toHaveBeenCalled()
  expect(saved.cookieHeader).toBe('SESSION=cookie-secret')
})

it('reports the observed repeated credential form as an invalid login or password', async () => {
  const html = `<form id="kc-form-login" action="${action}"></form>`
  fetchMock.postOnce(info, { result: 33, object: { redirectUrl: page } })
  fetchMock.get(page, html)
  fetchMock.post(action, html)
  const persist = jest.fn()
  const error = await login(preferences, saved, false, persist).catch((error: unknown) => error)
  expect(error).toBeInstanceOf(InvalidLoginOrPasswordError)
  expect((error as InvalidLoginOrPasswordError).message).toBe('Неверный логин или пароль интернет-банка Левобережного.')
  expect(fetchMock.calls(action)).toHaveLength(1)
  expect(persist).not.toHaveBeenCalled()
})
