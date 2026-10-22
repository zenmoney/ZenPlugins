import fetchMock from 'fetch-mock'
import { fetchLoginPage } from '../../fetchApi'

afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('[model] masks the session cookie returned by the login page', async () => {
  // Regression for mail_inbound 173556 (build 37); values model secret retention only.
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get('https://online.altabanka.rs/Retail/home/login', {
    status: 200,
    headers: { 'Set-Cookie': 'altaretv4_HolosToken=model-login-cookie; Path=/', 'x-request-id': 'model-correlation-id' },
    body: '<html>Model login page</html>'
  })
  await fetchLoginPage()
  const logs = JSON.stringify(debug.mock.calls)
  expect(logs).not.toContain('model-login-cookie')
  expect(logs).toContain('model-correlation-id')
})
