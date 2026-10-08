import get, { getOptString } from '../types/get'
import type { FetchFunc } from '../common/network'
import { makeFetchCookie } from '../common/cookie/fetchCookie'
import { Cookie, CookieJar as ToughCookieJar } from 'tough-cookie'
import { setClientPfx, addTrustedCertificates, withDefaultTls } from '../common/network/tls'

const ZenMoney = global.ZenMoney as any

const _fetch: FetchFunc = ZenMoney.fetch as FetchFunc
const cookieJar = new ToughCookieJar()
const _fetchCookie = makeFetchCookie(_fetch, cookieJar)
const _fetchWithoutCookies = makeFetchCookie(_fetch, {
  getCookieString: async () => '',
  setCookie: async () => {}
})
const _restoreCookies = ZenMoney.restoreCookies.bind(ZenMoney)
const _saveCookies = ZenMoney.saveCookies.bind(ZenMoney)
const _openWebView = ZenMoney.openWebView.bind(ZenMoney)

const cookieStore = cookieJar.store

delete ZenMoney.Headers.prototype.getAll

global.Headers = ZenMoney.Headers
global.fetch = function (url?: unknown, options?: unknown): any {
  options = typeof url !== 'string' && url != null ? url : options
  const headers = new ZenMoney.Headers(get(options, 'headers') ?? {})
  options = {
    ...withDefaultTls(options),
    headers
  }
  url = getOptString(options, 'url') ?? url
  const cookie = headers.get('cookie')
  const impl: Function = getOptString(options, 'cookies') === 'omit' || getOptString(options, 'credentials') === 'omit'
    ? _fetchWithoutCookies
    : cookie == null
      ? _fetchCookie
      : makeFetchCookie(_fetch, {
        getCookieString: async () => '',
        setCookie: async function () {
          return await cookieJar.setCookie.apply(cookieJar, arguments as any)
        }
      })
  return impl.call(this, url, options)
}
Object.defineProperty(global.fetch, 'cookieJar', { value: cookieJar })

async function getCookie (
  name: string,
  params?: { domain?: string | null, path?: string | null } | null
): Promise<string | null> {
  return (await cookieStore.findCookie(params?.domain, params?.path, name))?.value ?? null
}

async function getCookies (): Promise<Array<{
  name: string
  value: string
  domain: string | null
  path: string
  persistent: boolean
  secure: boolean
  expires: string | null
}>> {
  const cookies = await cookieStore.getAllCookies()
  return cookies.map(cookie => ({
    name: cookie.key,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path ?? '/',
    persistent: true,
    secure: cookie.secure,
    expires: cookie.expires instanceof Date ? cookie.expires.toISOString() : null
  }))
}

async function restoreCookies (): Promise<void> {
  await _restoreCookies()
  const snapshot: unknown = ZenMoney.__cookies ?? []
  if (!Array.isArray(snapshot)) throw new Error('Invalid cookie snapshot')
  const cookies = snapshot.map((entry: unknown) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Invalid stored cookie')
    const cookie = Cookie.fromJSON({ key: get(entry, 'name'), ...entry })
    if (cookie == null || cookie.domain == null || cookie.path == null) throw new Error('Invalid stored cookie')
    return cookie
  })
  // Validate the entire snapshot before replacing working cookies; never log cookie values.
  await cookieStore.removeAllCookies()
  for (const cookie of cookies) {
    await cookieStore.putCookie(cookie)
  }
}

async function saveCookies (): Promise<void> {
  const cookies = await cookieStore.getAllCookies()
  const cookieJsonArray = cookies.map(cookie => cookie.toJSON())
  ZenMoney.__cookies = cookieJsonArray
  await _saveCookies()
}

async function setCookie (
  domain: string,
  name: string,
  value?: string | null,
  params?: { path?: string | null, secure?: boolean, expires?: string | null } | null
): Promise<void> {
  if (value == null) {
    await cookieStore.removeCookie(domain, params?.path ?? '/', name)
    return
  }
  const cookieParts: string[] = [`${name}=${value ?? ''}`]
  if (params?.path != null) {
    cookieParts.push(`Path=${params.path}`)
  }
  if (params?.secure === true) {
    cookieParts.push('Secure')
  }
  if (params?.expires != null) {
    cookieParts.push(`Expires=${params.expires}`)
  }
  const url = `https://${domain}${params?.path ?? '/'}`
  const cookie = cookieParts.join('; ')
  await cookieJar.setCookie(cookie, url)
}

function openWebView (url: unknown, headers: unknown, intercept: unknown, callback: unknown, options?: Record<string, unknown>) {
  return _openWebView(url, headers, intercept, callback, withDefaultTls(options))
}

Object.assign(
  ZenMoney,
  {
    getCookie,
    getCookies,
    restoreCookies,
    saveCookies,
    setClientPfx,
    setCookie,
    openWebView,
    trustCertificates: addTrustedCertificates
  }
)
