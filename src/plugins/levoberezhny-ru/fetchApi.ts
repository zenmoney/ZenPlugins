import { parse, splitCookiesString } from 'set-cookie-parser'
import { fetch, FetchResponse } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { Auth, StoredCookie } from './models'

export const bankOrigin = 'https://bl-online.nskbl.ru'
const jsonPath = '/mobileService/3.0/json/'

function inferredPath (name: string): string {
  return /^(?:KEYCLOAK_|AUTH_SESSION_ID$|KC_)/.test(name)
    ? '/auth-clustered/realms/mdse_multi/'
    : '/'
}

function defaultPath (pathname: string): string {
  if (!pathname.startsWith('/') || pathname === '/') return '/'
  const index = pathname.lastIndexOf('/')
  return index <= 0 ? '/' : pathname.slice(0, index)
}

function pathMatches (pathname: string, cookiePath: string): boolean {
  return pathname === cookiePath || (pathname.startsWith(cookiePath) && (cookiePath.endsWith('/') || pathname[cookiePath.length] === '/'))
}

function cookieRecords (auth: Auth): StoredCookie[] {
  if (Array.isArray(auth.cookies)) {
    return auth.cookies.filter(cookie => cookie != null && typeof cookie.name === 'string' && cookie.name !== '' && typeof cookie.value === 'string' && typeof cookie.path === 'string' && cookie.path.startsWith('/'))
  }
  const cookies = auth.cookieHeader.split(';').flatMap(pair => {
    const index = pair.indexOf('=')
    if (index <= 0) return []
    const name = pair.slice(0, index).trim()
    if (name === '') return []
    return [{ name, value: pair.slice(index + 1), path: inferredPath(name), expires: null }]
  })
  auth.cookies = cookies
  return cookies
}

function activeCookies (auth: Auth, target: URL): StoredCookie[] {
  const now = Date.now()
  const cookies = cookieRecords(auth).filter(cookie => cookie.expires == null || new Date(cookie.expires).getTime() > now)
  auth.cookies = cookies
  return cookies
    .filter(cookie => pathMatches(target.pathname, cookie.path))
    .sort((left, right) => right.path.length - left.path.length)
}

function updateLegacyHeader (auth: Auth): void {
  auth.cookieHeader = (auth.cookies ?? []).map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
}

export function describeLoginForms (html: string): Array<{ method: string, actionPath: string, inputs: Array<{ name: string, type: string, autocomplete: string }> }> {
  const attribute = (tag: string, name: string): string => new RegExp(`\\b${name}=["']([^"']*)["']`, 'i').exec(tag)?.[1] ?? ''
  return (html.match(/<form\b[^>]*>[\s\S]*?<\/form\s*>/gi) ?? []).map(form => {
    const opening = /^<form\b[^>]*>/i.exec(form)?.[0] ?? ''
    const action = attribute(opening, 'action').replace(/&amp;/g, '&')
    // Never include query parameters, hidden values, labels, phone numbers or text.
    const actionPath = new URL(action, bankOrigin).pathname
    const method = attribute(opening, 'method')
    return {
      method: method === '' ? 'GET' : method.toUpperCase(),
      actionPath,
      inputs: (form.match(/<(?:input|button)\b[^>]*>/gi) ?? []).map(tag => ({
        name: attribute(tag, 'name'),
        type: attribute(tag, 'type'),
        autocomplete: attribute(tag, 'autocomplete')
      }))
    }
  })
}

export function bankUrl (value: string, base = bankOrigin): string {
  const url = new URL(value, base)
  console.assert(url.origin === bankOrigin && url.username === '' && url.password === '', 'Unsafe bank redirect')
  return url.toString()
}

export function readJson (response: FetchResponse): unknown {
  console.assert(response.status === 200, 'Unexpected bank response status', { status: response.status })
  return typeof response.body === 'string' ? JSON.parse(response.body) : response.body
}

