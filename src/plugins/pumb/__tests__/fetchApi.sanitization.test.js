import { fetchAccounts, fetchAuthenticationByPassword } from '../fetchApi'
import { TemporaryUnavailableError } from '../../../errors'

function makeResponse (body, headers = {}) {
  const headerEntries = Object.entries(headers)
  const responseHeaders = {
    forEach: callback => headerEntries.forEach(([key, value]) => callback(value, key)),
    entries: () => headerEntries[Symbol.iterator](),
    get: key => headers[key.toLowerCase()] || null,
    has: key => Object.prototype.hasOwnProperty.call(headers, key.toLowerCase()),
    keys: () => headerEntries.map(([key]) => key)[Symbol.iterator](),
    values: () => headerEntries.map(([, value]) => value)[Symbol.iterator]()
  }
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://mobile.pumb.ua/graphql',
    headers: responseHeaders,
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  }
}

describe('PUMB network log sanitization', () => {
  let debugSpy
  let warnSpy

  beforeEach(() => {
    global.ZenMoney = {
      device: { model: 'Pixel 8', os: { version: '16' } }
    }
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    debugSpy.mockRestore()
    warnSpy.mockRestore()
    delete global.fetch
  })

  it('masks credentials, auth state, cookies and identity data while preserving diagnostics', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(makeResponse({
        data: {
          authenticationByPasswordV2: {
            token: 'reusable-access-token',
            authKey: 'reusable-auth-key',
            sessionId: 'authorization-session-id'
          }
        }
      }, {
        'set-cookie': 'authorization-cookie=secret-cookie-value',
        'x-request-id': 'request-id-123'
      }))
      .mockResolvedValueOnce(makeResponse({
        data: {
          accounts: [{
            id: 101,
            iban: 'UA111111111111111111111111111',
            name: 'TEST CUSTOMER',
            balance: 12345,
            cards: [{ id: 'card-1', number: '535528******1234', embossingName: 'TEST CUSTOMER' }]
          }]
        }
      }, {
        'set-cookie': 'authorization-cookie=another-secret-cookie',
        'x-request-id': 'request-id-456'
      }))
      .mockResolvedValueOnce(makeResponse({
        data: null,
        errors: [{
          message: 'Customer 380501234567 request failed',
          extensions: {
            classification: 'UnexpectedException',
            code: 'DIAGNOSTIC_ERROR_CODE',
            message: 'Phone 380501234567 is unavailable',
            title: 'Authentication failed'
          }
        }]
      }))

    await fetchAuthenticationByPassword('+380501234567', '1234', {
      deviceId: 'bank-device-id',
      hardwareID: 'hardware-id-secret'
    })
    await fetchAccounts({
      token: 'private-bearer-token',
      sessionId: 'private-session-id',
      device: { deviceId: 'bank-device-id', hardwareID: 'hardware-id-secret' }
    })
    await expect(fetchAccounts({
      token: 'private-bearer-token',
      sessionId: 'private-session-id',
      device: { deviceId: 'bank-device-id', hardwareID: 'hardware-id-secret' }
    })).rejects.toMatchObject({
      message: '[HTTP 200, DIAGNOSTIC_ERROR_CODE; extensions=classification|code|message|title; classification=UnexpectedException; code=DIAGNOSTIC_ERROR_CODE] Customer <phone> request failed',
      code: 'DIAGNOSTIC_ERROR_CODE'
    })

    const log = JSON.stringify(debugSpy.mock.calls)
    for (const secret of [
      '+380501234567',
      '380501234567',
      'MTIzNA==',
      'hardware-id-secret',
      'bank-device-id',
      'reusable-access-token',
      'reusable-auth-key',
      'authorization-session-id',
      'private-bearer-token',
      'private-session-id',
      'secret-cookie-value',
      'another-secret-cookie',
      'TEST CUSTOMER'
    ]) {
      expect(log).not.toContain(secret)
    }
    for (const diagnostic of [
      'request-id-123',
      'request-id-456',
      'AccountsWithCardsMain',
      '101',
      'UA111111111111111111111111111',
      '12345',
      '535528******1234',
      'card-1',
      'DIAGNOSTIC_ERROR_CODE'
    ]) {
      expect(log).toContain(diagnostic)
    }
  })

  it('turns a bank data-fetching failure into a retryable error without logging credentials', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeResponse({
      data: null,
      errors: [{
        message: 'Bank backend failed',
        extensions: { classification: 'DataFetchingException' }
      }]
    }))

    await expect(fetchAuthenticationByPassword('380501234567', '1234', {
      deviceId: 'bank-device-id',
      hardwareID: 'hardware-id-secret'
    })).rejects.toBeInstanceOf(TemporaryUnavailableError)

    const log = JSON.stringify(warnSpy.mock.calls)
    expect(log).toContain('AuthenticationByPasswordV2')
    expect(log).toContain('DataFetchingException')
    expect(log).not.toContain('380501234567')
    expect(log).not.toContain('1234')
    expect(log).not.toContain('bank-device-id')
    expect(log).not.toContain('hardware-id-secret')
    expect(log).not.toContain('Bank backend failed')
  })
})
