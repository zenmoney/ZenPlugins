import get, { getOptString } from '../../types/get'
import { fetch, cookieJar, convertHeadersToPlainObject } from '../../common/network'
import { loginPrimary, SberDevice } from './api'
import { russianTrustedRootCa } from './certificates'
import { InvalidPreferencesError } from '../../errors'
import { object, string, array, JsonObject } from './modernValidation'

// Protocol source: installed ru.sberbankmobile 17.13.0, APK SHA-256
// d978be8cbe8fbaefd19776f6963aa4d851541845df75bd7d69066ab6ea08cc54.
// gr1.e + vr1.a confirm primary login and aggregate session creation;
// mlt.d + o57.a confirm Moscow timestamps and the unified-history request.
// Native Android validation and sanitized source provenance are in the adjacent tests.
export const applicationVersion = '17.13.0'
export interface ModernAuth { guid: string }
export interface ModernSession { host: string, sessionId: string, dataModel: JsonObject }

export function parseMultipart (body: string, contentType: string): JsonObject {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i)
  if (match == null) throw new Error('Missing aggregate response boundary')
  const boundary = match[1] ?? match[2]
  const sections = body.split(`--${boundary}`)
  if (!sections[sections.length - 1].trim().startsWith('--')) throw new Error('Incomplete aggregate response')
  const result: JsonObject = {}
  for (const section of sections.slice(1, -1)) {
    const split = section.indexOf('\r\n\r\n')
    if (split < 0) throw new Error('Invalid aggregate part headers')
    const headers = section.slice(0, split)
    const code = headers.match(/(?:^|\r\n)X-UFS-SubsystemCode:\s*([^\r\n]+)/i)?.[1].trim()
    if (code == null || Object.prototype.hasOwnProperty.call(result, code)) throw new Error('Missing or duplicate aggregate subsystem')
    const part: unknown = JSON.parse(section.slice(split + 4).trim())
    const payload = object(part, 'aggregate subsystem')
    if (payload.success !== true) throw new Error(`Bank subsystem failed: ${code}`)
    result[code] = payload
  }
  if (result.SM_UKO == null || result.MAIN_SCREEN == null) throw new Error('Incomplete bank session subsystems')
  return result
}

function hostUrl (host: string): string {
  if (!/^[a-z0-9-]+\.online\.sberbank\.ru:8543$/i.test(host)) throw new Error('Unexpected mobile bank session host')
  return `https://${host}`
}

const secretHeaders = { Cookie: true, cookie: true, 'Set-Cookie': true, 'set-cookie': true, UCS_SESSION_ID: true, ucs_session_id: true }

