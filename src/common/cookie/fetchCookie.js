import '../../polyfills/url'
import _makeFetchCookie from 'fetch-cookie'

export function makeFetchCookie (fetch, jar, ignoreError) {
  function fetchWithoutGlobalCookies (url, options) {
    options = {
      ...options,
      cookies: 'omit'
    }
    return fetch.call(this, url, options)
  }
  return _makeFetchCookie(fetchWithoutGlobalCookies, jar, ignoreError)
}
