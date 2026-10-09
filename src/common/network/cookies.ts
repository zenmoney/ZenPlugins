import type { CookieJar } from 'tough-cookie'
import { IncompatibleVersionError } from '../../errors'
import get from '../../types/get'
import { proxyMethod } from '../proxy'

function activeJar (): CookieJar {
  const jar = get(globalThis.fetch, 'cookieJar')
  if (jar === null || typeof jar !== 'object') throw new IncompatibleVersionError()
  return jar as CookieJar
}

/** The active fetch jar; imports do not require the fetch polyfill to be installed yet. */
export const cookieJar = new Proxy({}, {
  get (_target, key) {
    const jar = activeJar()
    const value: unknown = Reflect.get(jar, key)
    return typeof value === 'function' ? value.bind(jar) : value
  },
  set (_target, key, value: unknown) {
    return Reflect.set(activeJar(), key, value)
  },
  has (_target, key) {
    return key in activeJar()
  }
}) as CookieJar

/** Persist the current cookies; see [persistence](../../../docs/plugins/runtime.md#state-and-lifecycle). */
export async function saveCookies (): Promise<void> {
  await proxyMethod('saveCookies')()
  await proxyMethod('saveData')()
}

export async function restoreCookies (): Promise<void> {
  await proxyMethod('restoreCookies')()
}
