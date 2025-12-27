import get, { getOptString } from '../types/get'
import type { FetchFunc } from '../common/network'
import { makeFetchCookie } from '../common/cookie/fetchCookie'
import { Cookie, CookieJar } from 'tough-cookie'

const ZenMoney = global.ZenMoney as any

const _fetch: FetchFunc = ZenMoney.fetch as FetchFunc
const _fetchCookie = makeFetchCookie(_fetch)
const _fetchWithoutCookies = makeFetchCookie(_fetch, {
  getCookieString: async () => '',
  setCookie: async () => {}
})
const _restoreCookies = ZenMoney.restoreCookies.bind(ZenMoney)
const _saveCookies = ZenMoney.saveCookies.bind(ZenMoney)

const cookieJar = _fetchCookie.cookieJar as CookieJar
const cookieStore = cookieJar.store

const clientPfxs: Record<string, Uint8Array> = {}
const trustedCertificates: string[] = []

global.Headers = ZenMoney.Headers
global.fetch = function (url?: unknown, options?: unknown): any {
  options = typeof url !== 'string' && url != null ? url : options
  const headers = new ZenMoney.Headers(get(options, 'headers') ?? {})
  options = {
    ...(options as Record<string, unknown> ?? {}),
    headers,
    tls: {
      ca: [...trustedCertificates],
      pfx: Object.values(clientPfxs)
    }
  }
  url = getOptString(options, 'url') ?? url
  const cookie = headers.get('cookie')
  const impl: Function = getOptString(options, 'cookies') === 'omit' || getOptString(options, 'credentials') === 'omit'
    ? _fetchWithoutCookies
    : cookie == null
      ? _fetchCookie
      : makeFetchCookie(_fetch, {
        getCookieString: async () => '',
        setCookie: async function (cookieString: string, currentUrl: string, opts: { ignoreError: boolean }) {
          return await cookieJar.setCookie(cookieString, currentUrl, opts)
        }
      })
  return impl.call(this, url, options)
}

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
  const cookieJsonArray = ZenMoney.__cookies as Array<Record<string, unknown>> | null | undefined
  if (cookieJsonArray == null || !Array.isArray(cookieJsonArray) || cookieJsonArray.length <= 0) {
    await cookieStore.removeAllCookies()
    return
  }
  for (const cookieJson of cookieJsonArray) {
    try {
      const cookie = Cookie.fromJSON(({
        key: cookieJson.name,
        ...cookieJson
      }))
      if (cookie != null) {
        await cookieStore.putCookie(cookie)
        continue
      }
      console.warn('Failed to restore cookie:', cookieJson)
    } catch (err) {
      console.warn('Failed to restore cookie:', cookieJson, err)
    }
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

async function setClientPfx (pfx: Uint8Array | null, domain: string): Promise<void> {
  if (pfx == null) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete clientPfxs[domain]
  } else {
    clientPfxs[domain] = pfx
  }
}

async function trustCertificates (certs: string[]): Promise<void> {
  trustedCertificates.push(...certs)
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
    trustCertificates
  }
)
