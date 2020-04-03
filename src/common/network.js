import _ from 'lodash'
import { IncompatibleVersionError } from '../errors'
import { sanitize } from './sanitize'
import { bufferToHex } from './utils'

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
  shouldLog && console.debug('request', sanitize({
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
  shouldLog && console.debug('response', sanitize({
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
