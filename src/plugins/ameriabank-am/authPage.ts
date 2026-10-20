import { SHA256, enc } from 'crypto-js'
import { LoginPage, PushPage } from './models'

const authOrigin = 'https://account.myameria.am'
const browserProfile = {
  browser: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
    applicationVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
    applicationCode: 'Mozilla',
    applicationName: 'Netscape',
    cookieEnabled: true,
    javaEnabled: false
  },
  support: {
    ajax: true,
    boxModel: true,
    changeBubbles: true,
    checkClone: true,
    checkOn: true,
    cors: true,
    cssFloat: true,
    hrefNormalized: true,
    htmlSerialize: true,
    leadingWhitespace: true,
    noCloneChecked: true,
    noCloneEvent: true,
    opacity: true,
    optDisabled: true,
    style: true,
    submitBubbles: true,
    tbody: true
  },
  device: {
    screenWidth: 1512,
    screenHeight: 982,
    os: 'Apple MacOS',
    language: 'en-US',
    platform: 'MacIntel',
    timeZone: -240
  },
  plugin: [
    {
      name: 'PDF Viewer',
      file: 'internal-pdf-viewer'
    },
    {
      name: 'Chrome PDF Viewer',
      file: 'internal-pdf-viewer'
    },
    {
      name: 'Chromium PDF Viewer',
      file: 'internal-pdf-viewer'
    },
    {
      name: 'Microsoft Edge PDF Viewer',
      file: 'internal-pdf-viewer'
    },
    {
      name: 'WebKit built-in PDF',
      file: 'internal-pdf-viewer'
    }
  ]
} as const

/** Reproduce the browser profile accepted in the authorized HTTP login on 2026-10-07. */
export function deviceCddc (): string {
  const fingerprintRaw = JSON.stringify(browserProfile)
  const fingerprintHash = SHA256(fingerprintRaw).toString(enc.Hex)
  return enc.Base64.stringify(enc.Latin1.parse(JSON.stringify({ browserCDDC: { fingerprintRaw, fingerprintHash } })))
}

/** Keep the HTTP user agent consistent with the verified browser fingerprint profile. */
export function browserUserAgent (): string {
  return browserProfile.browser.userAgent
}

/** Identify the bank's authorization screen using its captured inline configuration. */
export function pageTemplate (html: string): string {
  return pageValue(html, 'template')
}

/** Read the bank login page without executing its JavaScript. */
export function loginPage (html: string): LoginPage {
  const template = pageValue(html, 'template')
  console.assert(template === 'login', 'Unsupported MyAmeria login template', { template })
  const errorBlock = html.match(/window\.params\.error\s*=\s*\{([^}]*)\}/)?.[1] ?? ''
  return { action: formAction(html), error: errorBlock === '' ? '' : pageValue(errorBlock, 'message') }
}

/** Read only the observed OneSpan application-confirmation flow. */
export function pushPage (html: string): PushPage {
  const template = pageValue(html, 'template')
  console.assert(template === 'loginOTP', 'Unsupported MyAmeria confirmation template', { template })
  console.assert(pageValue(html, 'validationResult') === '' && pageValue(html, 'validationResultExtend') === '', 'Unexpected MyAmeria confirmation validation result')
  console.assert(html.includes('window.params.otpProviders.push("ONESPAN-PHONE")'), 'Unsupported MyAmeria confirmation provider')
  const sessionId = assignedValue(html, 'external_system_request_id')
  const challenge = assignedValue(html, 'external_system_challenge_type')
  console.assert(challenge === 'ChallengeFingerprint', 'Unsupported MyAmeria confirmation challenge', { challenge })
  return { action: formAction(html), evaluatedRequestId: pageValue(html, 'evaluatedRequestId'), sessionId }
}

/** Extract current public-web client credentials without embedding a reusable secret. */
export function clientAuthorization (script: string): string {
  const config = script.match(/KEYCLOAK_CONFIG:\{[^}]+credentials:\{secret:("(?:[^"\\]|\\.)*")/)
  console.assert(config !== null, 'MyAmeria client configuration is missing')
  const secret = parsedJson(config?.[1] ?? '""')
  console.assert(typeof secret === 'string' && secret.length > 0, 'Invalid MyAmeria client configuration')
  return enc.Base64.stringify(enc.Utf8.parse('banqr-online:' + String(secret)))
}

/** Validate the redirect destination and OAuth state before consuming its code. */
export function authorizationCode (location: string, state: string): string {
  const callback = new URL(location)
  console.assert(callback.origin === 'https://myameria.am' && callback.pathname === '/', 'Unexpected MyAmeria authorization redirect')
  const parameters = new URLSearchParams(callback.hash.slice(1))
  console.assert(parameters.get('state') === state, 'MyAmeria authorization state mismatch')
  const code = parameters.get('code')
  console.assert(typeof code === 'string' && code.length > 0, 'MyAmeria authorization code is missing')
  return code as string
}

/** Validate the nonce returned inside the token issued by the TLS-authenticated bank endpoint. */
export function tokenNonce (token: string): string {
  const payload = token.split('.')[1]
  console.assert(typeof payload === 'string' && payload.length > 0, 'Invalid MyAmeria ID token')
  const decoded = enc.Utf8.stringify(enc.Base64.parse(payload.replace(/-/g, '+').replace(/_/g, '/')))
  const value = parsedJson(decoded)
  const nonce = value !== null && typeof value === 'object' && 'nonce' in value ? (value as { readonly nonce: unknown }).nonce : ''
  console.assert(typeof nonce === 'string' && nonce.length > 0, 'MyAmeria token nonce is missing')
  return nonce as string
}

/** Read one JSON-encoded string from the captured inline page configuration. */
function pageValue (html: string, key: string): string {
  const match = html.match(new RegExp('\\b' + key + '\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")'))
  console.assert(match !== null, 'MyAmeria authorization field is missing', { key })
  const value = parsedJson(match?.[1] ?? '""')
  console.assert(typeof value === 'string', 'Invalid MyAmeria authorization field', { key })
  return value as string
}

/** Read the OneSpan external-system identifier from its observed assignment. */
function assignedValue (html: string, key: string): string {
  const match = html.match(new RegExp('externalSystemData\\["' + key + '"\\]\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")'))
  console.assert(match !== null, 'MyAmeria confirmation field is missing', { key })
  const value = parsedJson(match?.[1] ?? '""')
  console.assert(typeof value === 'string' && value.length > 0, 'Invalid MyAmeria confirmation field', { key })
  return value as string
}

/** Restrict credential submissions to the observed bank authentication endpoint. */
function formAction (html: string): string {
  const action = pageValue(html, 'actionUrl').replace(/&amp;/g, '&')
  const url = new URL(action)
  console.assert(url.origin === authOrigin && url.pathname === '/auth/realms/ameria/login-actions/authenticate', 'Unexpected MyAmeria authentication action')
  for (const key of ['session_code', 'execution', 'client_id', 'tab_id']) console.assert(url.searchParams.has(key), 'MyAmeria authentication parameter is missing', { key })
  console.assert(url.searchParams.get('client_id') === 'banqr-online', 'Unexpected MyAmeria OAuth client')
  return action
}

/** Keep malformed credential-bearing JSON out of engine-generated error messages. */
function parsedJson (encoded: string): unknown {
  try {
    return JSON.parse(encoded) as unknown
  } catch {
    throw new Error('Invalid MyAmeria authorization JSON')
  }
}
