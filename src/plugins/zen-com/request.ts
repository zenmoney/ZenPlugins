import { fetchJson } from '../../common/network'
import { generateUUID } from '../../common/utils'
import get, { getOptString } from '../../types/get'

export const headerMask = {
  'authentication-access-token': true,
  'app-integrity-token': true,
  'app-check-token': true,
  'device-id': true,
  'mobile-device-id': true,
  'installation-id': true,
  'instance-id': true,
  'metadata-id': true,
  authorization: true,
  cookie: true,
  'set-cookie': true,
  'access-token': true,
  'refresh-token': true,
  'session-id': true,
  'captcha-token': true,
  'x-csrf-token': true
}

export function sanitizeBody (source: unknown, parent = '', transactionType = ''): unknown {
  if (Array.isArray(source)) return source.map(value => sanitizeBody(value, parent, transactionType))
  if (source === null || typeof source !== 'object') return source
  const type = getOptString(source, 'transactionType') ?? transactionType
  return Object.fromEntries(Object.entries(source).map(([key, value]: [string, unknown]) => {
    const personalParty = parent === 'party' && (['HTP_EXCHANGE', 'HTP_TRANSFER_OUT', 'HTP_TRANSFER_IN'].includes(type) ||
      (type === 'HTP_TOP_UP' && !['UAB ZEN.COM', 'ZEN.COM UAB'].includes(getOptString(source, 'name') ?? '')))
    const secret = /^(?:access[_-]?token|refresh[_-]?token|login[_-]?token|cloning[_-]?token|fingerPrintId|login|session[_-]?token|session[_-]?id|password|passcode|pin|otp|secret|jwt|captcha[_-]?token|authorization|cookie|set-cookie|firstName|lastName|phoneNumber|email)$/i.test(key)
    const personal = (parent === 'owner' || personalParty) && ['name', 'addressLine1', 'addressLine2'].includes(key)
    const redacted = secret && value !== null && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).map(([name, field]: [string, unknown]) => [name, name === 'validUntil' ? field : '<redacted>']))
      : value == null ? value : '<redacted>'
    return [key, secret || personal ? redacted : sanitizeBody(value, key, type)]
  }))
}

// Authentication errors can echo account identifiers in free-form messages.
// Keep only explicit diagnostic fields, never an arbitrary response object.
function safeResponse (body: unknown): unknown {
  const errors = get(body, 'error.errors')
  // Only retain field names confirmed in observed validation responses.
  const validationFields = Array.isArray(errors)
    ? errors.map(error => getOptString(error, 'field')).filter(field => field === 'deviceId' || field === 'UserIdentificationDataMustBeValidConstraint')
    : []
  return {
    code: getOptString(body, 'error.code'),
    validationFields,
    nextFactor: getOptString(body, 'nextFactor'),
    blockadeExpirationTime: getOptString(body, 'blockadeExpirationTime'),
    accessValidUntil: getOptString(body, 'accessToken.validUntil'),
    refreshValidUntil: getOptString(body, 'refreshToken.validUntil')
  }
}

function deviceTimeZone (now: Date): string {
  if (typeof Intl !== 'undefined') {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zone !== undefined && zone !== '') return zone
  }
  const offset = -now.getTimezoneOffset()
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0')
  return 'GMT' + (offset >= 0 ? '+' : '-') + hours + ':' + minutes
}

export async function requestMobile (deviceId: string, path: string, body: object | undefined, authHeaders: Record<string, string> = {}, method: 'POST' | 'GET' = 'POST', responseSanitizer: (body: unknown) => unknown = safeResponse): Promise<unknown> {
  const requestId = '|' + generateUUID() + '.'
  const osName = getOptString(ZenMoney.device, 'os.name') ?? ''
  const platform = osName.toLowerCase() === 'android' ? 'Android' : osName
  const now = new Date(Date.now())
  const response = await fetchJson('https://api.zen.com/mobile/' + path, {
    method,
    headers: {
      'Device-Id': deviceId,
      'Request-Id': requestId,
      'App-Version': '2.14.3',
      // The native sync host reports lowercase android; the bank client uses Android.
      'Device-Os-Name': platform,
      // Subtype identifies the target APK's mobile services variant, not OS version.
      'Device-Os-Subtype': 'HUAWEI',
      'Device-Os-Version': getOptString(ZenMoney.device, 'os.version') ?? '',
      'Device-Platform': platform,
      'Device-Timestamp': String(now.getTime()),
      'Device-Timezone': deviceTimeZone(now),
      'Device-Model': getOptString(ZenMoney.device, 'model') ?? '',
      'Device-Language': 'en',
      'Instance-Id': '',
      // The native Android ID is unavailable here; use the stable connection ID.
      // Accepted in owner-controlled cold and repeated fast-login runs.
      'Mobile-Device-Id': deviceId,
      'Installation-Id': deviceId,
      'User-Agent': 'ZEN Mobile',
      ...authHeaders
    },
    body,
    sanitizeRequestLog: { headers: headerMask, body: sanitizeBody },
    sanitizeResponseLog: { headers: headerMask, body: responseSanitizer }
  })
  assert(response.ok, 'ZEN.COM mobile request failed', { path, requestId, status: response.status, code: getOptString(response.body, 'error.code') })
  return response.body
}
