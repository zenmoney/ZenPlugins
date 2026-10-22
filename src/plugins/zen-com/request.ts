import { fetchJson } from '../../common/network'
import { sanitizeUrl } from '../../common/sanitize'
import { generateUUID } from '../../common/utils'
import { getOptString } from '../../types/get'

export const headerMask = {
  'authentication-access-token': true,
  'app-integrity-token': true,
  'app-check-token': true,
  authorization: true,
  cookie: true,
  'set-cookie': true,
  'access-token': true,
  'refresh-token': true,
  'session-id': true,
  'captcha-token': true,
  'x-csrf-token': true
}

export function sanitizeBody (source: unknown, privateValues = new Set<string>()): unknown {
  const redact = (value: unknown): unknown => {
    if (typeof value === 'string' && value !== '') privateValues.add(value)
    if (value !== null && typeof value === 'object') Object.values(value).forEach(redact)
    return value == null ? value : '<redacted>'
  }
  const fields = (source: unknown, parent = '', transactionType = ''): unknown => {
    if (Array.isArray(source)) return source.map(value => fields(value, parent, transactionType))
    if (source === null || typeof source !== 'object') return source
    const type = getOptString(source, 'transactionType') ?? transactionType
    return Object.fromEntries(Object.entries(source).map(([key, value]: [string, unknown]) => {
      const personalParty = parent === 'party' && (['HTP_EXCHANGE', 'HTP_TRANSFER_OUT', 'HTP_TRANSFER_IN'].includes(type) ||
        (type === 'HTP_TOP_UP' && !['UAB ZEN.COM', 'ZEN.COM UAB'].includes(getOptString(source, 'name') ?? '')))
      const secret = /^(?:token|auth[_-]?token|access[_-]?token|refresh[_-]?token|login[_-]?token|cloning[_-]?token|login|session[_-]?token|session[_-]?id|password|passcode|pin|otp|secret|jwt|captcha[_-]?token|authorization|cookie|set-cookie|firstName|lastName|phoneNumber|email)$/i.test(key)
      const personal = (parent === 'owner' || personalParty) && ['name', 'addressLine1', 'addressLine2'].includes(key)
      // Token envelopes contain useful expiry/scope metadata; only their token is secret.
      const tokenEnvelope = /^(?:access|refresh)[_-]?token$/i.test(key) && value !== null && typeof value === 'object' && !Array.isArray(value)
      return [key, (secret || personal) && !tokenEnvelope ? redact(value) : fields(value, key, type)]
    }))
  }
  const messages = (value: unknown, key = ''): unknown => {
    if (Array.isArray(value)) return value.map(item => messages(item, key))
    if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, messages(item, key)]))
    if (typeof value !== 'string') return value
    const url = /^https?:\/\//.test(value)
    let text = url ? sanitizeUrl(value, { query: (query: unknown) => sanitizeBody(query, privateValues) }) : value
    if (url || key === 'message' || key === 'privateDebug') {
      // Preserve technical errors, removing only known request/response secrets and personal values.
      for (const secret of [...privateValues].sort((a, b) => b.length - a.length)) text = text.split(secret).join('<redacted>')
      return text
    }
    return text
  }
  return messages(fields(source))
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

export async function requestMobile (deviceId: string, path: string, body: object | undefined, authHeaders: Record<string, string> = {}, method: 'POST' | 'GET' = 'POST'): Promise<unknown> {
  const requestId = '|' + generateUUID() + '.'
  const privateValues = new Set(Object.entries(authHeaders).filter(([key]) => key.toLowerCase() in headerMask).map(([, value]) => value).filter(value => value !== ''))
  const sanitize = (value: unknown): unknown => sanitizeBody(value, privateValues)
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
    sanitizeRequestLog: { url: { query: sanitize }, headers: headerMask, body: sanitize },
    sanitizeResponseLog: { url: { query: sanitize }, headers: headerMask, body: sanitize }
  })
  assert(response.ok, 'ZEN.COM mobile request failed', { path, requestId, status: response.status, code: getOptString(response.body, 'error.code') })
  return response.body
}
