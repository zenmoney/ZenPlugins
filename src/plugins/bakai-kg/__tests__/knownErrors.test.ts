import fetchMock from 'fetch-mock'
import { login, fetchTransactions } from '../api'
import { AuthState } from '../models'
import { BankMessageError, InvalidLoginOrPasswordError, TemporaryError, ZPAPIError } from '../../../errors'

// Complete bank error bodies, with report/build/endpoint provenance in the fixture.
const failures: Array<{ log: number, records: Array<{ result: number, message: string }> }> = jest.requireActual('./fixtures/known-errors-20261019.json')
const auth: Array<{ response: unknown }> = jest.requireActual('./fixtures/auth.json')
const preferences = { phone: '79990000000', password: 'password', countryCode: 'RU' }
const pending: AuthState = { version: 1, deviceId: '00000000-0000-4000-8000-000000000000', token: null, otpVerified: false }

beforeEach(() => {
  global.ZenMoney = {
    device: { manufacturer: 'Apple', model: 'iPhone', os: { name: 'ios', version: '27.0' } },
    readLine: jest.fn(),
    alert: jest.fn()
  } as unknown as typeof ZenMoney
  jest.spyOn(console, 'debug').mockImplementation(() => {})
  jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-19T09:00:00Z').getTime())
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it.each([
  [164489, TemporaryError],
  [165138, InvalidLoginOrPasswordError],
  [165617, BankMessageError]
] as const)('classifies the observed authorization failure in report %s without requesting OTP', async (log, ErrorClass) => {
  const failure = failures.find(fixture => fixture.log === log)?.records[0]
  expect(failure).toBeDefined()
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/get_login', { body: auth[0].response })
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/auth', { body: failure })
  const persist = jest.fn()
  const result = login(preferences, pending, false, persist)
  await expect(result).rejects.toBeInstanceOf(ErrorClass)
  if (log === 165617) {
    await expect(result).rejects.toMatchObject({ bankMessage: failure?.message })
    await expect(result).rejects.not.toBeInstanceOf(InvalidLoginOrPasswordError)
  } else if (log === 164489) {
    await expect(result).rejects.toMatchObject({ message: expect.stringContaining('20 минут') })
    await expect(result).rejects.not.toBeInstanceOf(InvalidLoginOrPasswordError)
  }
  expect(persist.mock.calls).toEqual([[pending]])
  expect(ZenMoney.readLine).not.toHaveBeenCalled()
})

it('keeps a rejected statement reportable while history-period handling is covered by PR #1203', async () => {
  const failure = failures.find(fixture => fixture.log === 165715)?.records[0]
  expect(failure).toBeDefined()
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/card.online_statement', { body: failure })
  const result = fetchTransactions({ ...pending, token: 'test-token', otpVerified: true },
    { cardId: 1, accountId: 2 }, new Date('2026-04-01T00:00:00Z'))
  await expect(result).rejects.toBeInstanceOf(Error)
  await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
  await expect(result).rejects.toMatchObject({ message: expect.stringContaining('Unexpected bank result') })
  expect(fetchMock.calls('https://bakai24.bakai.kg/v2/card.online_statement')).toHaveLength(1)
})

it('[model] preserves an unexpected statement transport error', async () => {
  // A network failure must remain reportable and must not produce partial history.
  const failure = new Error('Model transport failure')
  fetchMock.postOnce('https://bakai24.bakai.kg/v2/card.online_statement', { throws: failure })
  const result = fetchTransactions({ ...pending, token: 'test-token', otpVerified: true },
    { cardId: 1, accountId: 2 }, new Date('2026-10-01T00:00:00Z'))
  await expect(result).rejects.toBe(failure)
  await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
})
