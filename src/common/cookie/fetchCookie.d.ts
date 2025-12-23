import type { FetchOptions, FetchResponse, FetchFunc } from '../network'
import { CookieJar, FetchCookieImpl } from 'fetch-cookie'

export interface FetchCookieOptions extends FetchOptions {
  maxRedirect?: number
}

export declare function makeFetchCookie (
  fetch: FetchFunc,
  jar?: CookieJar,
  ignoreError?: boolean
): FetchCookieImpl<string, FetchCookieOptions, FetchResponse>
