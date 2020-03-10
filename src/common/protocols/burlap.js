import * as _ from 'lodash'
import padLeft from 'pad-left'
import { IncompatibleVersionError } from '../../errors'
import { getByteLength } from '../stringUtils'

const cheerio = require('cheerio')

export const Type = {
  Int: function (value) { this.value = value },
  Long: function (value) { this.value = value },
  Double: function (value) { this.value = value },
  List: function (items, itemType) {
    console.assert(_.isArray(items), 'Type.List items must be array')
    console.assert(_.isString(itemType) && itemType.length > 0, 'Type.List itemType must be non-empty string')
    this.items = items
    this.itemType = itemType
  }
}

export function stringifyRequestBody (protocolVersion, body) {
  const bodyStr = stringifyToXml({
    sendTimestamp: Math.round(new Date().getTime()),
    ...body
  })
  const bytes = getSignature(protocolVersion, bodyStr)
  if (ZenMoney.features.binaryRequestBody) {
    stringToUtf8ByteArray(protocolVersion + bodyStr, bytes)
    return new Uint8Array(bytes)
  } else if (bytes.some(byte => byte >= 128)) {
    throw new IncompatibleVersionError()
  } else {
    const signatureStr = bytes.map(byte => String.fromCharCode(byte)).join('')
    return signatureStr + protocolVersion + bodyStr
  }
}

export function parseResponseBody (protocolVersion, bodyStr, correlationId) {
  if (bodyStr === '') {
    throw new IncompatibleVersionError()
  }
  const i = bodyStr.indexOf(protocolVersion)
  console.assert(i >= 0 && i <= 10, 'Could not get response protocol version')
  const body = parseXml(bodyStr.substring(i + protocolVersion.length))
  console.assert(correlationId === undefined ||
    (typeof body === 'object' && body.correlationId === correlationId), 'unexpected response')
  return body
}

export function getSignature (protocolVersion, bodyStr) {
  const protocolStrLength = protocolVersion.length
  const num = 1 + protocolStrLength + getByteLength(bodyStr)
  return [
    0xFF & (num >> 24),
    0xFF & (num >> 16),
    0xFF & (num >> 8),
    0xFF & (num),
    protocolStrLength
  ]
}

export function stringifyToXml (object) {
  if (object === null) {
    return '<null></null>'
  } else if (typeof object === 'boolean') {
    return `<boolean>${object === true ? '1' : '0'}</boolean>`
  } else if (typeof object === 'string') {
    return `<string>${object}</string>`
  } else if (object instanceof Type.Int) {
    return `<int>${object.value.toFixed(0)}</int>`
  } else if (object instanceof Type.Long) {
    return `<long>${object.value.toFixed(0)}</long>`
  } else if (object instanceof Type.Double) {
    return `<double>${object.value}</double>`
  } else if (typeof object === 'number' && Number.isInteger(object)) {
    return `<long>${object.toFixed(0)}</long>`
  } else if (typeof object === 'number') {
    return `<double>${object}</double>`
  } else if (object instanceof Date) {
    return '<date>' + object.getUTCFullYear() +
      padLeft(object.getUTCMonth() + 1, 2, '0') +
      padLeft(object.getUTCDate(), 2, '0') + 'T' +
      padLeft(object.getUTCHours(), 2, '0') +
      padLeft(object.getUTCMinutes(), 2, '0') +
      padLeft(object.getUTCSeconds(), 2, '0') + '.000Z</date>'
  } else if (object instanceof Type.List) {
    // List with explicitly given type
    let str = `<list><type>[${object.itemType}</type><length>${object.items.length}</length>`
    object.items.forEach(value => {
      str += stringifyToXml(value)
    })
    str += '</list>'
    return str
  } else if (_.isArray(object)) {
    // List without explicitly given type, all elements are same type, list takes type from first element
    let str = '<list><type>'
    if (object.length > 0) {
      str += '[' + object[0].__type
    }
    str += `</type><length>${object.length}</length>`
    object.forEach(object => {
      str += stringifyToXml(object)
    })
    str += '</list>'
    return str
  } else if (typeof object === 'object') {
    let str = '<map><type>'
    if (object.__type) {
      str += object.__type
    }
    str += '</type>'
    for (const key in object) {
      if (key === '__type') {
        continue
      }
      if (object.hasOwnProperty(key)) {
        str += `${stringifyToXml(key)}${stringifyToXml(object[key])}`
      }
    }
    str += '</map>'
    return str
  } else {
    console.assert(false, 'unsupported xml object', object)
  }
}

