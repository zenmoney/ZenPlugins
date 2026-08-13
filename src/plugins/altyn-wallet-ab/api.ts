import { fetch, fetchJson, FetchResponse } from '../../common/network'
import { getString } from '../../types/get'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { AltynAccount, AltynTransaction, Preferences } from './models'
import { fetchAccounts, fetchTransactions, LK_BASE } from './fetchApi'
// @ts-expect-error нет типов у пакета querystring-browser
import * as qs from 'querystring-browser'

type CookieMap = Map<string, string>

function parseSetCookie (setCookie: unknown): Array<[string, string]> {
  if (setCookie == null) return []
  const list = Array.isArray(setCookie) ? setCookie : [setCookie]
  const result: Array<[string, string]> = []
  for (const raw of list) {
    if (typeof raw !== 'string') continue
    const parts = raw.split(/,\s*(?=[^;]+?=)/)
    for (const cookie of parts) {
      const [pair] = cookie.split(';')
      const eq = pair.indexOf('=')
      if (eq > 0) {
        result.push([pair.slice(0, eq).trim(), pair.slice(eq + 1).trim()])
      }
    }
  }
  return result
}

function updateCookies (cookies: CookieMap, response: FetchResponse): void {
  const headers = response.headers as Record<string, unknown>
  const setCookie = headers.setCookie ?? headers['set-cookie']
  for (const [name, value] of parseSetCookie(setCookie)) {
    cookies.set(name, value)
  }
}

function cookieHeader (cookies: CookieMap): Record<string, string> {
  if (cookies.size === 0) return {}
  const value = [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  return { Cookie: value }
}

// Авторизация через NextAuth: подтверждение токена PIN-кодом.
// Подтверждённая цепочка:
//   1. GET  /api/auth/csrf                         → csrfToken + csrf-cookie
//   2. POST /api/auth/callback/credentials (otp=PIN, token=token, csrf-cookie)
//        → ставит __Secure-next-auth.session-token, сервер помечает токен верифицированным
// api.lk.altyn.one после этого принимает Bearer-токен.
export async function authorize (preferences: Preferences): Promise<void> {
  const cookies: CookieMap = new Map()

  // 1. Получаем csrfToken + csrf-cookie
  const csrfResponse = await fetchJson(`${LK_BASE}/api/auth/csrf`, {
    headers: { Accept: 'application/json', ...cookieHeader(cookies) }
  })
  updateCookies(cookies, csrfResponse)
  const csrfToken = getString(csrfResponse.body, 'csrfToken')

  // 2. Подтверждаем сессию PIN-кодом.
  // ВАЖНО: шлём csrf-cookie обратно — без него сервер вернёт {url:".../signin?csrf=true"}
  const body = qs.stringify({
    otp: preferences.pin,
    token: preferences.token,
    isPinEnabled: 'true',
    redirect: 'false',
    csrfToken,
    callbackUrl: `${LK_BASE}/auth/pin`,
    json: 'true'
  })
  const callbackResponse = await fetch(`${LK_BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
      ...cookieHeader(cookies)
    },
    body
  })
  updateCookies(cookies, callbackResponse)
  if (callbackResponse.status === 401 || callbackResponse.status === 403) {
    throw new InvalidLoginOrPasswordError('Неверный PIN-код или токен Altyn Wallet')
  }
  if (callbackResponse.status >= 400) {
    throw new TemporaryError(`Altyn Wallet: не удалось подтвердить сессию (status ${callbackResponse.status})`)
  }
}

export async function fetchAllAccounts (preferences: Preferences): Promise<AltynAccount[]> {
  return await fetchAccounts(preferences)
}

export async function fetchAllTransactions (
  preferences: Preferences,
  fromDate: Date,
  toDate: Date
): Promise<AltynTransaction[]> {
  return await fetchTransactions(preferences, fromDate, toDate)
}