export async function request (auth: Auth, url: string, method = 'GET', params?: Record<string, string>): Promise<FetchResponse> {
  const target = bankUrl(url)
  const parsedTarget = new URL(target)
  const requestCookies = activeCookies(auth, parsedTarget)
  const response = await fetch(target, {
    method,
    redirect: 'manual',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'F-Client': 'web',
      'F-Site-Code': 'nskbl',
      Origin: bankOrigin,
      ...(requestCookies.length === 0 ? {} : { Cookie: requestCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ') })
    },
    body: params == null ? undefined : Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'),
    // Login HTML, redirects and client identity are not safe diagnostic payloads.
    // Retain endpoint/status metadata until source-backed field masks are available.
    log: false
  })
  console.debug('Levoberezhny response', { path: new URL(target).pathname, method, status: response.status })
  const headers = response.headers as Record<string, string | undefined>
  const setCookie = headers['set-cookie'] ?? headers['Set-Cookie']
  if (setCookie != null) {
    const received = parse(splitCookiesString(setCookie))
    console.debug('Levoberezhny cookie lifetimes', {
      path: new URL(target).pathname,
      cookies: received.map(cookie => ({
        name: cookie.name,
        path: cookie.path ?? null,
        maxAgeSeconds: cookie.maxAge ?? null,
        expires: cookie.expires?.toISOString() ?? null
      }))
    })
    for (const cookie of received) {
      const sameName = (auth.cookies ?? []).filter(item => item.name === cookie.name)
      // Preserve the sole known path when a rotating cookie omits Path. This
      // keeps migrated sessions scoped while matching the bank's replacement
      // behavior; ambiguous same-name records still use the RFC default path.
      const path = cookie.path ?? (sameName.length === 1 ? sameName[0].path : defaultPath(parsedTarget.pathname))
      // Max-Age takes precedence over Expires; honor explicit bank deletion.
      const expired = cookie.maxAge != null
        ? cookie.maxAge <= 0
        : cookie.expires != null && cookie.expires.getTime() <= Date.now()
      const existing = (auth.cookies ?? []).filter(item => !(item.name === cookie.name && item.path === path))
      auth.cookies = expired
        ? existing
        : [...existing, {
            name: cookie.name,
            value: cookie.value,
            path,
            expires: cookie.maxAge != null
              ? new Date(Date.now() + cookie.maxAge * 1000).toISOString()
              : cookie.expires?.toISOString() ?? null
          }]
    }
  }
  updateLegacyHeader(auth)
  return response
}

export async function requestJson (auth: Auth, endpoint: 'loginInfo' | 'getMyFinancesPage' | 'pfmTape', params: Record<string, string> = {}): Promise<FetchResponse> {
  return await request(auth, bankOrigin + jsonPath + endpoint, 'POST', {
    locale: 'ru',
    reqId: 'WEB' + generateRandomString(5, '0123456789'),
    ...params
  })
}

export function readLoginForm (html: string, base: string): { action: string, fields: Record<string, string> } | null {
  // Same form serialization as primsocbank-ru, restricted to the observed login form.
  const decode = (value: string): string => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  const form = /<form\b[^>]*\bid=["']kc-form-login["'][^>]*>/i.exec(html)?.[0]
  if (form == null) return null
  const action = /\baction=["']([^"']+)["']/i.exec(form)?.[1]
  console.assert(action != null, 'Missing login form action')
  const fields: Record<string, string> = {}
  for (const input of html.match(/<input\b[^>]*>/gi) ?? []) {
    if (!/\btype=["']hidden["']/i.test(input)) continue
    const name = /\bname=["']([^"']+)["']/i.exec(input)?.[1]
    const value = /\bvalue=["']([^"']*)["']/i.exec(input)?.[1] ?? ''
    if (name != null) fields[decode(name)] = decode(value)
  }
  return { action: bankUrl(decode(action ?? ''), base), fields }
}

export function readOtpForm (html: string, base: string): { action: string, fields: Record<string, string> } | null {
  // Observed Android form schema: fingerprint/fsitecode hidden, otp text with
  // autocomplete=one-time-code, login submit. Values stay in memory only.
  const attribute = (tag: string, name: string): string => new RegExp(`\\b${name}=["']([^"']*)["']`, 'i').exec(tag)?.[1] ?? ''
  const decode = (value: string): string => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  for (const form of html.match(/<form\b[^>]*>[\s\S]*?<\/form\s*>/gi) ?? []) {
    const schema = describeLoginForms(form)[0]
    const otpInputs = schema.inputs.filter(input => input.name === 'otp' && input.type === 'text' && input.autocomplete === 'one-time-code')
    const otherInputs = [['fingerprint', 'hidden'], ['fsitecode', 'hidden'], ['login', 'submit']]
    if (schema.method !== 'POST' || otpInputs.length !== 1 || schema.inputs.length !== 4 || otherInputs.some(([name, type]) => !schema.inputs.some(input => input.name === name && input.type === type))) continue
    const opening = /^<form\b[^>]*>/i.exec(form)?.[0] ?? ''
    const action = bankUrl(decode(attribute(opening, 'action')), base)
    console.assert(new URL(action).pathname === '/auth-clustered/realms/mdse_multi/login-actions/authenticate', 'Unexpected bank OTP action')
    const fields: Record<string, string> = {}
    for (const tag of form.match(/<(?:input|button)\b[^>]*>/gi) ?? []) {
      const name = attribute(tag, 'name')
      const type = attribute(tag, 'type')
      if ((type === 'hidden' && ['fingerprint', 'fsitecode'].includes(name)) || (type === 'submit' && name === 'login')) {
        fields[name] = decode(attribute(tag, 'value'))
      }
    }
    return { action, fields }
  }
  return null
}
