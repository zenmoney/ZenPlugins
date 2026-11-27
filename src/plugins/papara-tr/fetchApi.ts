import { cookieJar, fetchJson } from '../../common/network'
import type { FetchResponse } from '../../common/network'

export const API_URL = 'https://webapi.papara.com'
export const WEB_ORIGIN = 'https://www.papara.com'

// Keys masked wherever they appear in request or response bodies.
const SENSITIVE_KEYS = new Set([
  'access_token',
  'humanVerificationToken',
  'password',
  'tfaCode',
  'phoneNumber',
  'phone',
  'email',
  'name',
  'firstName',
  'lastName',
  'fullName',
  'iban',
  'deviceIdentifier',
  'userId',
  'externalUserId',
  'sessionId'
])

// Objects whose `name` is public reference data rather than customer identity.
const PUBLIC_NAME_PARENTS = new Set(['currencyInfo'])

function maskValue (value: unknown): unknown {
  if (typeof value === 'string') return `<string[${value.length}]>`
  if (value === null || value === undefined) return value
  if (typeof value === 'number') return '<number>'
  if (typeof value === 'boolean') return '<bool>'
  return '<value>'
}

export function maskSensitive (value: unknown, parentKey?: string): unknown {
  if (Array.isArray(value)) return value.map(item => maskSensitive(item, parentKey))
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const isPublicName = key === 'name' && parentKey !== undefined && PUBLIC_NAME_PARENTS.has(parentKey)
      result[key] = SENSITIVE_KEYS.has(key) && !isPublicName ? maskValue(item) : maskSensitive(item, key)
    }
    return result
  }
  return value
}

function maskResponseBody (body: unknown): unknown {
  // validate/phone returns the normalized phone number as a bare `data` string.
  if (typeof body === 'object' && body !== null && typeof (body as { data?: unknown }).data === 'string') {
    return maskSensitive({ ...body, data: maskValue((body as { data: string }).data) })
  }
  return maskSensitive(body)
}

const sanitizeRequestLog = { headers: { authorization: true, cookie: true }, body: maskSensitive }
const sanitizeResponseLog = { headers: { 'set-cookie': true }, body: maskResponseBody }

/** Internal control-flow signal: the bearer token was rejected with HTTP 401. */
export class UnauthorizedError extends Error {
  constructor (path: string) {
    super(`Papara rejected the access token for ${path}`)
    this.name = 'UnauthorizedError'
  }
}

export interface PaparaError {
  code: number | null
  message: string | null
}

export interface PaparaResponse {
  succeeded: boolean
  data: unknown
  error: PaparaError | null
}

function parseBody (body: string): unknown {
  if (body === '') return undefined
  try {
    return JSON.parse(body)
  } catch {
    return { nonJsonBodyLength: body.length }
  }
}

function parseEnvelope (response: FetchResponse, path: string): PaparaResponse {
  const body = response.body
  console.assert(typeof body === 'object' && body !== null && typeof (body as { succeeded?: unknown }).succeeded === 'boolean',
    'Unexpected Papara response envelope', { path, status: response.status })
  const envelope = body as { succeeded: boolean, data?: unknown, error?: unknown }
  let error: PaparaError | null = null
  if (typeof envelope.error === 'object' && envelope.error !== null) {
    const raw = envelope.error as { code?: unknown, message?: unknown }
    error = {
      code: typeof raw.code === 'number' ? raw.code : null,
      message: typeof raw.message === 'string' ? raw.message : null
    }
  }
  return { succeeded: envelope.succeeded, data: envelope.data ?? null, error }
}

async function fetchPapara (path: string, options: { method: 'GET' | 'POST', token?: string, body?: unknown }): Promise<PaparaResponse> {
  const response = await fetchJson(`${API_URL}/${path}`, {
    method: options.method,
    headers: {
      Origin: WEB_ORIGIN,
      Referer: `${WEB_ORIGIN}/`,
      ...options.token !== undefined && { Authorization: `Bearer ${options.token}` }
    },
    ...options.body !== undefined && { body: options.body },
    parse: parseBody,
    sanitizeRequestLog,
    sanitizeResponseLog
  })
  if (response.status === 401 && options.token !== undefined) throw new UnauthorizedError(path)
  return parseEnvelope(response, path)
}

/**
 * The web client keeps the deviceIdentifier issued at login in the `Papara-Device-Identifier` cookie
 * and sends it with later logins, so Papara recognizes an already approved device (observed 2026-11-26).
 */
export async function setDeviceIdentifierCookie (deviceIdentifier: string): Promise<void> {
  await cookieJar.setCookie(`Papara-Device-Identifier=${deviceIdentifier}; Domain=papara.com; Path=/; Secure`, `${API_URL}/`)
}

export async function fetchValidatePhone (phoneNumber: string): Promise<PaparaResponse> {
  return await fetchPapara('validate/phone', { method: 'POST', body: { phoneNumber, locale: 'TR', platform: 0 } })
}

export async function fetchLoginPhone (phoneNumber: string, humanVerificationToken: string): Promise<PaparaResponse> {
  return await fetchPapara('login/phone', { method: 'POST', body: { phoneNumber, humanVerificationToken, locale: 'TR', platform: 0 } })
}

export async function fetchLoginPassword (token: string, password: string): Promise<PaparaResponse> {
  return await fetchPapara('login/password', { method: 'POST', token, body: { password } })
}

export async function fetchLoginTfaPush (token: string, tfaCode: string): Promise<PaparaResponse> {
  return await fetchPapara('login/tfapush', { method: 'POST', token, body: { tfaCode, platform: 0 } })
}

export async function fetchIsUserDeviceVerified (token: string): Promise<PaparaResponse> {
  return await fetchPapara('login/isUserDeviceVerified', { method: 'GET', token })
}

export async function fetchBalance (token: string): Promise<PaparaResponse> {
  return await fetchPapara('balance', { method: 'GET', token })
}

// The server rejected pageSize 50 with error 999; 10 is what the web client uses.
export const LEDGER_PAGE_SIZE = 10

export async function fetchLedgersPage (token: string, page: number): Promise<PaparaResponse> {
  return await fetchPapara('user/ledgers', { method: 'POST', token, body: { pageSize: LEDGER_PAGE_SIZE, page, currency: null, category: null } })
}
