import { fetchJson } from '../../common/network'
import get, { getOptArray, getOptBoolean, getOptNumber, getOptString } from '../../types/get'
import { Authorization, Device, Page, QPAY_BASE_URL, QPAY_ENDPOINTS, Session } from './models'

// Current client: auth-B0BQPmou.js and http-client-bgZ5OYD6.js, 2026-11-02.
// Only a recognized UNAUTHORIZED response triggers the authentication workflow.
export class SessionExpiredError extends Error {
  constructor () {
    super('Q-Pay authorization was rejected')
    this.name = 'SessionExpiredError'
  }
}

export class QPayApiError extends Error {
  constructor (readonly status: number, readonly code: string | undefined) {
    super(`Q-Pay request failed (HTTP ${status}, ${code != null && /^[A-Z_0-9]+$/.test(code) ? code : 'UNKNOWN'})`)
    this.name = 'QPayApiError'
  }
}

const RESPONSE_MASK = {
  access_token: true,
  refresh_token: true,
  user_id: true,
  delivery_target: true,
  biometric_credential_id: true,
  data: {
    assets: { networks: { address: true, memo_tag: true } },
    items: {
      cardholder_name: true,
      owner_display_name: true,
      merchant_avatar_url: true
    },
    item: {
      details: {
        address: true,
        counterparty: { display_name: true, avatar_url: true, public_uid: true, user_id: true, username: true }
      }
    }
  }
}

async function request (path: string, session?: Session, body?: unknown): Promise<unknown> {
  const response = await fetchJson(QPAY_BASE_URL + path, {
    method: body === undefined ? 'GET' : 'POST',
    ...(body === undefined ? {} : { body }),
    headers: {
      Origin: 'https://pay.quantera.pro',
      Referer: 'https://pay.quantera.pro/',
      'Accept-Language': 'ru',
      ...(session == null
        ? {}
        : {
            Authorization: `Bearer ${session.accessToken}`,
            'X-Device-Fingerprint': session.device.fingerprint
          })
    },
    sanitizeRequestLog: {
      headers: { Authorization: true, Cookie: true, 'X-Device-Fingerprint': true },
      body: true
    },
    sanitizeResponseLog: {
      headers: { Authorization: true, Cookie: true, 'Set-Cookie': true },
      body: RESPONSE_MASK
    }
  })
  const code = getOptString(response.body, 'error.code') ?? getOptString(response.body, 'code')
  if (response.status === 401 && code === 'UNAUTHORIZED') throw new SessionExpiredError()
  if (response.status < 200 || response.status >= 300) throw new QPayApiError(response.status, code)
  return response.body
}

export async function resolveTenant (): Promise<string> {
  const response = await request(QPAY_ENDPOINTS.config)
  const tenantId = getOptString(response, 'tenant.id')
  assert(tenantId != null && tenantId !== '', 'Q-Pay tenant identifier is missing')
  return tenantId
}

function authorization (response: unknown): Authorization {
  const accessToken = getOptString(response, 'access_token')
  const refreshToken = getOptString(response, 'refresh_token')
  const expiresIn = getOptNumber(response, 'expires_in')
  const stage = getOptString(response, 'auth_stage')
  const methods = getOptArray(response, 'next_step.available_methods') ?? []
  assert(accessToken != null && accessToken !== '' && refreshToken != null && refreshToken !== '',
    'Q-Pay authorization tokens are missing')
  assert(expiresIn != null && Number.isFinite(expiresIn) && expiresIn > 0, 'Invalid Q-Pay authorization lifetime')
  assert(stage === 'active' || stage === 'pending_mfa' || stage === 'pending_pin',
    'Unsupported Q-Pay authorization stage', { stage })
  assert(methods.every(method => typeof method === 'string'), 'Invalid Q-Pay MFA methods')
  assert(getOptBoolean(response, 'biometrics_required') !== true, 'Q-Pay requires unsupported biometric authentication')
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    stage,
    methods: methods as string[],
    pinReset: getOptBoolean(response, 'next_step.pin_reset') === true
  }
}

export async function sendEmailCode (tenantId: string, email: string): Promise<void> {
  const response = await request(QPAY_ENDPOINTS.sendEmail, undefined, { tenant_id: tenantId, email })
  assert(getOptNumber(response, 'expires_in') != null, 'Invalid Q-Pay email challenge response')
}

