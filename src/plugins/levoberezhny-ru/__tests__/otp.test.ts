import fetchMock from 'fetch-mock'
import { login } from '../api'
import { describeLoginForms } from '../fetchApi'
import { InvalidOtpCodeError } from '../../../errors'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const observed = require('./fixtures/otp-form-schema.json') as {
  schema: { method: string, actionPath: string, inputs: Array<{ name: string, type: string, autocomplete: string }> }
}

const base = 'https://bl-online.nskbl.ru'
const info = base + '/mobileService/3.0/json/loginInfo'
const page = base + '/auth-clustered/realms/mdse_multi/protocol/openid-connect/auth?state=model-state-secret'
const passwordAction = base + observed.schema.actionPath + '?session_code=password-form-secret'
const otpAction = base + observed.schema.actionPath + '?session_code=otp-form-secret&execution=model-step'
const callback = base + '/mobileService/sso/login?code=callback-secret'
const preferences = { login: 'login-secret', password: 'password-secret' }
const code = '073492'

// [model] Only the method/path/input schema is source evidence. The HTML container,
// values and completion responses below model state, serialization and masking;
// they are not a full captured bank HTML fixture or verified error-code evidence.
const challengeHtml = `<form method="post" action="${otpAction.replace(/&/g, '&amp;')}">${observed.schema.inputs.map(input =>
  `<input name="${input.name}" type="${input.type}" autocomplete="${input.autocomplete}" value="${input.type === 'hidden' ? 'hidden-secret' : input.type === 'submit' ? 'Подтвердить' : ''}"/>`
).join('')}</form>`

let readLine: jest.Mock
let challengeBody: string
beforeEach(() => {
  challengeBody = challengeHtml
  readLine = jest.fn().mockResolvedValue(code)
  Object.assign(global, { ZenMoney: { readLine } })
  fetchMock.postOnce(info, { result: 33, object: { redirectUrl: page } })
  fetchMock.get(page, `<form id="kc-form-login" action="${passwordAction}"></form>`)
  fetchMock.post(passwordAction, () => ({ headers: { 'Set-Cookie': 'SESSION=challenge-cookie-secret' }, body: challengeBody }))
})

afterEach(() => {
  fetchMock.restore()
  jest.restoreAllMocks()
})

describe('[model] observed OTP form workflow', () => {
  it('uses the observed form schema, its current action and challenge cookies', async () => {
    expect(describeLoginForms(challengeHtml)).toEqual([observed.schema])
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post(otpAction, { status: 302, headers: { Location: callback, 'Set-Cookie': 'SESSION=otp-cookie-secret' } })
    fetchMock.get(callback, { status: 302, headers: { Location: '/login/' } })
    fetchMock.get(base + '/login/', '<html>completion</html>')
    fetchMock.postOnce(info, {
      headers: { 'Set-Cookie': 'SESSION=completed-cookie-secret' },
      body: { response: { result: 0 } }
    }, { overwriteRoutes: false })
    const persist = jest.fn()
    const auth = await login(preferences, undefined, false, persist)
    expect(readLine).toHaveBeenCalledWith('Одноразовый пароль из SMS банка Левобережный', { inputType: 'numberPassword', time: 120000 })
    const sent = new URLSearchParams(String(fetchMock.lastOptions(otpAction)?.body))
    expect(sent.get('otp')).toBe(code)
    expect(sent.get('login')).toBe('Подтвердить')
    expect(sent.get('fsitecode')).toBe('nskbl')
    expect(sent.get('fingerprint')).toBe(auth.fingerprint)
    expect(sent.has('password')).toBe(false)
    expect(fetchMock.lastOptions(otpAction)?.headers).toMatchObject({ Cookie: 'SESSION=challenge-cookie-secret' })
    expect(fetchMock.calls(passwordAction)).toHaveLength(1)
    expect(fetchMock.calls(info)).toHaveLength(2)
    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist).toHaveBeenCalledWith({
      cookieHeader: 'SESSION=completed-cookie-secret',
      cookies: [{
        name: 'SESSION',
        value: 'completed-cookie-secret',
        path: '/auth-clustered/realms/mdse_multi/login-actions',
        expires: null
      }],
      fingerprint: auth.fingerprint
    })
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of [code, 'hidden-secret', 'login-secret', 'password-secret', 'otp-form-secret', 'challenge-cookie-secret', 'otp-cookie-secret', 'completed-cookie-secret', 'callback-secret']) {
      expect(logs).not.toContain(secret)
    }
    expect(logs).toContain(observed.schema.actionPath)
    expect(logs).toContain('302')
  })

  it.each([null, ''])('does not submit absent OTP input (%s) or persist an unconfirmed session', async absent => {
    readLine.mockResolvedValue(absent)
    const persist = jest.fn()
    await expect(login(preferences, undefined, false, persist)).rejects.toThrow('Required OTP input was not provided')
    expect(fetchMock.calls(otpAction)).toHaveLength(0)
    expect(fetchMock.calls(passwordAction)).toHaveLength(1)
    expect(persist).not.toHaveBeenCalled()
  })

  it('reports the observed repeated challenge as a rejected or expired OTP without retrying', async () => {
    fetchMock.post(otpAction, challengeHtml)
    const persist = jest.fn()
    const error = await login(preferences, undefined, false, persist).catch((error: unknown) => error)
    expect(error).toBeInstanceOf(InvalidOtpCodeError)
    expect((error as InvalidOtpCodeError).message).toBe('Банк не принял одноразовый пароль. Проверьте код и повторите синхронизацию.')
    expect(readLine).toHaveBeenCalledTimes(1)
    expect(fetchMock.calls(passwordAction)).toHaveLength(1)
    expect(fetchMock.calls(otpAction)).toHaveLength(1)
    expect(fetchMock.calls(info)).toHaveLength(1)
    expect(persist).not.toHaveBeenCalled()
  })

  it('rejects an external OTP form before requesting or transmitting the code', async () => {
    challengeBody = challengeHtml.replace(base, 'https://example.org')
    await expect(login(preferences, undefined, false, jest.fn())).rejects.toThrow('Unsafe bank redirect')
    expect(readLine).not.toHaveBeenCalled()
    expect(fetchMock.calls(otpAction)).toHaveLength(0)
  })

  it('does not submit a form with an unknown additional field', async () => {
    challengeBody = challengeHtml.replace('</form>', '<input type="hidden" name="unknown-model-field" value="model-secret"/></form>')
    await expect(login(preferences, undefined, false, jest.fn())).rejects.toThrow('Additional bank login form detected')
    expect(readLine).not.toHaveBeenCalled()
    expect(fetchMock.calls(otpAction)).toHaveLength(0)
  })
})