export function parseXml (xml, cache = {}) {
  const $ = cheerio.load(xml, {
    xmlMode: true
  })
  const root = $().children()[0].children[0]
  cache = cache || {}
  cache.count = 0
  return parseNode(root, cache)
}

function parseNode (node, cache) {
  if (node.name === 'null') {
    console.assert(!node.children || node.children.length === 0, 'unexpected node null')
    return null
  }
  if (['string', 'long', 'boolean', 'double', 'date', 'int', 'ref'].indexOf(node.name) >= 0) {
    console.assert(!node.children || node.children.length === 0 || (node.children.length === 1 &&
      node.children[0].type === 'text'), `unexpected node ${node.name}`)
    let value = node.children && node.children.length > 0 ? node.children[0].data : null
    if (value !== null) {
      if (node.name === 'long' || node.name === 'int') {
        value = parseInt(value, 10)
        console.assert(!isNaN(value), `unexpected node ${node.name}`)
      } else if (node.name === 'boolean') {
        value = value !== '0'
      } else if (node.name === 'double') {
        value = parseFloat(value)
        console.assert(!isNaN(value), 'unexpected node double')
      } else if (node.name === 'date') {
        const date = new Date(`${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}T` +
          `${value.substring(9, 11)}:${value.substring(11, 13)}:${value.substring(13, 15)}Z`)
        console.assert(!isNaN(date) && date.getFullYear() >= 1900, `unexpected node date ${value}`)
        return date
      } else if (node.name === 'ref') {
        const object = cache[value]
        console.assert(object, `unexpected node ref ${value}`)
        return object
      }
    }
    return value
  }

  console.assert(node.name === 'map' || node.name === 'list', `unexpected node ${node.name}`)
  console.assert(node.children && node.children.length > 0 &&
    node.children[0].name === 'type' &&
    (!node.children[0].children ||
      node.children[0].children.length === 0 ||
      (node.children[0].children.length === 1 && node.children[0].children[0].type === 'text')), `unexpected node ${node.name}`)

  const id = cache.count.toString()
  if (node.name === 'map') {
    const object = {}
    cache[id] = object
    cache.count++
    if (node.children[0].children && node.children[0].children.length === 1) {
      object.__type = node.children[0].children[0].data
    }
    for (let i = 1; i < node.children.length; i += 2) {
      const key = parseNode(node.children[i], cache)
      object[key] = parseNode(node.children[i + 1], cache)
    }
    return object
  }
  if (node.name === 'list') {
    console.assert(node.children && node.children.length > 1 &&
      node.children[1].name === 'length' &&
      node.children[1].children &&
      node.children[1].children.length === 1 &&
      node.children[1].children[0].type === 'text', 'unexpected node list. Could not get length')
    const length = parseInt(node.children[1].children[0].data, 10)
    console.assert(length === node.children.length - 2, 'unexpected node list. Length != actual count of children')
    const object = []
    cache[id] = object
    cache.count++
    for (let i = 2; i < node.children.length; i++) {
      object.push(parseNode(node.children[i], cache))
    }
    return object
  }
}

function stringToUtf8ByteArray (str, out = []) {
  // https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
  let p = out.length
  let i = 0
  for (; i < str.length; i++) {
    let c = str.charCodeAt(i)
    if (c < 128) {
      out[p++] = c
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192
      out[p++] = (c & 63) | 128
    } else if (
      ((c & 0xFC00) === 0xD800) && (i + 1) < str.length &&
      ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF)
      out[p++] = (c >> 18) | 240
      out[p++] = ((c >> 12) & 63) | 128
      out[p++] = ((c >> 6) & 63) | 128
      out[p++] = (c & 63) | 128
    } else {
      out[p++] = (c >> 12) | 224
      out[p++] = ((c >> 6) & 63) | 128
      out[p++] = (c & 63) | 128
    }
  }
  return out
}
