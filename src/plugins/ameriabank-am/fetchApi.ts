import { fetch, fetchJson, FetchResponse } from '../../common/network'
import get, { getString } from '../../types/get'
import { Auth, Preferences, RefreshCredentials, RefreshResult, PushPage, RequestParameters } from './models'
import { browserUserAgent, clientAuthorization } from './authPage'
const baseUrl = 'https://ob.myameria.am/api'
const tokenUrl = 'https://account.myameria.am/auth/realms/ameria/protocol/openid-connect/token'

const secretField = /authorization|cookie|token|secret|password|username|clientauth|client_auth|session|client.?id|creator|userid|executor|ipaddress|passport|email|phone|birth|first.?name|last.?name|full.?name|cardholdername|beneficiaryname|beneficiaryaddress|cardnumber|pan$/i

/** Recursively redact credential and personal fields from network logs. */
export function maskLog (value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskLog)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key, secretField.test(key) && key !== 'sessionStatus' ? '<redacted>' : /^(url|location)$/i.test(key) && typeof item === 'string' ? maskedUrl(item) : maskLog(item)
    ]))
  }
  return value
}

/** Refresh saved credentials and recognize only the bank's confirmed invalid grant. */
export async function refreshToken (credentials: RefreshCredentials): Promise<RefreshResult> {
  const response = await tokenRequest({ grant_type: 'refresh_token', refresh_token: credentials.refreshToken }, credentials.clientAuth)
  if (response.status === 400 && get(response.body, 'error') === 'invalid_grant') return { kind: 'rejected' }
  console.assert(response.status === 200, 'MyAmeria token request failed', { status: response.status })
  return { kind: 'token', token: response.body }
}

/** Load the current browser client configuration without logging its reusable secret. */
export async function fetchClientAuthorization (): Promise<string> {
  const response = await fetch('https://myameria.am/js/vendors~main.js', {
    sanitizeRequestLog: maskLog,
    sanitizeResponseLog: privateBodyLog
  })
  console.assert(response.status === 200 && typeof response.body === 'string', 'MyAmeria client configuration request failed', { status: response.status })
  return clientAuthorization(response.body as string)
}

/** Start a fresh authorization session with independently generated state and nonce. */
export async function fetchAuthorizationPage (state: string, nonce: string): Promise<string> {
  const query = encodedQuery({ client_id: 'banqr-online', redirect_uri: 'https://myameria.am/', state, response_mode: 'fragment', response_type: 'code', scope: 'openid', nonce, kc_locale: 'en' })
  const response = await fetch(`https://account.myameria.am/auth/realms/ameria/protocol/openid-connect/auth?${query}`, {
    redirect: 'manual', sanitizeRequestLog: maskLog, sanitizeResponseLog: privateBodyLog
  })
  console.assert(response.status === 200 && typeof response.body === 'string', 'MyAmeria authorization page request failed', { status: response.status })
  return response.body as string
}

/** Submit credentials to the dynamic action and initiate MyAmeria application approval. */
export async function submitCredentials (action: string, preferences: Preferences, cddc: string): Promise<string> {
  const response = await submitForm(action, { username: preferences.login, password: preferences.password, 'X-Banqr-CDDC': cddc, remember: 'on' })
  console.assert(response.status === 200 && typeof response.body === 'string', 'MyAmeria credential submission failed', { status: response.status })
  return response.body as string
}

/** Poll the external OneSpan request using its captured session identifier. */
export async function fetchPushStatus (sessionId: string): Promise<unknown> {
  const response = await fetchJson(`https://account.myameria.am/push-status?sessionId=${encodeURIComponent(sessionId)}`, {
    sanitizeRequestLog: maskLog, sanitizeResponseLog: maskLog
  })
  console.assert(response.status === 200, 'MyAmeria confirmation status request failed', { status: response.status })
  return response.body
}

/** Submit the accepted external request identity and retain the manual authorization redirect. */
export async function confirmLogin (page: PushPage, cddc: string): Promise<string> {
  const response = await submitForm(page.action, { evaluated_request_id: page.evaluatedRequestId, 'X-Banqr-CDDC': cddc, evaluate_action: 'true', form_action: 'submit_button', totp: page.sessionId })
  console.assert(response.status === 302, 'MyAmeria confirmation did not authorize the session', { status: response.status })
  const headers = response.headers
  const location = get(headers, 'location') ?? get(headers, 'Location')
  console.assert(typeof location === 'string' && location.length > 0, 'MyAmeria authorization redirect is missing')
  return location as string
}

/** Exchange the one-time authorization code using current browser client credentials. */
export async function exchangeToken (code: string, clientAuth: string): Promise<unknown> {
  const response = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: 'https://myameria.am/' }, clientAuth)
  console.assert(response.status === 200, 'MyAmeria authorization code exchange failed', { status: response.status })
  return response.body
}

/** Discover the authenticated user's default bank client rather than copying a browser header. */
export async function fetchClientId (accessToken: string): Promise<string> {
  const info = await request('users/info', accessToken, 'null', {}, true)
  const userId = getString({ value: get(info, 'userInfo.id') }, 'value')
  console.assert(userId.length > 0, 'MyAmeria user identity is missing')
  const result = await request(`users/${encodeURIComponent(userId)}/clients`, accessToken, 'null', {}, true)
  const clients = get(result, 'clients')
  console.assert(Array.isArray(clients), 'MyAmeria client list is missing')
  const selected = (clients as unknown[]).filter(client => get(client, 'isDefault') === true)
  console.assert(selected.length === 1, 'MyAmeria default client is ambiguous', { count: selected.length })
  const id = getString({ value: get(selected[0], 'id') }, 'value')
  console.assert(id.length > 0, 'MyAmeria default client identity is missing')
  return id
}

