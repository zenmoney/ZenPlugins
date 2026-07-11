import { FetchOptions, FetchResponse, fetchJson } from '../../common/network'
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'
import {
  AUTH_FLOW,
  Auth,
  ENDPOINTS,
  JUP_BASE,
  JUP_DOMAIN,
  JUP_HOST,
  JupiterBalance,
  JupiterCard,
  JupiterTransaction,
  Paginated,
  USER_AGENT
} from './models'

const COOKIE_PARAMS = { path: '/' }

// 100 pages x 50 is far beyond a year of card activity; it only guards a runaway loop
// should the API stop reporting totalPages while returning full pages.
const MAX_PAGES = 100

// Jupiter fronts its API with Cloudflare and authorises /api/proxy/* via
// `x-auth-flow: legacy` plus the session cookie, which the sandbox jar attaches.
function browserHeaders (): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
    'x-auth-flow': AUTH_FLOW,
    Origin: JUP_BASE,
    Referer: `${JUP_BASE}/`
  }
}

// All traffic goes through here so credentials stay out of the logs: the shared fetch
// logs every request and response, which would otherwise record the OTP code, the email
// and the access/refresh tokens (including the rotated ones in Set-Cookie).
async function request (url: string, options: FetchOptions = {}): Promise<FetchResponse> {
  const headers = { ...browserHeaders(), ...(options.headers as Record<string, string> | undefined) }
  return await fetchJson(url, {
    ...options,
    headers,
    sanitizeRequestLog: { headers: { Cookie: true }, body: { email: true, code: true } },
    sanitizeResponseLog: { headers: { 'set-cookie': true }, body: { accessToken: true, refreshToken: true } }
  })
}

// Seed the sandbox cookie jar. It then attaches the session to every request and
// captures the refresh rotation, so no request builds a Cookie header by hand.
export async function seedCookies (auth: Auth): Promise<void> {
  await ZenMoney.setCookie(JUP_HOST, 'access_token', auth.accessToken, COOKIE_PARAMS)
  await ZenMoney.setCookie(JUP_HOST, 'refresh_token', auth.refreshToken, COOKIE_PARAMS)
  await ZenMoney.setCookie(JUP_HOST, 'oauth_flow', 'login', COOKIE_PARAMS)
}

// A substring test would also match a lookalike host such as jup.ag.evil.com, letting a
// foreign cookie named access_token in the shared jar pass for our session. The domain
// is nullable at runtime for host-only cookies, whatever the ZenMoney types say.
function isJupiterDomain (domain: string | null | undefined): boolean {
  if (typeof domain !== 'string' || domain === '') {
    return false
  }
  const host = domain.replace(/^\./, '').toLowerCase()
  return host === JUP_DOMAIN || host.endsWith(`.${JUP_DOMAIN}`)
}

export async function currentAuth (): Promise<Auth | null> {
  const cookies = await ZenMoney.getCookies() as Array<{ name: string, value: string, domain: string | null }>
  const find = (name: string): string | undefined =>
    cookies.find((c) => c.name === name && isJupiterDomain(c.domain))?.value
  const accessToken = find('access_token')
  const refreshToken = find('refresh_token')
  return accessToken != null && refreshToken != null ? { accessToken, refreshToken } : null
}

export async function sendCode (email: string): Promise<void> {
  const response = await request(`${JUP_BASE}${ENDPOINTS.sendCode}`, { method: 'POST', body: { email } })
  if (response.status === 429 || response.status >= 500) {
    throw new TemporaryError(`Jupiter ${response.status} when sending the login code`)
  }
  // Jupiter rejected the address itself. A TemporaryError would retry it on every
  // schedule forever without ever telling the user; InvalidPreferencesError is fatal and
  // reopens the settings screen.
  if (response.status >= 400) {
    throw new InvalidPreferencesError(
      'Jupiter did not accept this email address. Check the email in the plugin settings.'
    )
  }
}

