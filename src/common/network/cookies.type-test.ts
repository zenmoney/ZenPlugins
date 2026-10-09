import { cookieJar, saveCookies, restoreCookies, fetch } from './index'
import type { CookieJar } from './index'
import type { Cookie, SerializedCookieJar } from 'tough-cookie'
import { makeFetchCookie } from '../cookie/fetchCookie'

declare function expectType<T> (value: T): void

export async function checkCookieTypes (): Promise<void> {
  expectType<CookieJar>(cookieJar)
  expectType<string>(await cookieJar.getCookieString('https://example.test'))
  expectType<Cookie[]>(await cookieJar.getCookies('https://example.test'))
  expectType<Cookie | undefined>(await cookieJar.setCookie('model=one', 'https://example.test'))
  expectType<SerializedCookieJar>(await cookieJar.serialize())
  expectType<Promise<void>>(cookieJar.removeAllCookies())
  expectType<Promise<void>>(saveCookies())
  expectType<Promise<void>>(restoreCookies())
  makeFetchCookie(fetch, cookieJar)
  // @ts-expect-error Persistence is separate from the standard cookie jar contract.
  cookieJar.commit()
}