export async function verifyEmailCode (tenantId: string, email: string, code: string, device: Device): Promise<Authorization> {
  return authorization(await request(QPAY_ENDPOINTS.verifyEmail, undefined, {
    tenant_id: tenantId,
    email,
    code,
    device_id: device.id,
    device_fingerprint: device.fingerprint
  }))
}

export async function verifyPin (session: Session, pin: string): Promise<Authorization> {
  return authorization(await request(QPAY_ENDPOINTS.pin, session, { pin }))
}

export async function sendMfaCode (session: Session, method: string): Promise<void> {
  await request(QPAY_ENDPOINTS.sendMfa, session, { method })
}

export async function verifyMfaCode (session: Session, method: string, code: string): Promise<Authorization> {
  return authorization(await request(QPAY_ENDPOINTS.mfa, session, { method, code }))
}

export async function refreshAuthorization (session: Session): Promise<Authorization> {
  let response: unknown
  try {
    response = await request(QPAY_ENDPOINTS.refresh, undefined, {
      refresh_token: session.refreshToken,
      device_fingerprint: session.device.fingerprint
    })
  } catch (error) {
    // The current application treats a 401/403 refresh rejection as terminal for
    // this session. Other HTTP/transport failures preserve it and remain reportable.
    if (error instanceof QPayApiError && (error.status === 401 || error.status === 403)) throw new SessionExpiredError()
    throw error
  }
  const result = authorization(response)
  if (result.stage !== 'active') throw new SessionExpiredError()
  return result
}

function data (response: unknown): unknown {
  assert(response != null && typeof response === 'object' && 'data' in response, 'Q-Pay response has no data envelope')
  // Degraded flags are normally an object; callers must not accept stale/partial
  // financial data when the server explicitly reports an unavailable source.
  const flags = get(response, 'meta.degraded')
  assert(flags == null || (typeof flags === 'object' && !Array.isArray(flags) &&
    Object.values(flags).every(value => value === false)), 'Q-Pay reports degraded financial data')
  return get(response, 'data')
}

export async function fetchWallet (session: Session): Promise<unknown> {
  return data(await request(QPAY_ENDPOINTS.wallet, session))
}

export async function fetchCards (session: Session): Promise<unknown[]> {
  const response = data(await request(QPAY_ENDPOINTS.cards, session))
  const cards = getOptArray(response, 'items')
  assert(cards != null, 'Q-Pay card list is missing')
  return cards
}

export async function fetchCardBalance (session: Session, cardId: string): Promise<unknown> {
  return data(await request(`${QPAY_ENDPOINTS.cards}/${encodeURIComponent(cardId)}/balance`, session))
}

function page (response: unknown): Page {
  const value = data(response)
  const items = getOptArray(value, 'items')
  const cursor = get(value, 'next_cursor')
  assert(items != null && (cursor === null || typeof cursor === 'string'), 'Invalid Q-Pay history page')
  assert(cursor !== '', 'Empty Q-Pay history cursor')
  return { items, nextCursor: cursor }
}

export async function fetchOperationsPage (session: Session, fromDate: Date, toDate: Date | null | undefined, cursor?: string): Promise<Page> {
  const params = [
    'limit=50',
    `from=${encodeURIComponent(fromDate.toISOString())}`,
    ...(toDate == null ? [] : [`to=${encodeURIComponent(toDate.toISOString())}`]),
    ...(cursor == null ? [] : [`cursor=${encodeURIComponent(cursor)}`])
  ]
  return page(await request(`${QPAY_ENDPOINTS.operations}?${params.join('&')}`, session))
}

export async function fetchOperation (session: Session, id: string): Promise<unknown> {
  const response = data(await request(`${QPAY_ENDPOINTS.operations}/${encodeURIComponent(id)}`, session))
  const item = get(response, 'item')
  assert(item != null && typeof item === 'object' && !Array.isArray(item), 'Q-Pay operation detail is missing')
  return item
}

export async function fetchCardTransactionsPage (session: Session, cardId: string, cursor?: string): Promise<Page> {
  const query = `limit=50${cursor == null ? '' : `&cursor=${encodeURIComponent(cursor)}`}`
  return page(await request(`${QPAY_ENDPOINTS.cards}/${encodeURIComponent(cardId)}/transactions?${query}`, session))
}
