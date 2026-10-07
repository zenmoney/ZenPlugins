import { fetch, fetchJson } from '../../common/network'
import { TemporaryUnavailableError } from '../../errors'
import { sanitize } from '../../common/sanitize'
import { BASE_API_URL } from './models'

export interface ApiResponse<T> {
  status: number
  body: T
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  sessionToken?: string
  tokenType?: string
  rawStringBody?: boolean
  binaryResponse?: boolean
  accept?: string
  retry?: boolean
}

const NETWORK_ERROR_PATTERN = /\[NER\]|\[NTI]|ECONNRESET|ETIMEDOUT|socket hang up/i
const MAX_ATTEMPTS = 3
const PRIVATE_FIELDS = new Set([
  'login', 'mobilephone', 'phonenumber', 'phone', 'email', 'password', 'pin', 'otp', 'codeword',
  'token', 'sessiontoken', 'refreshtoken', 'accesstoken', 'idtoken', 'registrationtoken', 'deviceuid',
  'authorization', 'cookie', 'setcookie',
  'firstname', 'lastname', 'middlename', 'fullname', 'latfirstname', 'latlastname', 'datebirth',
  'certnumber', 'seriesnumber', 'personalnumber', 'addressregistration', 'addressliving',
  'avatar', 'photo', 'holdername', 'cardholdername', 'embossingname', 'cvv'
])
const PRIVATE_HEADERS = new Set([
  'authorization', 'cookie', 'setcookie', 'token', 'sessiontoken', 'refreshtoken', 'accesstoken', 'idtoken'
])
const CARD_NUMBER_FIELDS = new Set(['pan', 'cardpan', 'cardnumber'])
const normalizeFieldName = (name: string): string => name.replace(/[_-]/g, '').toLowerCase()

const sanitizePayload = (value: unknown, maskCode = false): unknown => {
  if (Array.isArray(value)) return value.map((item) => sanitizePayload(item, maskCode))
  if (value == null || typeof value !== 'object') return value

  return Object.keys(value).reduce<Record<string, unknown>>((result, key) => {
    const field = normalizeFieldName(key)
    const item = (value as Record<string, unknown>)[key]
    const isFullCardNumber = CARD_NUMBER_FIELDS.has(field) &&
      (typeof item === 'string' || typeof item === 'number') && /^\d{12,19}$/.test(String(item).replace(/[ -]/g, ''))
    result[key] = PRIVATE_FIELDS.has(field) || (maskCode && field === 'code') || isFullCardNumber
      ? sanitize(item, true)
      : sanitizePayload(item, maskCode)
    return result
  }, {})
}

const sanitizeRequestPayload = (value: unknown): unknown => sanitizePayload(value, true)
const sanitizeResponsePayload = (value: unknown): unknown => sanitizePayload(value)
const sanitizeHeaders = (value: unknown): unknown => {
  if (value == null || typeof value !== 'object') return value
  return Object.keys(value).reduce<Record<string, unknown>>((result, key) => {
    const item = (value as Record<string, unknown>)[key]
    result[key] = PRIVATE_HEADERS.has(normalizeFieldName(key)) ? sanitize(item, true) : item
    return result
  }, {})
}

const makeUrl = (path: string, query: RequestOptions['query']): string => {
  const values = query ?? {}
  const parameters = Object.keys(values)
    .filter((key) => values[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(values[key]))}`)
    .join('&')

  return `${BASE_API_URL}${path}${parameters.length > 0 ? `?${parameters}` : ''}`
}

/** Requests an endpoint with sanitized diagnostics. */
export const fetchApi = async <T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    Accept: options.accept ?? 'application/json, text/plain, */*',
    'Content-Type': 'application/json;',
    'Platform-Type': 'MOBILE',
    'X-Timezone': 'Europe/Minsk'
  }

  if (options.sessionToken != null) {
    headers.Authorization = `${options.tokenType ?? 'Bearer'} ${options.sessionToken}`
  }

  const maxAttempts = options.retry === false ? 1 : MAX_ATTEMPTS

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await (options.binaryResponse === true ? fetch : fetchJson)(makeUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers,
        body: options.body,
        stringify: options.rawStringBody === true ? (body: unknown): string => String(body) : JSON.stringify,
        binaryResponse: options.binaryResponse,
        log: true,
        sanitizeRequestLog: {
          url: { query: sanitizeRequestPayload },
          headers: sanitizeHeaders,
          body: options.rawStringBody === true ? true : sanitizeRequestPayload
        },
        sanitizeResponseLog: {
          url: { query: sanitizeRequestPayload },
          headers: sanitizeHeaders,
          body: options.binaryResponse === true ? true : sanitizeResponsePayload
        }
      })

      if (response.status < 500 || attempt === maxAttempts) {
        return {
          status: response.status,
          body: response.body as T
        }
      }
    } catch (error) {
      if (!(error instanceof Error) || !NETWORK_ERROR_PATTERN.test(error.message)) {
        throw error
      }
      if (attempt === maxAttempts) break
    }
  }

  throw new TemporaryUnavailableError()
}
