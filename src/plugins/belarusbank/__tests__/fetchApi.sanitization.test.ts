import fetchMock from 'fetch-mock'
import { fetchApi } from '../fetchApi'
import { BASE_API_URL } from '../models'

// Model payloads exercise log-redaction invariants, not Belarusbank response classification or parsing.
describe('[model] Belarusbank network log sanitization', () => {
  let debug: jest.SpyInstance

  beforeEach(() => {
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    Object.defineProperty(globalThis, 'ZenMoney', {
      configurable: true,
      value: { features: { binaryResponseBody: true } } as unknown as typeof ZenMoney
    })
  })

  afterEach(() => {
    fetchMock.restore()
    debug.mockRestore()
  })

  it('masks nested credentials, query secrets, tokens, cookies and identity fields in actual logs', async () => {
    const path = 'users/auth/login/challenge-id'
    const query = {
      code: 'secret-sms-code',
      codeWord: 'secret-code-word',
      login: 'secret-login',
      mobilePhone: 'secret-query-phone',
      refresh_token: 'secret-query-refresh-token',
      requestId: 'diagnostic-request-id'
    }
    const response = {
      requestId: 'diagnostic-response-id',
      errorInfo: { code: 'MODEL_DIAGNOSTIC_CODE', errorText: 'Diagnostic bank error detail' },
      sessionToken: 'secret-session-token',
      token: 'secret-token',
      refreshToken: 'secret-refresh-token',
      identity: {
        firstName: 'Private First Name',
        last_name: 'Private Last Name',
        mobilePhone: 'secret-response-phone',
        email: 'private-model-email@example.invalid',
        personalNumber: 'secret-personal-number',
        addressRegistration: 'Private Home Address'
      },
      sendCodeResponse: { phoneNumber: 'secret-challenge-phone', requestId: 'diagnostic-challenge-id' },
      nested: [{ access_token: 'secret-nested-access-token', idToken: 'secret-id-token' }]
    }
    fetchMock.once(new RegExp(`${BASE_API_URL}${path}\\?`), {
      status: 400,
      body: response,
      headers: {
        Authorization: 'secret-response-authorization',
        'Set-Cookie': 'secret-response-cookie',
        Cookie: 'secret-cookie-header',
        'Refresh-Token': 'secret-header-refresh-token',
        'X-Request-Id': 'diagnostic-header-id'
      }
    })

    await expect(fetchApi(path, {
      method: 'POST',
      query,
      sessionToken: 'secret-request-authorization',
      body: {
        login: query.login,
        password: 'secret-password',
        deviceUid: 'secret-device-uid',
        nested: [{ mobile_phone: 'secret-request-phone', code: query.code, codeWord: query.codeWord }]
      },
      retry: false
    })).resolves.toEqual({ status: 400, body: response })

    expect(debug.mock.calls.map(([kind]) => kind)).toEqual(['request', 'response'])
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of [
      ...Object.values(query).filter((value) => value.startsWith('secret-')),
      'secret-password', 'secret-device-uid', 'secret-request-phone', 'secret-request-authorization',
      'secret-session-token', 'secret-token', 'secret-refresh-token', 'secret-response-phone',
      'Private First Name', 'Private Last Name', 'private-model-email@example.invalid',
      'secret-personal-number', 'Private Home Address', 'secret-challenge-phone',
      'secret-nested-access-token', 'secret-id-token', 'secret-response-authorization',
      'secret-response-cookie', 'secret-cookie-header', 'secret-header-refresh-token'
    ]) {
      expect(logs).not.toContain(secret)
    }
    for (const diagnostic of [
      path, 'diagnostic-request-id', 'diagnostic-response-id', 'diagnostic-challenge-id',
      'diagnostic-header-id', 'MODEL_DIAGNOSTIC_CODE', 'Diagnostic bank error detail'
    ]) {
      expect(logs).toContain(diagnostic)
    }
    expect(logs).toContain('<string[')
    expect(debug.mock.calls[0][1].url).not.toContain(query.code)
    expect(debug.mock.calls[1][1].url).not.toContain(query.codeWord)
  })

  it('masks a raw refresh-token request without changing the transmitted body', async () => {
    const url = `${BASE_API_URL}users/auth/refresh-token`
    fetchMock.once(url, { body: { requestId: 'refresh-diagnostic-id' } })

    await fetchApi('users/auth/refresh-token', {
      method: 'POST',
      body: 'secret-raw-refresh-token',
      rawStringBody: true,
      retry: false
    })

    expect(fetchMock.lastCall(url)?.[1]?.body).toBe('secret-raw-refresh-token')
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('secret-raw-refresh-token')
    expect(logs).toContain('refresh-diagnostic-id')
    expect(debug.mock.calls[0][1].body).toBe('<string[24]>')
  })

  it('masks query credentials in failed-response logs and preserves the original network error', async () => {
    const error = new Error('[NER] connection reset')
    fetchMock.once(new RegExp(`${BASE_API_URL}users/auth/login/challenge-id\\?`), { throws: error })

    await expect(fetchApi('users/auth/login/challenge-id', {
      query: { code: 'secret-failed-otp', codeWord: 'secret-failed-code-word', requestId: 'failure-diagnostic-id' },
      retry: false
    })).rejects.toBe(error)

    expect(debug.mock.calls.map(([kind]) => kind)).toEqual(['request', 'response'])
    expect(debug.mock.calls[1][3]).toBe(error)
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('secret-failed-otp')
    expect(logs).not.toContain('secret-failed-code-word')
    expect(logs).toContain('failure-diagnostic-id')
  })

  it('retains account and transaction payloads while masking full PANs and cardholder names', async () => {
    const body = {
      accounts: [{ productId: 'diagnostic-account', ibanNum: 'BY00MODEL0001', amount: 123.45, currencyIso: 'BYN' }],
      cards: [
        { productId: 'diagnostic-card', cardPAN: '5351******1234', amount: 42, holderName: 'Private Cardholder' },
        { productId: 'diagnostic-full-card', cardPAN: '5351000000001234' }
      ],
      dataTable: [{ id: 'diagnostic-transaction', amount: -12, transactionDescription: 'MODEL MERCHANT' }]
    }
    fetchMock.once(`${BASE_API_URL}cards`, { body })

    await expect(fetchApi('cards')).resolves.toEqual({ status: 200, body })

    const loggedBody = debug.mock.calls[1][1].body
    expect(loggedBody.accounts).toEqual(body.accounts)
    expect(loggedBody.dataTable).toEqual(body.dataTable)
    expect(loggedBody.cards[0]).toEqual({ ...body.cards[0], holderName: '<string[18]>' })
    expect(loggedBody.cards[1]).toEqual({ ...body.cards[1], cardPAN: '<string[16]>' })
  })

  it('masks the binary statement payload while preserving endpoint and response metadata', async () => {
    fetchMock.once(`${BASE_API_URL}cards/statement`, {
      body: 'Private binary statement content',
      headers: { 'Content-Type': 'application/pdf', 'X-Request-Id': 'statement-diagnostic-id' }
    })
    // The locked fetch-mock uses a legacy Response without arrayBuffer; supply that host capability only.
    const mockedFetch = globalThis.fetch
    const binaryFetch = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
      const response = await mockedFetch(input, options)
      Object.defineProperty(response, 'arrayBuffer', {
        value: async () => new Uint8Array([37, 80, 68, 70]).buffer
      })
      return response
    })

    try {
      const response = await fetchApi('cards/statement', { binaryResponse: true })

      expect(response.body).toBeInstanceOf(ArrayBuffer)
      expect(debug.mock.calls[1][1].body).toBe('<string[8]>')
      expect(JSON.stringify(debug.mock.calls)).toContain('statement-diagnostic-id')
    } finally {
      binaryFetch.mockRestore()
    }
  })
})
