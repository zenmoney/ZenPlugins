import fetchMock from 'fetch-mock'
import { fetchAuthorization } from '../fetchApi'
import get, { getString } from '../../../types/get'

// mail_inbound 160540, otpbank-rs 37: LoginUO returned JSON prefixed by U+FEFF.
// Complete response retained; authentication/session material has been replaced.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const loginResponse = require('../__fixtures__/login-bom-160540.json') as Record<string, unknown>
const url = 'https://ebank.otpbanka.rs/RetailV4/Protected/Services/RetailLoginService.svc/LoginUO'

beforeEach(() => {
  global.ZenMoney = { getData: jest.fn().mockReturnValue(''), setData: jest.fn(), saveData: jest.fn() } as unknown as typeof ZenMoney
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('parses the recorded BOM response and masks login data in actual network logs', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.post(url, { status: 200, body: '\uFEFF' + JSON.stringify(loginResponse), headers: { 'set-cookie': 'auth=fixture-cookie' } })
  await expect(fetchAuthorization({ login: 'abc123456', password: 'fixture-otp' })).resolves.toEqual({ cookieHeader: '', login: '123456' })
  const request = debug.mock.calls.find(([event]) => event === 'request')?.[1]
  const response = debug.mock.calls.find(([event]) => event === 'response')?.[1]
  expect(get(request, 'body.username')).not.toBe('abc123456')
  expect(get(request, 'body.otp')).not.toBe('fixture-otp')
  expect(get(request, 'body.appType')).toBe('AUTH_1')
  expect(get(response, 'body.Success')).toBe(true)
  expect(get(response, 'body.LastSuccessfulLogon')).toBe('2026-10-14T07:23:53')
  expect(get(response, 'body.LoginError')).toEqual({})
  for (const field of ['Address', 'Street', 'Username', 'FirstName', 'LastName', 'SocialIdentityNumber', 'Name', 'FullName', 'Ticket', 'SessionID']) {
    expect(get(response, `body.${field}`)).not.toEqual(loginResponse[field])
  }
  expect(getString(response, 'headers.set-cookie')).not.toContain('fixture-cookie')
})

it('[model] propagates transport failures unchanged', async () => {
  // A transport error must not trigger parsing, cookie persistence or partial success.
  const error = new Error('connection failed')
  fetchMock.post(url, { throws: error })
  await expect(fetchAuthorization({ login: 'abc123456', password: 'fixture-otp' })).rejects.toBe(error)
  expect(ZenMoney.saveData).not.toHaveBeenCalled()
})
