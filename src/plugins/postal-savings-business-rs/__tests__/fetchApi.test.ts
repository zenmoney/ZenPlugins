import fetchMock from 'fetch-mock'
import { fetchAccountsPage, fetchHistoryPage, fetchPushStatus, selectPeriod, submitLogin } from '../fetchApi'
import { fixture } from '../testFixtures'

const base = 'https://webebank.ebb-bg.com/sbpo_mbank/'
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('logs useful account and transaction data while masking customer identity, forms and cookies', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get(base + 'accounts', { body: fixture('accounts.html'), headers: { 'Set-Cookie': 'model-session-secret', 'X-Trace': 'model-trace' } })
  fetchMock.get(base + 'accounts/0/transactions/booked', fixture('transactions-rsd.html'))
  fetchMock.post(base + 'j_spring_security_check', fixture('login-challenge.html'))
  await fetchAccountsPage()
  await fetchHistoryPage('0')
  await submitLogin([['j_username', 'model-login-secret'], ['j_password', 'model-password-secret'], ['_csrf_token', 'model-csrf-secret'], ['$id', 'model-challenge-secret']])
  const logs = JSON.stringify(debug.mock.calls)
  for (const secret of ['model-session-secret', 'model-login-secret', 'model-password-secret', 'model-csrf-secret', 'model-challenge-secret', 'ALEKSANDRA', 'Aleksandra', 'fixture-csrf', '1234']) expect(logs).not.toContain(secret)
  for (const useful of ['69.204,71', 'SBPORSBG11FR524TARU49GCC', '15.052,41', 'Poreska uprava Republike Srbije', 'model-trace']) {
    expect(logs).toContain(useful)
  }
  expect(fetchMock.lastOptions(base + 'j_spring_security_check')?.body).toBe('j_username=model-login-secret&j_password=model-password-secret&_csrf_token=model-csrf-secret&%24id=model-challenge-secret')
})

it('uses the observed push status objects and redacts authorization material in actual logs', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get(new RegExp(`${base}auth/mpush/login/check`), fixture('push-approved.json'))
  await expect(fetchPushStatus()).resolves.toBe('OK')
  const logs = JSON.stringify(debug.mock.calls)
  expect(logs).toContain('OK')
  expect(logs).toContain('currentTimestamp')
  expect(logs).not.toContain('fixture-authorization')
})

it('[model] period requests mask the CSRF header and retain useful filter diagnostics', async () => {
  // Models header sanitization without inventing a bank response format.
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.post(base + 'tables/periodSelector', '{}')
  await selectPeriod([['dateFromStr', '01.01.2026']], 'model-csrf-header')
  const logs = JSON.stringify(debug.mock.calls)
  expect(logs).not.toContain('model-csrf-header')
  expect(logs).toContain('01.01.2026')
})

it('[model] unknown network errors retain the original error object', async () => {
  // A directly mocked failure is not interpreted as a bank credential rejection.
  const error = new Error('Model network failure')
  fetchMock.get(base + 'accounts', { throws: error })
  await expect(fetchAccountsPage()).rejects.toBe(error)
})
