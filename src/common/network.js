import _ from 'lodash'
import { IncompatibleVersionError } from '../errors'
import { sanitizeUrlContainingObject } from './sanitize'
import { bufferToHex, isDebug } from './utils'

export class ParseError {
  constructor (message, response, cause) {
    this.cause = cause
    this.stack = new Error().stack
    this.message = message
    this.response = response
  }
}

let n = -1

export function generateRequestLogId () {
  return `${++n}`
}

export async function fetch (url, options = {}) {
  const init = {
    ..._.omit(options, ['sanitizeRequestLog', 'sanitizeResponseLog', 'log', 'stringify', 'parse']),
    ...options.body && { body: options.stringify ? options.stringify(options.body) : options.body }
  }
  const beforeFetchTicks = Date.now()
  const shouldLog = options.log !== false
  const id = shouldLog && generateRequestLogId()
  shouldLog && console.debug('request', sanitizeUrlContainingObject({
    id,
    url,
    method: init.method || 'GET',
    headers: init.headers,
    ...options.body && { body: options.body }
  }, options.sanitizeRequestLog || false))

  if (options.binaryResponse && (!ZenMoney.features || !ZenMoney.features.binaryResponseBody)) {
    throw new IncompatibleVersionError()
  }

  let response
  try {
    response = await global.fetch(url, init)
  } catch (e) {
    let err
    if (e instanceof TypeError && e.cause) {
      err = e.cause
    } else {
      err = e
    }
    shouldLog && console.debug('response', {
      id,
      ms: Date.now() - beforeFetchTicks,
      url
    }, 'failed to receive due to error', err)
    throw err
  }

  const _headers = response.headers
  const headers = _headers.entries
    ? _.fromPairs([..._headers.entries()])
    : _headers.map
  if (headers) {
    for (const key of [
      'entries',
      'get',
      'has',
      'keys',
      'values'
    ]) {
      if (!(key in headers)) {
        Object.defineProperty(headers, key, {
          enumerable: false,
          value: function () {
            return _headers[key](...arguments)
          }
        })
      }
    }
    if (!('forEach' in headers)) {
      Object.defineProperty(headers, 'forEach', {
        enumerable: false,
        value: (callback, thisArg) => _headers.forEach((value, key) => callback.call(thisArg, value, key, headers))
      })
    }
  }

  response = {
    ..._.pick(response, ['ok', 'status', 'statusText', 'url']),
    headers,
    body: options.binaryResponse ? await response.arrayBuffer() : await response.text()
  }

  let bodyParsingException = null
  if (options.parse) {
    try {
      response.body = options.parse.call(response, response.body)
    } catch (e) {
      bodyParsingException = e
    }
  }
  let bodyLog = response.body
  if (bodyLog) {
    if (_.isTypedArray(bodyLog)) {
      bodyLog = bodyLog.buffer
    }
    if (_.isArrayBuffer(bodyLog)) {
      bodyLog = bufferToHex(bodyLog)
    }
  }

  shouldLog && console.debug('response', sanitizeUrlContainingObject({
    id,
    ms: Date.now() - beforeFetchTicks,
    url: response.url,
    status: response.status,
    headers: response.headers,
    body: bodyLog
  }, options.sanitizeResponseLog || false))

  if (bodyParsingException) {
    throw new ParseError(`Could not parse response. ${bodyParsingException}`, response, bodyParsingException)
  }

  return response
}

export async function fetchJson (url, options = {}) {
  return fetch(url, {
    stringify: JSON.stringify,
    parse: (body) => body === '' ? undefined : JSON.parse(body),
    ...options,
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...options.body && { 'Content-Type': 'application/json;charset=UTF-8' },
      ...options.headers
    }
  })
}

export const RequestInterceptMode = {
  LOAD: undefined,
  BLOCK: true,
  OPEN_AS_DEEP_LINK: 2
}

export async function openWebViewAndInterceptRequest ({ url, headers, log, sanitizeRequestLog, intercept }) {
  console.assert(typeof url === 'string', 'url must be string')
  console.assert(typeof intercept === 'function', 'intercept must be a function (request) => result')
  if (ZenMoney && ZenMoney.openWebView) {
    return new Promise((resolve, reject) => {
      ZenMoney.openWebView(url, headers, (request, callback) => {
        const id = generateRequestLogId()
        const shouldLog = log !== false
        shouldLog && console.debug('request', sanitizeUrlContainingObject({
          id,
          url: request.url,
          method: request.method || 'GET',
          headers: request.headers || {},
          ...request.body && { body: request.body }
        }, sanitizeRequestLog || false))
        const interceptor = {}
        try {
          const result = intercept.call(interceptor, request)
          if (result) {
            callback(null, result)
          }
          return 'mode' in interceptor ? interceptor.mode : result ? RequestInterceptMode.BLOCK : RequestInterceptMode.LOAD
        } catch (e) {
          callback(e)
          return RequestInterceptMode.BLOCK
        }
      }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  } else if (isDebug()) {
    console.log(url)
    const interceptedRequestUrl = await ZenMoney.readLine(url)
    console.assert(interceptedRequestUrl, 'could not get intercepted request url')
    const result = intercept({ url: interceptedRequestUrl })
    console.assert(result, 'intercepted request url doesn\'t match expectations')
    return result
  } else {
    throw new IncompatibleVersionError()
  }
}

export function parseHeaderParameters (header) {
  const pairs = []
  const regex = /;\s*(?:([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)=(?:([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)|"([^"]*)"))?/g
  while (true) {
    const match = regex.exec(header)
    if (!match) {
      break
    }
    pairs.push([match[1], match[2] || match[3]])
  }
  return pairs
}
