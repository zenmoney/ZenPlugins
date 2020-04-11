import _ from 'lodash'
import { IncompatibleVersionError } from '../errors'
import { sanitize } from './sanitize'
import { bufferToHex } from './utils'

const cheerio = require('cheerio')

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
      'Accept': 'application/json, text/plain, */*',
      ...options.body && { 'Content-Type': 'application/json;charset=UTF-8' },
      ...options.headers
    },
    parse: (body) => body === '' ? undefined : JSON.parse(body)
  })
}

export function parseXml (xml) {
  const $ = cheerio.load(xml, {
    xmlMode: true
  })
  const object = parseXmlNode($().children()[0])
  if (!object || typeof object !== 'object') {
    throw new Error('Error parsing XML. Unexpected root node')
  }
  return object
}

function parseXmlNode (root) {
  const children = root.children.filter(node => {
    if (node.type === 'text') {
      const value = node.data.trim()
      if (value === '' || value === '?') {
        return false
      }
    }
    return true
  })
  let object = null
  for (const node of children) {
    if (node.type === 'cdata') {
      if (children.length !== 1 || !node.children ||
        node.children.length !== 1 ||
        node.children[0].type !== 'text') {
        throw new Error('Error parsing XML. Unsupported CDATA node')
      }
      return node.children[0].data.trim()
    }
    if (node.type === 'tag') {
      if (object === null) {
        object = {}
      }
      const key = node.name
      let value
      if (!node.children || !node.children.length) {
        if (node.attribs && Object.keys(node.attribs).length > 0) {
          value = {}
        } else {
          value = null
        }
      } else if (node.children.length === 1 &&
        node.children[0].type === 'text') {
        value = node.children[0].data.trim()
        if (value === '') {
          value = null
        }
      } else {
        value = parseXmlNode(node)
      }
      if (value && typeof value === 'object' && node.attribs) {
        Object.assign(value, node.attribs)
      }
      let _value = object[key]
      if (_value !== undefined) {
        if (!Array.isArray(_value)) {
          _value = [_value]
          object[key] = _value
        }
        _value.push(value)
      } else {
        object[key] = value
      }
    }
  }
  return object
}
