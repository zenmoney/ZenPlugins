import fetchMock from 'fetch-mock'
import { authenticate, fetchTransactions } from '../api'
import { fetchAccounts, refreshToken } from '../fetchApi'
import { Auth } from '../models'

const preferences = { refreshToken: 'refresh-secret', clientAuth: 'basic-secret', clientId: 'client-id' }
const auth: Auth = { ...preferences, accessToken: 'access-secret', expiresAt: 1 }

// Synthetic protocol-shaped data models orchestration and secret handling only.
// It is not bank evidence and does not verify financial interpretation.
describe('[model] MyAmeria transport', () => {
  afterEach(() => {
    fetchMock.restore()
    jest.restoreAllMocks()
  })

  it('masks actual token request/response logs and encodes credentials', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://account.myameria.am/auth/realms/ameria/protocol/openid-connect/token', {
      access_token: 'access-secret', refresh_token: 'rotated-secret', expires_in: 300
    })
    await refreshToken(preferences)
    expect(fetchMock.lastOptions()?.body).toBe('grant_type=refresh_token&refresh_token=refresh-secret')
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['refresh-secret', 'basic-secret', 'access-secret', 'rotated-secret']) {
      expect(logs).not.toContain(secret)
    }
    expect(logs).toContain('200')
    expect(logs).toContain('redacted')
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(logs).toContain('https://account.myameria.am/auth/realms/ameria/protocol/openid-connect/token')
    expect(logs).toContain('grant_type')
  })

  it('retains diagnostic payloads while masking nested personal fields and headers', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get(/accounts-and-cards/, {
      headers: { 'Set-Cookie': 'response-cookie-secret', Authorization: 'response-auth-secret', 'X-Request-Id': 'diagnostic-request-42' },
      body: { status: 'success', data: { accountsAndCards: [{ id: 'product-42', balance: 123, cardHolderName: 'private-holder', beneficiaryName: 'private-beneficiary', email: 'private-email', nested: [{ accessToken: 'nested-secret', sessionToken: 'session-secret', phone: 'private-phone', passport: 'private-passport' }] }] } }
    })
    await fetchAccounts('access-secret', 'client-id')
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['access-secret', 'private-email', 'private-holder', 'private-beneficiary', 'nested-secret', 'response-cookie-secret', 'response-auth-secret', 'session-secret', 'private-phone', 'private-passport', 'client-id']) expect(logs).not.toContain(secret)
    expect(logs).toContain('product-42')
    expect(logs).toContain('123')
    expect(logs).toContain('diagnostic-request-42')
    expect(logs).toContain('accounts-and-cards?size=100')
    expect(logs).toContain('isFullList=true')
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
  })

  it('masks malformed token response bodies and cookies in actual failure logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post(/openid-connect\/token/, {
      status: 400,
      headers: { 'Set-Cookie': 'failure-cookie-secret', 'X-Request-Id': 'token-failure-42' },
      body: 'malformed-token-secret'
    })
    await expect(refreshToken(preferences)).rejects.toBeDefined()
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['refresh-secret', 'basic-secret', 'failure-cookie-secret', 'malformed-token-secret']) {
      expect(logs).not.toContain(secret)
    }
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(logs).toContain('400')
    expect(logs).toContain('token-failure-42')
    expect(logs).toContain('openid-connect/token')
  })

  it('keeps bank error diagnostics visible while masking secrets in actual failure logs', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.get(/accounts-and-cards/, {
      status: 500,
      body: { status: 'error', code: 'MODEL_FAILURE', message: 'Diagnostic model failure', accessToken: 'error-token-secret' }
    })
    await expect(fetchAccounts('access-secret', 'client-id')).rejects.toBeDefined()
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['access-secret', 'client-id', 'error-token-secret']) expect(logs).not.toContain(secret)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(logs).toContain('500')
    expect(logs).toContain('MODEL_FAILURE')
    expect(logs).toContain('Diagnostic model failure')
  })

  it('persists a rotated token before a later data request fails', async () => {
    fetchMock.post(/openid-connect\/token/, { access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 300 })
    const failure = new Error('modeled transport failure')
    fetchMock.get(/history/, { throws: failure })
    const persist = jest.fn(async () => {})
    const result = await authenticate({ login: 'fixture-user', password: 'fixture-password' }, auth, persist)
    expect(persist).toHaveBeenCalledWith(result)
    expect(result.refreshToken).toBe('new-refresh')
    await expect(fetchTransactions(result, { source: 'history' }, new Date('2026-10-01'), new Date('2026-10-02'))).rejects.toBe(failure)
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('keeps original unknown authentication errors and does not persist', async () => {
    const failure = new Error('modeled authentication transport failure')
    fetchMock.post(/openid-connect\/token/, { throws: failure })
    const persist = jest.fn(async () => {})
    await expect(authenticate({ login: 'fixture-user', password: 'fixture-password' }, auth, persist)).rejects.toBe(failure)
    expect(persist).not.toHaveBeenCalled()
  })

  it('consumes each history page once and terminates using hasNext', async () => {
    fetchMock.get(/history\?.*page=0&/, { body: { status: 'success', data: { transactions: [], hasNext: true } } })
    fetchMock.get(/history\?.*page=1&/, { body: { status: 'success', data: { transactions: [], hasNext: false } } })
    expect(await fetchTransactions(auth, { source: 'history' }, new Date('2026-10-01'), new Date('2026-10-02'))).toEqual([])
    expect(fetchMock.calls(/history\?.*page=0&/)).toHaveLength(1)
    expect(fetchMock.calls(/history\?.*page=1&/)).toHaveLength(1)
  })
})
