import { fetchProducts, fetchTransactions, login } from '../api'

function rawResponse (url, body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Bad Request',
    url,
    headers: new global.Headers(headers),
    text: async () => body === undefined ? '' : JSON.stringify(body)
  }
}

describe('UKRSIB network log sanitization', () => {
  let originalFetch
  let transactionRequestCount
  let debugSpy

  beforeEach(() => {
    originalFetch = global.fetch
    transactionRequestCount = 0
    global.ZenMoney = {
      features: {},
      device: {},
      readLine: jest.fn(async () => '123456')
    }
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    global.fetch = jest.fn(async (url) => {
      if (url.endsWith('/auth/verify-app')) {
        return rawResponse(url, undefined, 200, {
          authorization: 'verify-authorization-secret',
          tokenValidFor: '600000',
          dossierId: 'private-dossier-id'
        })
      }
      if (url.endsWith('/auth/login')) {
        return rawResponse(url, {
          loginSessionId: 'private-login-session-id',
          userId: 123456789
        }, 200, {
          authorization: 'login-authorization-secret',
          RefreshToken: 'refresh-token-secret',
          userId: 'private-user-id'
        })
      }
      if (url.endsWith('/profile/postlogin-actions/mandatory')) {
        return rawResponse(url, { actions: [] })
      }
      if (url.endsWith('/product/accountlite')) {
        return rawResponse(url, [{ id: 'diagnostic-account-id', number: '2620******1234' }])
      }
      if (url.endsWith('/product/deposit')) return rawResponse(url, [])
      if (url.endsWith('/product/v2/loan')) return rawResponse(url, { loans: [] })
      if (url.includes('/product/cardlite?')) {
        return rawResponse(url, [{
          id: 'diagnostic-card-id',
          holderName: 'Private Cardholder Name',
          pan: '5351******8896'
        }])
      }
      if (url.endsWith('/product/transactions')) {
        transactionRequestCount++
        return transactionRequestCount === 1
          ? rawResponse(url, [{ id: 'diagnostic-transaction-id', status: 'COMPLETED' }])
          : rawResponse(url, {
            errorCode: 'DIAGNOSTIC_ERROR_CODE',
            description: 'Diagnostic bank error detail'
          }, 400)
      }
      throw new Error(`Unexpected URL in test: ${String(url)}`)
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    debugSpy.mockRestore()
    jest.clearAllMocks()
  })

  it('masks credentials, tokens and personal data while retaining diagnostic payload fields', async () => {
    const session = await login({
      login: '+380991112233',
      password: 'PrivatePassword!'
    }, false, {})
    await fetchProducts(session)
    await expect(fetchTransactions(
      session,
      new Date('2026-08-01T00:00:00Z'),
      new Date('2026-08-02T00:00:00Z')
    )).resolves.toEqual([{ id: 'diagnostic-transaction-id', status: 'COMPLETED' }])
    await expect(fetchTransactions(
      session,
      new Date('2026-08-01T00:00:00Z'),
      new Date('2026-08-02T00:00:00Z')
    )).rejects.toThrow(/UKRSIB API request failed/)

    const transactionRequests = global.fetch.mock.calls.filter(([url]) => url.endsWith('/product/transactions'))
    expect(transactionRequests).toHaveLength(2)
    for (const [, options] of transactionRequests) {
      expect(JSON.parse(options.body)).toMatchObject({ count: 50 })
    }

    const logs = JSON.stringify(debugSpy.mock.calls)
    for (const secret of [
      '+380991112233',
      'PrivatePassword!',
      'verify-authorization-secret',
      'login-authorization-secret',
      'refresh-token-secret',
      'private-dossier-id',
      'private-user-id',
      'private-login-session-id',
      '123456789',
      'Private Cardholder Name'
    ]) {
      expect(logs).not.toContain(secret)
    }
    expect(logs).toContain('<string[')
    expect(logs).toContain('diagnostic-account-id')
    expect(logs).toContain('diagnostic-card-id')
    expect(logs).toContain('diagnostic-transaction-id')
    expect(logs).toContain('DIAGNOSTIC_ERROR_CODE')
    expect(logs).toContain('Diagnostic bank error detail')
    expect(logs).toContain('5351******8896')
  })
})
