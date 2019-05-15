import _ from 'lodash'
import { ZPAPIError } from '../errors'
import { sanitize } from './sanitize'

const cheerio = require('cheerio')

export class ParseError extends Error {
  constructor (message, response) {
    super(message)
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

  let response
  try {
    response = await global.fetch(url, init)
  } catch (e) {
    if (e instanceof TypeError && e.cause) {
      throw e.cause
    } else {
      throw e
    }
  }
  let body = await response.text()
  let bodyParsingException = null
  if (options.parse) {
    try {
      body = options.parse(body)
    } catch (e) {
      bodyParsingException = e
    }
  }

  const headers = response.headers.entries ? _.fromPairs([...response.headers.entries()]) : response.headers.map

  response = {
    ..._.pick(response, ['ok', 'status', 'statusText', 'url']),
    body,
    headers
  }

  const endTicks = Date.now()
  shouldLog && console.debug('response', sanitize({
    status: response.status,
    url: response.url,
    headers,
    body,
    ms: endTicks - beforeFetchTicks
  }, options.sanitizeResponseLog || false))

  if (bodyParsingException) {
    if (bodyParsingException instanceof ZPAPIError) {
      throw bodyParsingException
    } else {
      throw new ParseError(`Could not parse response. ${bodyParsingException}`, response)
    }
  }

  return response
}

export async function fetchJson (url, options = {}) {
  return fetch(url, {
    stringify: JSON.stringify,
    ...options,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json;charset=UTF-8',
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
