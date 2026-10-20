import fetchMock from 'fetch-mock'
import { InvalidLoginOrPasswordError, ZPAPIError } from '../../../../errors'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { coldAuth } = require('../../auth') as { coldAuth: (preferences: { phone: string, password: string }) => Promise<void> }

// mail_inbound 162563, apelsin-uz build 69, POST /api/auth/password, 2026-10-15.
const wrongPassword = { errors: [], meta: {}, baseError: { code: 'wrong_password', message: 'Неправильный пароль' } }

beforeEach(() => {
  const data: Record<string, unknown> = {}
  global.ZenMoney = {
    getData: (key: string) => data[key],
    setData: (key: string, value: unknown) => { data[key] = value },
    saveData: jest.fn(),
    readLine: async () => '123456'
  } as unknown as typeof ZenMoney
  // [model] Successful preliminary steps isolate the real password rejection and logging invariants.
  fetchMock.post('https://id.uzum.uz/api/auth/token', { status: 200, body: {}, headers: { 'x-access-token': 'initial-token-secret' } })
  fetchMock.post('https://mobile.apelsin.uz/api/device/register', { status: 200, body: {} })
  fetchMock.post('https://id.uzum.uz/api/auth/phone', { status: 200, body: {} })
  fetchMock.post('https://id.uzum.uz/api/auth/verify', { status: 200, body: {}, headers: { 'x-access-token': 'verified-token-secret' } })
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('classifies the observed wrong_password response and keeps credentials out of actual network logs', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.post('https://id.uzum.uz/api/auth/password', { status: 403, body: wrongPassword })
  const result = coldAuth({ phone: '998901234567', password: 'private-password-secret' })
  await expect(result).rejects.toBeInstanceOf(InvalidLoginOrPasswordError)
  const logged = JSON.stringify(debug.mock.calls)
  for (const secret of ['private-password-secret', '123456', '998901234567', 'initial-token-secret', 'verified-token-secret']) {
    expect(logged).not.toContain(secret)
  }
  expect(logged).toContain('wrong_password')
  expect(logged).toContain('Неправильный пароль')
})

it('[model] propagates an unknown password request failure unchanged', async () => {
  // Unknown transport failures must retain log submission, without credential reclassification.
  const failure = new Error('transport failed')
  fetchMock.post('https://id.uzum.uz/api/auth/password', { throws: failure })
  const result = coldAuth({ phone: '998901234567', password: 'private-password-secret' })
  await expect(result).rejects.toBe(failure)
  await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
})
