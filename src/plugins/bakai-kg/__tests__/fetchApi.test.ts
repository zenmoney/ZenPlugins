import fetchMock from 'fetch-mock'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fetchAccountStatement, fetchAllAccounts, fetchAuthorization, fetchConfirmation } from '../fetchApi'
import get, { getArray } from '../../../types/get'

const products: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/products.json'), 'utf8'))
const evidence: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/auth.json'), 'utf8'))
const authRecord = getArray({ evidence }, 'evidence')[1] as { request: Record<string, string>, response: unknown }
const state = { version: 1 as const, deviceId: '00000000-0000-4000-8000-000000000000', token: 'test-token', otpVerified: true }

beforeEach(() => {
  global.ZenMoney = {
    device: { manufacturer: 'Apple', model: 'iPhone', os: { name: 'ios', version: '27.0' } }
  } as unknown as typeof ZenMoney
})

afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('masks credentials and tokens in actual authorization logs while keeping protocol metadata', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/auth', { status: 200, body: authRecord.response, headers: { 'Set-Cookie': 'model-cookie-secret' } })
  await expect(fetchAuthorization(state, authRecord.request)).resolves.toEqual(authRecord.response)
  const logs = JSON.stringify(debug.mock.calls)
  expect(logs).not.toContain(authRecord.request.password)
  expect(logs).not.toContain(authRecord.request.username)
  expect(logs).not.toContain('model-cookie-secret')
  expect(logs).not.toContain('TEST CUSTOMER')
  expect(logs).toContain('BAKAI')
  expect(logs).toContain('is_2fa')
  expect(logs).toContain('result')
})

it('preserves financial diagnostics in actual product logs and masks authorization and customer identity', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/account.get_list', { status: 200, body: products })
  await expect(fetchAllAccounts(state)).resolves.toEqual(products)
  const call = fetchMock.lastCall('https://bakai24.bakai.kg/v2/account.get_list')
  assert(call?.[1] != null, 'Expected a product-list request')
  expect(JSON.parse(String(call[1].body))).toMatchObject({ inactive: true, platform: 'ios', version: '5.1.9.15' })
  expect(call[1].headers).toMatchObject({ Origin: 'bakai://bakai.app' })
  expect(call[1].headers).toMatchObject({ 'Content-Type': 'application/json' })
  const logs = JSON.stringify(debug.mock.calls)
  expect(logs).not.toContain('test-token')
  expect(logs).not.toContain(state.deviceId)
  expect(logs).not.toContain('TEST CUSTOMER')
  expect(logs).toContain('1306.68')
  expect(logs).toContain('Тестовая карта A')
  expect(logs).toContain('1000')
  expect(logs).toContain('0000 **** **** 0002')
})

it('[model] propagates an unknown network failure unchanged', async () => {
  // Model an implementation invariant without inventing a bank error response.
  const failure = new Error('Model network failure')
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/account.get_list', { throws: failure })
  await expect(fetchAllAccounts(state)).rejects.toBe(failure)
})

it('masks the observed approval number while retaining confirmation status in logs', async () => {
  const fixture: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/pending-confirmation.json'), 'utf8'))
  const response = get(fixture, 'response')
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/users.check_confirmation', { body: response })
  await expect(fetchConfirmation(state)).resolves.toEqual(response)
  expect(JSON.stringify(debug.mock.calls)).not.toContain('"code":42')
  expect(JSON.stringify(debug.mock.calls)).toContain('"verified":false')
})

it('requests the separate account ledger using its account ID and observed statement filter', async () => {
  const fixture: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/account-history.json'), 'utf8'))
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/account.history', { body: get(fixture, 'response') })
  await expect(fetchAccountStatement(state, 1009, '2018-08-06', '2021-08-06')).resolves.toEqual(get(fixture, 'response'))
  const call = fetchMock.lastCall('https://bakai24.bakai.kg/v2/account.history')
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({
    account_id: 1009,
    datbeg: '2018-08-06',
    datend: '2021-08-06',
    search: '',
    platform: 'ios',
    device: 'Zenmoney | Apple iPhone | ios 27.0',
    device_id: state.deviceId,
    version: '5.1.9.15',
    lang: 'ru-RU',
    mode: 'BAKAI'
  })
})

it('[model] keeps unparseable credential-bearing text out of diagnostics', async () => {
  // Model diagnostic safety for arbitrary unparseable transport text, not a bank error code.
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/account.get_list', { status: 200, body: 'model-credential-secret is not JSON' })
  let failure: unknown
  try {
    await fetchAllAccounts(state)
  } catch (error) {
    failure = error
  }
  expect(failure).toBeDefined()
  expect(JSON.stringify(debug.mock.calls)).not.toContain('model-credential-secret')
  expect(String((failure as { message: string }).message)).not.toContain('model-credential-secret')
})
