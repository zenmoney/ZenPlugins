import _ from 'lodash'
import { sanitize, sanitizeUrlContainingObject } from '../sanitize'

export interface NetworkHeaders extends Pick<Headers, 'entries' | 'get' | 'has' | 'keys' | 'values'> {
  [name: string]: unknown
  forEach: (callback: (value: string, key: string, headers: NetworkHeaders) => void, thisArg?: unknown) => void
}

interface HeaderCollection {
  forEach: (callback: (value: string, key: string) => void) => void
}

let requestNumber = -1

export function generateRequestLogId (): string {
  return `${++requestNumber}`
}

function collectHeaders (collection: HeaderCollection, normalizeName: (name: string) => string): Record<string, string> {
  const object: Record<string, string> = {}
  collection.forEach((value, key) => {
    key = normalizeName(key)
    object[key] = key in object ? `${object[key]}, ${value}` : value
  })
  return object
}

export function convertHeadersToPlainObject (headers: HeadersInit | HeaderCollection): NetworkHeaders {
  const collection = !Array.isArray(headers) && typeof headers.forEach === 'function'
    ? headers as HeaderCollection
    : new Headers(headers as HeadersInit)
  const object = collectHeaders(collection, key => key.toLowerCase())
  const accessors = new Headers(object)
  for (const key of ['entries', 'get', 'has', 'keys', 'values'] as const) {
    if (!(key in object)) {
      Object.defineProperty(object, key, {
        enumerable: false,
        value: (...args: unknown[]) => (accessors[key] as (...args: unknown[]) => unknown)(...args)
      })
    }
  }
  if (!('forEach' in object)) {
    Object.defineProperty(object, 'forEach', {
      enumerable: false,
      value: (callback: (value: string, key: string, headers: NetworkHeaders) => void, thisArg?: unknown) =>
        accessors.forEach((value, key) => callback.call(thisArg, value, key, object as unknown as NetworkHeaders))
    })
  }
  return object as unknown as NetworkHeaders
}

export function sanitizeNetworkLog (value: object, mask: unknown): unknown {
  if (_.isPlainObject(mask)) {
    const options = mask as Record<string, unknown>
    if (_.isPlainObject(options.headers)) {
      const headerMask = _.mapKeys(options.headers as object, (_value, key) => key.toLowerCase())
      mask = {
        ...options,
        headers: (headers: HeadersInit | NetworkHeaders | null | undefined) => {
          if (headers == null) return headers
          const maskValue = (value: unknown, name: string): unknown => sanitize(value, headerMask[name.toLowerCase()])
          if (Array.isArray(headers)) return headers.map(([name, value]) => [name, maskValue(value, name)])
          if (!_.isPlainObject(headers) && typeof headers.forEach === 'function') {
            return _.mapValues(collectHeaders(headers as HeaderCollection, name => name), maskValue)
          }
          return _.mapValues(headers, maskValue)
        }
      }
    }
  }
  return sanitizeUrlContainingObject(value, mask)
}
