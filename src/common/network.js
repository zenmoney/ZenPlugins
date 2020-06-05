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

export async function fetch (url, options = {}) {
  const init = {
    ..._.omit(options, ['sanitizeRequestLog', 'sanitizeResponseLog', 'log', 'stringify', 'parse']),
    ...options.body && { body: options.stringify ? options.stringify(options.body) : options.body }
  }

  const beforeFetchTicks = Date.now()
  const shouldLog = options.log !== false
  shouldLog && console.debug('request', sanitizeUrlContainingObject({
    method: init.method || 'GET',
    url,
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
    shouldLog && console.debug('response', { url, ms: Date.now() - beforeFetchTicks }, 'failed to receive due to error', err)
    throw err
  }
  response = {
    ..._.pick(response, ['ok', 'status', 'statusText', 'url']),
    headers: response.headers.entries ? _.fromPairs([...response.headers.entries()]) : response.headers.map,
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

  const endTicks = Date.now()
  shouldLog && console.debug('response', sanitizeUrlContainingObject({
    ..._.pick(response, ['status', 'url', 'headers']),
    body: bodyLog,
    ms: endTicks - beforeFetchTicks
  }, options.sanitizeResponseLog || false))

  if (bodyParsingException) {
    throw new ParseError(`Could not parse response. ${bodyParsingException}`, response, bodyParsingException)
  }

  return response
}

export async function fetchJson (url, options = {}) {
  return fetch(url, {
    stringify: JSON.stringify,
    ...options,
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...options.body && { 'Content-Type': 'application/json;charset=UTF-8' },
      ...options.headers
    },
    parse: (body) => body === '' ? undefined : JSON.parse(body)
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
        const shouldLog = log !== false
        shouldLog && console.debug('request', sanitizeUrlContainingObject({
          method: request.method || 'GET',
          url: request.url,
          headers: request.headers || {},
          ...request.body && { body: request.body }
        }, sanitizeRequestLog || false))
        try {
          const interceptor = {}
          const result = intercept.call(interceptor, request)
          if (!result) {
            return RequestInterceptMode.LOAD
          }
          callback(null, result)
          return 'mode' in interceptor ? interceptor.mode : RequestInterceptMode.BLOCK
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
