import fetchCookie from 'fetch-cookie'
import { CookieJar } from 'tough-cookie'
import { beforeDeadline } from './deadline'

export const MOBILE_ORIGIN = 'https://iphone.bankhapoalim.co.il'
export const WEB_ORIGIN = 'https://login.bankhapoalim.co.il'
export const MOBILE_APP_ID = 'bankApp3Generation'
const ACCOUNTS_PATH = '/ServerServices/general/accounts'
const WEB_COLLECTIONS = new Set([
  ACCOUNTS_PATH, '/ServerServices/foreign-currency/transactions',
  '/ServerServices/deposits-and-savings/deposits', '/ServerServices/deposits-and-savings/savingsDeposits',
  '/ServerServices/credit-and-mortgage/v3/loans', '/ServerServices/credit-and-mortgage/mortgages',
  '/ServerServices/current-account/composite/balanceAndCreditLimit'
])
const AUTH_PATHS = new Set(['/authenticate/verify', '/authenticate/logonotp/init', '/authenticate/logonotp/verify'])
const COOKIE_DOMAINS = new Set(['bankhapoalim.co.il', 'iphone.bankhapoalim.co.il', 'login.bankhapoalim.co.il'])

function record (value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export interface MobileAuth {
  version: 2
  transport: 'mobile'
  cookieStore: string
  cookieHeader: string
  xsrfToken: string | null
  restContext: 'ServerServices'
  identity: string
  acquiredAt: number
}
export interface DirectRequest {
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
  timeout?: number
}
interface NativeRequestInit extends RequestInit { timeout: number }
export interface DirectResponse {
  status: number
  url: string
  headers: Headers
  body: unknown
}

export function isMobileAuth (value: unknown): value is MobileAuth {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return candidate.version === 2 && candidate.transport === 'mobile' &&
    typeof candidate.cookieStore === 'string' && candidate.cookieStore.length <= 262144 &&
    typeof candidate.cookieHeader === 'string' &&
    (candidate.xsrfToken === null || typeof candidate.xsrfToken === 'string') &&
    candidate.restContext === 'ServerServices' &&
    typeof candidate.identity === 'string' && /^[a-f0-9]{64}$/.test(candidate.identity) &&
    typeof candidate.acquiredAt === 'number' && Number.isFinite(candidate.acquiredAt)
}

function restoreJar (snapshot?: string): CookieJar {
  if (snapshot === undefined) return new CookieJar()
  try {
    if (snapshot.length > 262144) throw new Error()
    const value: unknown = JSON.parse(snapshot)
    if (!record(value) || !Array.isArray(value.cookies) || value.cookies.length > 200) throw new Error()
    for (const cookie of value.cookies as unknown[]) {
      if (cookie === null || typeof cookie !== 'object' || Array.isArray(cookie)) throw new Error()
      const entry = cookie as Record<string, unknown>
      if (typeof entry.domain !== 'string' || !COOKIE_DOMAINS.has(entry.domain.replace(/^\./, '')) ||
        typeof entry.key !== 'string' || typeof entry.value !== 'string' || entry.key.length + entry.value.length > 16384) throw new Error()
    }
    return CookieJar.deserializeSync(snapshot)
  } catch {
    throw new Error('Bank Hapoalim stored session is malformed')
  }
}

export class MobileSession {
  private readonly jar: CookieJar
  private active = true
  private readonly transport: ReturnType<typeof fetchCookie<string, NativeRequestInit, Response>>

  constructor (snapshot?: string) {
    this.jar = restoreJar(snapshot)
    const rawFetch = globalThis.fetch
    this.transport = fetchCookie<string, NativeRequestInit, Response>(async (url, options) => await rawFetch.call(globalThis, url, {
      ...options, credentials: 'omit'
    }), {
      getCookieString: async url => {
        this.check()
        return this.jar.getCookieStringSync(url)
      },
      setCookie: async (cookie, url, options) => {
        // Native fetch has no guaranteed abort API. Revoke writes before a
        // timed-out response can rotate cookies in this session.
        if (!this.active) return undefined
        try { return this.jar.setCookieSync(cookie, url, options) } catch {
          throw new Error('Bank Hapoalim returned invalid session cookies')
        }
      }
    }, false)
  }

  check (): void {
    if (!this.active) throw new Error('Bank Hapoalim session is no longer active')
  }

  close (): void { this.active = false }
  isActive (): boolean { return this.active }

  hasSession (): boolean {
    this.check()
    return this.jar.getCookiesSync(MOBILE_ORIGIN + ACCOUNTS_PATH).some(cookie => cookie.key === 'SMSESSION' && cookie.value !== '') &&
      this.jar.getCookiesSync(WEB_ORIGIN + ACCOUNTS_PATH).some(cookie => cookie.key === 'SMSESSION' && cookie.value !== '')
  }

  csrf (): string | null {
    this.check()
    return this.jar.getCookiesSync(MOBILE_ORIGIN + '/authenticate/logonotp/verify').find(cookie => cookie.key === 'csrfcookie')?.value ?? null
  }

  snapshot (identity: string, acquiredAt: number): MobileAuth {
    this.check()
    if (!this.hasSession()) throw new Error('Bank Hapoalim did not provide a complete scoped session')
    const stored = this.jar.serializeSync()
    if (stored === undefined) throw new Error('Bank Hapoalim cookie serialization failed')
    // Access timestamps are not session rotation. Keep expiry/creation data,
    // but do not write persistent state after every ordinary cookie read.
    const cookieStore = JSON.stringify({
      ...stored,
      cookies: stored.cookies.map(cookie => {
        const entry = { ...cookie }
        delete entry.lastAccessed
        return entry
      })
    })
    // Validate the exact persisted representation before replacing known state.
    restoreJar(cookieStore)
    return {
      version: 2,
      transport: 'mobile',
      cookieStore,
      identity,
      acquiredAt,
      cookieHeader: this.jar.getCookieStringSync(WEB_ORIGIN + ACCOUNTS_PATH),
      xsrfToken: this.jar.getCookiesSync(WEB_ORIGIN + ACCOUNTS_PATH).find(cookie => cookie.key === 'XSRF-TOKEN')?.value ?? null,
      restContext: 'ServerServices'
    }
  }

  async request (url: string, options: DirectRequest): Promise<DirectResponse> {
    this.check()
    const parsed = new URL(url)
    const allowed = parsed.username === '' && parsed.password === '' && parsed.hash === '' && (
      (parsed.origin === MOBILE_ORIGIN && (
        (options.method === 'POST' && AUTH_PATHS.has(parsed.pathname)) ||
        (options.method === 'GET' && parsed.pathname === ACCOUNTS_PATH) ||
        (options.method === 'POST' && /^\/ServerServices\/current-account\/transactions(?:\/[^/]+)?$/.test(parsed.pathname))
      )) || (parsed.origin === WEB_ORIGIN && options.method === 'GET' && (
        WEB_COLLECTIONS.has(parsed.pathname) || /^\/ServerServices\/credit-and-mortgage\/v3\/loans\/\d+$/.test(parsed.pathname)
      ))
    )
    if (!allowed || Object.keys(options.headers).some(name => /^(cookie|authorization)$/i.test(name))) throw new Error('Unsupported Bank Hapoalim direct request')
    const timeout = Math.min(options.timeout ?? 15000, 15000)
    if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('Invalid Bank Hapoalim request timeout')
    const operation = AUTH_PATHS.has(parsed.pathname) ? 'authentication' : parsed.pathname.endsWith('/accounts') ? 'accounts' : 'financial data'
    console.debug('Bank Hapoalim direct request', { operation, method: options.method })
    return await beforeDeadline(async () => {
      this.check()
      const response = await this.transport(url, {
        ...options, headers: { 'Accept-Encoding': 'identity', ...options.headers }, redirect: 'manual', timeout
      })
      this.check()
      // Do not guess a final origin when the host omits it or ignores manual redirects.
      if (typeof response.url !== 'string' || response.url === '' || new URL(response.url).origin !== parsed.origin || new URL(response.url).pathname !== parsed.pathname) throw new Error('Bank Hapoalim response origin was not verified')
      const text = await response.text()
      this.check()
      console.debug('Bank Hapoalim direct response', { operation, status: response.status })
      let body: unknown
      if ((response.status === 204 && text === '') || (response.status >= 300 && response.status < 400)) body = undefined
      else {
        try { body = JSON.parse(text) } catch { throw new Error('Bank Hapoalim returned an unexpected non-JSON response') }
      }
      return { status: response.status, url: response.url, headers: response.headers, body }
    }, Date.now() + timeout, () => new Error('Bank Hapoalim direct request timed out'), () => { this.close() })
  }
}

const sessions = new WeakMap<MobileAuth, MobileSession>()
export function mobileSession (auth: MobileAuth): MobileSession {
  let session = sessions.get(auth)
  if (session === undefined) {
    session = new MobileSession(auth.cookieStore)
    sessions.set(auth, session)
  }
  return session
}
export function attachMobileSession (auth: MobileAuth, session: MobileSession): void { sessions.set(auth, session) }
