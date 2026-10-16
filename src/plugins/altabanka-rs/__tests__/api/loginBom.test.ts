import fetchMock from 'fetch-mock'
import { fetchLogin } from '../../fetchApi'
import get from '../../../../types/get'

// mail_inbound 163320, build 36, LoginUO: complete JSON response starts with U+FEFF.
// All identity/session fields in the public fixture were replaced; all 49 fields remain.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const loginResponse = require('../../__fixtures__/login-bom-163320.json') as Record<string, unknown>
const url = 'https://online.altabanka.rs/Retail/Protected/Services/RetailLoginService.svc/LoginUO'

afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('parses the recorded BOM response and masks authentication data in network logs', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.post(url, {
    status: 200,
    body: '\uFEFF' + JSON.stringify(loginResponse),
    headers: { 'set-cookie': 'auth=fixture-cookie' }
  })
  await expect(fetchLogin('fixture-request-token', 'fixture-username', 'fixture-otp')).resolves.toBeUndefined()
  const request = debug.mock.calls.find(([event]) => event === 'request')?.[1]
  const response = debug.mock.calls.find(([event]) => event === 'response')?.[1]
  expect(get(request, 'body.appType')).toBe('AUTH_1')
  expect(get(response, 'body.Success')).toBe(true)
  expect(get(response, 'body.LoginError')).toEqual({})
  expect(get(response, 'body.LastSuccessfulLogon')).toEqual(loginResponse.LastSuccessfulLogon)
  for (const field of ['Address', 'Street', 'Locality', 'Username', 'FirstName', 'LastName', 'Name', 'FullName', 'SocialIdentityNumber', 'SessionID', 'Ticket', 'RequestToken', 'HolosSessionID']) {
    expect(get(response, `body.${field}`)).not.toEqual(loginResponse[field])
  }
  const logs = JSON.stringify(debug.mock.calls)
  for (const secret of ['fixture-request-token', 'fixture-username', 'fixture-otp', 'fixture-cookie']) {
    expect(logs).not.toContain(secret)
  }
})

it('[model] propagates transport failures unchanged', async () => {
  // Transport errors must not become a successful authentication result.
  const failure = new Error('connection failed')
  fetchMock.post(url, { throws: failure })
  await expect(fetchLogin('fixture-token', 'fixture-user', 'fixture-otp')).rejects.toBe(failure)
})
