import fetchMock from 'fetch-mock'
import { ZPAPIError } from '../../../errors'
import { fetchCards, fetchCardTransactionsPage, fetchWallet, refreshAuthorization, SessionExpiredError, verifyEmailCode } from '../fetchApi'
import { Session } from '../models'

const session: Session = {
  version: 2,
  email: 'model@example.invalid',
  tenantId: 'model-tenant',
  device: { id: 'model-device', fingerprint: 'secret-fingerprint' },
  accessToken: 'secret-access',
  refreshToken: 'secret-refresh',
  expiresAt: Date.parse('2026-12-01T00:00:00Z'),
  stage: 'active',
  methods: [],
  pinReset: false
}

describe('Q-Pay current HTTP transport', () => {
  let debug: jest.SpyInstance
  beforeEach(() => { debug = jest.spyOn(console, 'debug').mockImplementation(() => {}) })
  afterEach(() => { fetchMock.restore(); debug.mockRestore() })

  it('recognizes the observed public UNAUTHORIZED response and keeps diagnostics visible', async () => {
    // Public unauthenticated GET /api/v1/cards, 2026-11-02, app 1.5.770.
    fetchMock.get('https://pay.quantera.pro/api/v1/cards', {
      status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'MISSING_TOKEN' } }
    })
    await expect(fetchCards(session)).rejects.toBeInstanceOf(SessionExpiredError)
    const logs = JSON.stringify(debug.mock.calls)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(logs).toContain('UNAUTHORIZED')
    expect(logs).toContain('MISSING_TOKEN')
    expect(logs).not.toContain(session.accessToken)
    expect(logs).not.toContain(session.device.fingerprint)
  })

  it('unwraps the captured card-list envelope without requiring a card number', async () => {
    // Reduced from user-selected Q-Pay tab GET /cards 200, 2026-11-02,
    // app 1.5.770. Only fields needed for envelope/card-number regression retained.
    const card = {
      id: '00000000-0000-4000-8000-000000000003',
      status: 'active',
      masked_pan: null,
      first4: null,
      last4: null,
      expiry: null
    }
    fetchMock.get('https://pay.quantera.pro/api/v1/cards', { data: { items: [card] } })
    await expect(fetchCards(session)).resolves.toEqual([card])
  })

  it('accepts the observed rotating refresh response and masks both replacement tokens', async () => {
    // Authorized hot refresh, current app 1.5.770, 2026-11-02: HTTP 200,
    // followed by wallet HTTP 200 without OTP. Secrets replaced, lifetime retained.
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1767225600000)
    try {
      fetchMock.post('https://pay.quantera.pro/api/v1/auth/refresh', {
        user_id: '00000000-0000-4000-8000-000000000001',
        access_token: 'replacement-access-secret',
        refresh_token: 'replacement-refresh-secret',
        expires_in: 900,
        auth_stage: 'active'
      })
      await expect(refreshAuthorization(session)).resolves.toEqual({
        accessToken: 'replacement-access-secret',
        refreshToken: 'replacement-refresh-secret',
        expiresAt: 1767226500000,
        stage: 'active',
        methods: [],
        pinReset: false
      })
      expect(JSON.parse(String(fetchMock.lastOptions()?.body))).toEqual({
        refresh_token: session.refreshToken, device_fingerprint: session.device.fingerprint
      })
      const logs = JSON.stringify(debug.mock.calls)
      for (const secret of [session.refreshToken, session.device.fingerprint, 'replacement-access-secret', 'replacement-refresh-secret']) {
        expect(logs).not.toContain(secret)
      }
      expect(logs).toContain('900')
      expect(logs).toContain('active')
    } finally { clock.mockRestore() }
  })

  it('preserves the observed PIN continuation returned after email-code verification', async () => {
    // User-provided Network Preview screenshot, 2026-11-02, POST
    // /auth/email-otp/verify. Authentication secrets and user ID replaced.
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1767225600000)
    try {
      fetchMock.post('https://pay.quantera.pro/api/v1/auth/email-otp/verify', {
        user_id: '00000000-0000-4000-8000-000000000001',
        access_token: 'pending-access-secret',
        auth_stage: 'pending_pin',
        expires_in: 600,
        is_new_user: false,
        next_step: { type: 'pin' },
        refresh_token: 'pending-refresh-secret'
      })
      await expect(verifyEmailCode('model-tenant', session.email, '123456', session.device)).resolves.toEqual({
        accessToken: 'pending-access-secret',
        refreshToken: 'pending-refresh-secret',
        expiresAt: 1767226200000,
        stage: 'pending_pin',
        methods: [],
        pinReset: false
      })
    } finally { clock.mockRestore() }
  })

  it('[model] transmits JSON email verification and masks the code in emitted request logs', async () => {
    // A transport failure exercises serialization/redaction without fabricating
    // a provider authorization response. Request fields match auth-B0BQPmou.js.
    const failure = new Error('model transport failure')
    fetchMock.post('https://pay.quantera.pro/api/v1/auth/email-otp/verify', { throws: failure })
    await expect(verifyEmailCode('model-tenant', 'secret-email@example.invalid', '765432', session.device)).rejects.toBe(failure)
    expect(JSON.parse(String(fetchMock.lastOptions()?.body))).toEqual({
      tenant_id: 'model-tenant',
      email: 'secret-email@example.invalid',
      code: '765432',
      device_id: 'model-device',
      device_fingerprint: 'secret-fingerprint'
    })
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('secret-email@example.invalid')
    expect(logs).not.toContain('765432')
    expect(logs).not.toContain('secret-fingerprint')
    expect(logs).toContain('/auth/email-otp/verify')
  })

  it('[model] masks response secrets and personal identity while retaining source diagnostics', async () => {
    // Synthetic secret sentinels surround a captured reduced card envelope;
    // this verifies the actual HTTP log path, not provider interpretation.
    fetchMock.get('https://pay.quantera.pro/api/v1/cards', {
      headers: { 'Set-Cookie': 'secret-cookie', Authorization: 'secret-response-token' },
      body: {
        access_token: 'secret-response-access',
        refresh_token: 'secret-response-refresh',
        delivery_target: 'secret-email@example.invalid',
        data: { items: [{ id: 'diagnostic-card', owner_display_name: 'Private Model Person', merchant_name: 'Visible Merchant' }] }
      }
    })
    await fetchCards(session)
    const logs = JSON.stringify(debug.mock.calls)
    for (const secret of ['secret-cookie', 'secret-response-token', 'secret-response-access', 'secret-response-refresh',
      'secret-email@example.invalid', 'Private Model Person', session.accessToken, session.device.fingerprint]) {
      expect(logs).not.toContain(secret)
    }
    expect(logs).toContain('diagnostic-card')
    expect(logs).toContain('Visible Merchant')
  })

  it('[model] propagates transport failures unchanged as reportable errors', async () => {
    const failure = new Error('model network failure')
    fetchMock.get('https://pay.quantera.pro/api/v1/wallet', { throws: failure })
    const error = await fetchWallet(session).catch((error: unknown) => error)
    expect(error).toBe(failure)
    expect(error).not.toBeInstanceOf(ZPAPIError)
  })

  it('[model] requests card transactions with the supplied continuation cursor', async () => {
    // Request shape follows the current official client's card transaction API.
    // A transport failure checks serialization without inventing provider records.
    const failure = new Error('model history transport failure')
    fetchMock.get('https://pay.quantera.pro/api/v1/cards/00000000-0000-4000-8000-000000000003/transactions?limit=50&cursor=model-next', { throws: failure })
    await expect(fetchCardTransactionsPage(session, '00000000-0000-4000-8000-000000000003', 'model-next')).rejects.toBe(failure)
    expect(fetchMock.done()).toBe(true)
  })
})