export async function verifyCode (email: string, code: string): Promise<Auth> {
  const response = await request(`${JUP_BASE}${ENDPOINTS.verifyCode}`, {
    method: 'POST',
    body: { email, code, type: 'LOGIN' }
  })
  // A rate limit or outage is not a wrong code; saying it is makes the user retype a
  // valid one and burn further send-code calls.
  if (response.status === 429 || response.status >= 500) {
    throw new TemporaryError(`Jupiter ${response.status} when verifying the login code`)
  }
  const body = response.body as { accessToken?: string, refreshToken?: string } | undefined
  if (body?.accessToken == null || body.refreshToken == null) {
    throw new InvalidOtpCodeError()
  }
  const auth: Auth = { accessToken: body.accessToken, refreshToken: body.refreshToken }
  await seedCookies(auth)
  return auth
}

// Only a new email OTP can recover the session. Kept distinct from TemporaryError
// because a re-login emails the user a code: it must never fire for a transient failure.
export class SessionExpiredError extends Error {
  constructor () {
    super('Jupiter session expired — re-login required')
    this.name = 'SessionExpiredError'
  }
}

// POST /api/auth/refresh answers 204 with rotated tokens in Set-Cookie, which the jar
// captures; the retried request then carries the fresh cookie.
async function refreshSession (): Promise<void> {
  const response = await request(`${JUP_BASE}${ENDPOINTS.refresh}`, { method: 'POST' })
  if (response.status === 401 || response.status === 403) {
    throw new SessionExpiredError()
  }
  if (response.status >= 400) {
    throw new TemporaryError(`Jupiter ${response.status} on session refresh`)
  }
  // The rotation invalidates the previous refresh token, so persist the new pair now: a
  // later failure in this run must not leave the dead one stored and force a new OTP.
  const rotated = await currentAuth()
  if (rotated != null) {
    ZenMoney.setData('auth', rotated)
    ZenMoney.saveData()
  }
}

async function authedGet (path: string, query?: Record<string, string | number>): Promise<unknown> {
  const qs = query != null
    ? '?' + Object.entries(query).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : ''
  const url = `${JUP_BASE}${path}${qs}`
  let response = await request(url)
  if (response.status === 401) {
    await refreshSession()
    response = await request(url)
    if (response.status === 401) {
      throw new SessionExpiredError()
    }
  }
  if (response.status >= 400) {
    throw new TemporaryError(`Jupiter ${response.status} for ${path}`)
  }
  return response.body
}

export async function fetchCards (): Promise<JupiterCard[]> {
  const body = await authedGet(ENDPOINTS.cards) as { cards?: unknown } | undefined
  const cards = body?.cards
  return Array.isArray(cards) ? cards as JupiterCard[] : []
}

export async function fetchBalance (): Promise<JupiterBalance> {
  const body = await authedGet(ENDPOINTS.balance)
  // An empty or non-object body must not reach the converter as undefined.currency.
  return (body != null && typeof body === 'object' ? body : {}) as JupiterBalance
}

export async function fetchTransactions (year: number, fromDate: Date): Promise<JupiterTransaction[]> {
  const out: JupiterTransaction[] = []
  // Page-based paging is racy: a transaction arriving mid-crawl shifts the later pages
  // down, so the record on a boundary comes back twice.
  const seenIds = new Set<string>()
  let page = 1

  while (page <= MAX_PAGES) {
    const body = await authedGet(ENDPOINTS.transactions, { page, limit: 50, year }) as Paginated<JupiterTransaction> | undefined
    const rows = body?.data
    const data: JupiterTransaction[] = Array.isArray(rows) ? rows : []

    for (const tx of data) {
      if (new Date(tx.transactionTimestamp ?? '') >= fromDate) {
        const id = tx.id
        if (id != null && id !== '') {
          if (seenIds.has(id)) {
            continue
          }
          seenIds.add(id)
        }
        out.push(tx)
      }
    }

    const totalPages = body?.meta?.totalPages
    if (data.length === 0 || (totalPages != null && page >= totalPages)) {
      break
    }
    const last = data[data.length - 1]
    if (last != null && new Date(last.transactionTimestamp ?? '') < fromDate) {
      break
    }
    page += 1
  }
  return out
}