/** Submit an encoded auth form while withholding credential-bearing HTML from logs. */
async function submitForm (action: string, body: RequestParameters): Promise<FetchResponse> {
  return await fetch(action, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://account.myameria.am', 'User-Agent': browserUserAgent() },
    body,
    stringify: encodedQuery,
    sanitizeRequestLog: authRequestLog,
    sanitizeResponseLog: privateBodyLog
  })
}

/** Keep token diagnostics visible while masking every token and the authorization code. */
async function tokenRequest (body: RequestParameters, clientAuth: string): Promise<FetchResponse> {
  return await fetchJson(tokenUrl, {
    method: 'POST',
    headers: { Authorization: `Basic ${clientAuth}`, 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://myameria.am', Referer: 'https://myameria.am/' },
    body,
    stringify: encodedQuery,
    sanitizeRequestLog: authRequestLog,
    sanitizeResponseLog: (log: unknown) => maskLog({ ...logObject(log), body: typeof get(log, 'body') === 'string' ? '<redacted>' : get(log, 'body') })
  })
}

/** Redact form-only authorization fields without hiding ordinary bank error codes. */
function authRequestLog (log: unknown): unknown {
  const body = get(log, 'body')
  return maskLog({ ...logObject(log), body: body !== null && typeof body === 'object' ? Object.fromEntries(Object.entries(body).map(([key, value]) => [key, /^(code|totp|evaluated_request_id)$/i.test(key) ? '<redacted>' : value])) : '<redacted>' })
}

/** Preserve transport diagnostics without exposing inline credentials or private user profiles. */
function privateBodyLog (log: unknown): unknown {
  return maskLog({ ...logObject(log), body: '<redacted>' })
}

/** Hide private profile records while retaining the bank's status and error diagnostics. */
function privateProfileLog (log: unknown): unknown {
  const body = get(log, 'body')
  return maskLog({ ...logObject(log), body: body !== null && typeof body === 'object' ? { ...logObject(body), data: '<redacted>' } : '<redacted>' })
}

/** Narrow the shared network log envelope without accepting arbitrary bank shapes. */
function logObject (log: unknown): Record<string, unknown> {
  return log !== null && typeof log === 'object' ? Object.fromEntries(Object.entries(log)) : {}
}

/** Mask authorization-bearing URL queries and fragments in requests and response headers. */
function maskedUrl (value: string): string {
  return value.replace(/([?&#](?:session_code|session_state|execution|tab_id|sessionId|code|state|nonce)=)[^&#]*/gi, '$1<redacted>')
    .replace(/((?:^|\/)users\/)[^/?]+(\/clients)/, '$1<redacted>$2')
}

/** Fetch the complete accounts and cards listing. */
export async function fetchAccounts (accessToken: string, clientId: string): Promise<unknown> {
  return await request('accounts-and-cards', accessToken, clientId, {
    size: '100', skipApplications: 'true', skipExternalCards: 'true', isFullList: 'true'
  })
}

/** Fetch one zero-based shared history page. */
export async function fetchHistoryPage (accessToken: string, clientId: string, fromDate: Date, toDate: Date, page: number): Promise<unknown> {
  return await request('history', accessToken, clientId, {
    fromDate: String(fromDate.getTime()), toDate: String(toDate.getTime()), page: String(page), size: '100'
  })
}

/** Fetch savings accounts and deposit contracts. */
export async function fetchSavings (auth: Auth): Promise<unknown> {
  return await request('savings', auth.accessToken, auth.clientId, { page: '0', size: '500', skipApplications: 'true' })
}

/** Fetch one one-based deposit history page. */
export async function fetchDepositHistory (auth: Auth, id: string, page: number): Promise<unknown> {
  const path = `savings/deposits/transactions/${encodeURIComponent(id)}`
  const params = { depositId: id, page: String(page), size: '100' }
  return await request(path, auth.accessToken, auth.clientId, params)
}

/** Fetch full card or account details. */
export async function fetchProduct (auth: Auth, kind: string, id: string): Promise<unknown> {
  console.assert(kind === 'CARD' || kind === 'ACCOUNT', 'Unsupported MyAmeria product type')
  const category = kind === 'CARD' ? 'cards' : 'accounts'
  const params: RequestParameters = kind === 'CARD' ? { skipApplications: 'true' } : {}
  const path = `accounts-and-cards/${category}/${encodeURIComponent(id)}`
  return await request(path, auth.accessToken, auth.clientId, params)
}

/** Fetch the settled transaction document. */
export async function fetchTransactionDetail (auth: Auth, id: string): Promise<unknown> {
  const response = await request(`transactions/${encodeURIComponent(id)}`, auth.accessToken, auth.clientId, {})
  return get(response, 'transaction')
}

/** Fetch a successful MyAmeria data envelope with sanitized request and response logs. */
async function request (path: string, accessToken: string, clientId: string, params: RequestParameters, privateProfile = false): Promise<unknown> {
  const query = encodedQuery(params)
  const response = await fetchJson(`${baseUrl}/${path}?${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': clientId,
      Locale: 'hy',
      'Timezone-Offset': '-240',
      Origin: 'https://myameria.am',
      Referer: 'https://myameria.am/'
    },
    sanitizeRequestLog: maskLog,
    sanitizeResponseLog: privateProfile ? privateProfileLog : maskLog
  })
  console.assert(response.status === 200, 'MyAmeria data request failed', { path: maskedUrl(path), status: response.status })
  console.assert(getString({ status: get(response.body, 'status') }, 'status') === 'success', 'MyAmeria response is unsuccessful', { path: maskedUrl(path) })
  return get(response.body, 'data')
}

/** Encode query parameters or form fields without modifying their values. */
function encodedQuery (params: RequestParameters): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}