export async function authenticate (
  preferences: { login: string, pin: string },
  savedAuth: unknown,
  device: SberDevice,
  persist: (auth: ModernAuth) => Promise<void>,
  isInBackground = false
): Promise<ModernSession> {
  if (!/^\d{5}$/.test(preferences.pin)) throw new InvalidPreferencesError('ПИН-код должен состоять из пяти цифр')
  const guid = getOptString(savedAuth, 'guid')
  const primary = object(await loginPrimary(preferences.login, preferences.pin, guid == null ? undefined : { guid }, device, applicationVersion, isInBackground), 'primary authorization')
  const confirmedGuid = string(primary.guid, 'registered device')
  await persist({ guid: confirmedGuid })
  const host = string(primary.host, 'session host')
  const token = string(primary.token, 'session token')
  const base = hostUrl(host)
  const response = await fetch(`${base}/sm-uko/v3/mobile/aggregate/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept-Charset': 'UTF-8', 'User-Agent': 'Mobile Device' },
    body: { token, version: applicationVersion, platform: 'android' },
    stringify: JSON.stringify,
    parse: function (body) {
      const headers = convertHeadersToPlainObject(this.headers)
      const contentType = Object.entries(headers).find(([key]) => key.toLowerCase() === 'content-type')?.[1]
      return parseMultipart(body, string(contentType, 'aggregate content type'))
    },
    tls: { ca: [russianTrustedRootCa] },
    sanitizeRequestLog: { headers: secretHeaders, body: { token: true } },
    // Multipart contains personal fields in independently serialized subsystems.
    sanitizeResponseLog: { headers: secretHeaders, body: true }
  })
  const parts = object(response.body, 'aggregate response')
  const dataModel = object(get(parts, 'MAIN_SCREEN.body.dataModel'), 'main screen data model')
  const cookies = await cookieJar.getCookies(base)
  const sessionId = cookies.find(cookie => cookie.key === 'UFS-SESSION')?.value
  return { host, dataModel, sessionId: string(sessionId, 'UFS session cookie') }
}

export function formatBankDate (date: Date): string {
  const moscow = new Date(date.getTime() + 3 * 60 * 60 * 1000)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(moscow.getUTCDate())}.${pad(moscow.getUTCMonth() + 1)}.${moscow.getUTCFullYear()}T${pad(moscow.getUTCHours())}:${pad(moscow.getUTCMinutes())}:${pad(moscow.getUTCSeconds())}`
}

export async function fetchArchiveProducts (session: ModernSession, now = new Date()): Promise<JsonObject> {
  // Installed app ywm.q + rwm.a + uym.a: complete PFM product snapshots,
  // including closed products. Dates here are ISO, unlike unified history.
  const response = await fetch(`${hostUrl(session.host)}/personal-finance/pfmassets/v2/mobile/product/history/details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'User-Agent': 'Mobile Device', UCS_SESSION_ID: session.sessionId },
    body: { dateFrom: '2000-01-01', dateTo: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10) },
    stringify: JSON.stringify,
    parse: JSON.parse,
    tls: { ca: [russianTrustedRootCa] },
    sanitizeRequestLog: { headers: secretHeaders },
    sanitizeResponseLog: { headers: secretHeaders, body: () => '<historical product snapshots>' }
  })
  const payload = object(response.body, 'historical products response')
  if (payload.success !== true) throw new Error('Bank historical products request failed')
  return object(payload.body, 'historical products')
}

export async function fetchRequisites (session: ModernSession, ids: string[]): Promise<Map<string, JsonObject>> {
  const result = new Map<string, JsonObject>()
  for (const id of new Set(ids)) {
    const numericId = Number(id)
    if (!Number.isSafeInteger(numericId)) throw new Error('Unsafe card identifier')
    // j17.c + s6e.b: read-only requisites; supports old/closed cards.
    const response = await fetch(`${hostUrl(session.host)}/ufs-product-requisites/rest/v1/getProductRequisites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'User-Agent': 'Mobile Device', UCS_SESSION_ID: session.sessionId },
      body: { id: numericId, type: 'card' },
      stringify: JSON.stringify,
      parse: JSON.parse,
      tls: { ca: [russianTrustedRootCa] },
      sanitizeRequestLog: { headers: secretHeaders },
      sanitizeResponseLog: { headers: secretHeaders, body: () => '<account requisites>' }
    })
    const payload = object(response.body, 'card requisites response')
    if (payload.success !== true) throw new Error('Bank card requisites request failed')
    result.set(id, object(payload.body, 'card requisites'))
  }
  return result
}

export async function fetchOperationDetails (session: ModernSession, ids: string[]): Promise<Map<string, JsonObject>> {
  const details = new Map<string, JsonObject>()
  for (const id of new Set(ids)) {
    // Installed application's ohf.a: read-only operation details, POST { uohId }.
    const response = await fetch(`${hostUrl(session.host)}/uoh-bh/v1/operation/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'User-Agent': 'Mobile Device', UCS_SESSION_ID: session.sessionId },
      body: { uohId: id },
      stringify: JSON.stringify,
      parse: JSON.parse,
      tls: { ca: [russianTrustedRootCa] },
      sanitizeRequestLog: { headers: secretHeaders },
      sanitizeResponseLog: { headers: secretHeaders }
    })
    const payload = object(response.body, 'operation details response')
    if (payload.success !== true) throw new Error('Bank operation details request failed')
    const detail = object(payload.body, 'operation details')
    if (detail.uohId !== id) throw new Error('Bank returned different operation details')
    details.set(id, detail)
  }
  return details
}

export async function fetchHistory (session: ModernSession, fromDate: Date, toDate?: Date | null): Promise<unknown[]> {
  const result: unknown[] = []
  const seen = new Set<string>()
  for (let page = 0; page < 1000; page++) {
    const response = await fetch(`${hostUrl(session.host)}/uoh-bh/v1/operations/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'User-Agent': 'Mobile Device', UCS_SESSION_ID: session.sessionId },
      body: { from: formatBankDate(fromDate), ...(toDate != null ? { to: formatBankDate(toDate) } : {}), paginationSize: 100, paginationOffset: result.length },
      stringify: JSON.stringify,
      parse: JSON.parse,
      tls: { ca: [russianTrustedRootCa] },
      sanitizeRequestLog: { headers: secretHeaders },
      sanitizeResponseLog: { headers: secretHeaders }
    })
    const payload = object(response.body, 'history response')
    if (payload.success !== true) throw new Error('Bank history request failed')
    const items = array(get(payload, 'body.operations'), 'history operations')
    if (items.length === 0) return result
    for (const item of items) {
      const id = string(get(item, 'uohId'), 'history operation ID')
      if (seen.has(id)) throw new Error('History pagination repeated an operation')
      seen.add(id)
      result.push(item)
    }
  }
  throw new Error('History pagination did not terminate')
}
