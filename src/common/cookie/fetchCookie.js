import '../../polyfills/url'
import _makeFetchCookie from 'fetch-cookie'

export function makeFetchCookie (fetch, jar, ignoreError) {
  return _makeFetchCookie(fetch, jar, ignoreError)
}
