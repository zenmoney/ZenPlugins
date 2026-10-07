import fetchMock from 'fetch-mock'
import { UserInteractionError } from '../../../errors'
const { installFetchMockDeveloperFriendlyFallback }: { installFetchMockDeveloperFriendlyFallback: (mock: typeof fetchMock) => void } = jest.requireActual('../../../testUtils')
const { login }: { login: (preferences: object, auth: object, background: boolean, onAuth?: (auth: unknown) => unknown) => Promise<unknown> } = jest.requireActual('../api')
const responses: { device: object, identification: object, passport: object, createAccessCode: object, serverError: object } = jest.requireActual('./authResponses.json')
installFetchMockDeveloperFriendlyFallback(fetchMock)
const base = 'https://superapp.sensebank.com.ua/mob'
const preferences = { phone: '+380991112233', birthDate: '1990-01-01' }

// [model] Failure injection verifies ordering around observed successful auth responses (source recorded in the fixture).
describe('[model] Sense authorization lifecycle', () => {
  beforeEach(() => {
    Object.assign(global, { ZenMoney: { features: {}, device: { manufacturer: 'Test', model: 'Device' }, readLine: jest.fn() } })
  })
  it('persists a confirmed device-auth update before the access-code request fails', async () => {
    fetchMock.postOnce(base + '/auth', responses.device)
    const error = new Error('Access-code request failed')
    const persist = jest.fn()
    fetchMock.postOnce(base + '/auth', () => {
      expect(persist).toHaveBeenCalledTimes(1)
      throw error
    }, { overwriteRoutes: false })
    await expect(login({ phone: 'changed', birthDate: 'changed' }, { device: { fingerPrint: 'model-device' }, deviceToken: 'device-token', accessToken: 'old-token', accessPin: '123456' }, false, persist)).rejects.toBe(error)
  })
  it.each([true, false])('guards the first SMS request in background mode %s', async background => {
    // Device registration itself is mocked; only the interaction scheduling invariant is under test.
    fetchMock.postOnce(base + '/device/token', { code: 'OK', payload: { deviceToken: 'model-device-token' } })
    fetchMock.postOnce(base + '/auth', responses.identification)
    const failure = new Error('SMS request failed')
    fetchMock.postOnce(base + '/otp/login', { throws: failure })
    const promise = login(preferences, { device: { fingerPrint: 'model-device' } }, background)
    if (background) await expect(promise).rejects.toBeInstanceOf(UserInteractionError)
    else await expect(promise).rejects.toBe(failure)
    expect((fetchMock.calls() as unknown as { matched: unknown[] }).matched).toHaveLength(background ? 2 : 3)
  })
})

it('[model] masks auth identity and headers in actual logs while retaining protocol diagnostics', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  Object.assign(global, { ZenMoney: { features: {}, device: { manufacturer: 'Test', model: 'Device' } } })
  fetchMock.postOnce(base + '/auth', {
    status: 200,
    headers: { 'Set-Cookie': 'private-cookie', authorization: 'private-header-token' },
    body: { ...responses.device, access_token: 'private-access-token', firstName: 'Private Customer', photoURI: 'private-avatar' }
  })
  const failure = new Error('Later transport failure')
  fetchMock.postOnce(base + '/auth', { throws: failure }, { overwriteRoutes: false })
  try {
    await expect(login(preferences, { device: { fingerPrint: 'private-fingerprint' }, deviceToken: 'private-device-token', accessToken: 'old-token', accessPin: '123456' }, false)).rejects.toBe(failure)
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['private-cookie', 'private-header-token', 'private-access-token', 'Private Customer', 'private-avatar', 'private-fingerprint', 'private-device-token']) expect(logs).not.toContain(secret)
    expect(logs).toContain('access_code touchId access_recovery_otp')
    expect(logs).toContain('TRUSTED')
  } finally {
    debug.mockRestore()
  }
})

it('[model] masks PANs in nested card arrays while retaining accounts and balances', async () => {
  const { fetchAccounts }: { fetchAccounts: (auth: object) => Promise<unknown> } = jest.requireActual('../api')
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  Object.assign(global, { ZenMoney: { features: {} } })
  for (const type of ['deposit', 'cardSME', 'credit', 'account']) {
    fetchMock.getOnce(`${base}/shortcuts/${type}`, { code: 'OK', payload: { shortcuts: [] } })
  }
  fetchMock.getOnce(base + '/shortcuts/card', { code: 'OK', payload: { shortcuts: [{ product: { productId: 'diagnostic-card' } }] } })
  fetchMock.getOnce(base + '/card/product/details?productId=diagnostic-card', {
    code: 'OK', payload: { product: { productId: 'diagnostic-card' }, availableFunds: 12345, cards: [{ cardNumber: '4111111111111111' }] }
  })
  try {
    await fetchAccounts({ accessToken: 'private-token' })
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('4111111111111111')
    expect(logs).not.toContain('private-token')
    expect(logs).toContain('411111******1111')
    expect(logs).toContain('diagnostic-card')
    expect(logs).toContain('12345')
  } finally {
    debug.mockRestore()
  }
})

// [model] The observed server error is injected at the final auth stage to verify error propagation, not bank PIN semantics.
it('[model] keeps a server error during PIN setup reportable', async () => {
  const readLine = jest.fn().mockResolvedValueOnce('123456').mockResolvedValueOnce('2010-01-01').mockResolvedValueOnce('123456')
  Object.assign(global, { ZenMoney: { features: {}, device: { manufacturer: 'Test', model: 'Device' }, readLine } })
  fetchMock.postOnce(base + '/device/token', { code: 'OK', payload: { deviceToken: 'model-device-token' } })
  fetchMock.postOnce(base + '/auth', responses.identification)
  fetchMock.postOnce(base + '/otp/login', { code: 'OK', payload: { expiry: 60 } })
  fetchMock.postOnce(base + '/auth', responses.passport, { overwriteRoutes: false })
  fetchMock.postOnce(base + '/auth', responses.createAccessCode, { overwriteRoutes: false })
  fetchMock.postOnce(base + '/auth', { status: 500, body: responses.serverError }, { overwriteRoutes: false })
  const error = await login(preferences, { device: { fingerPrint: 'model-device' } }, false).catch((error: unknown) => error)
  const { ZPAPIError }: { ZPAPIError: new (...args: unknown[]) => Error } = jest.requireActual('../../../errors')
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
  expect((error as Error).message).toContain('server_error')
})
