import * as _ from 'lodash'
import padLeft from 'pad-left'
import { getByteLength } from '../utils'

const cheerio = require('cheerio')

export function stringifyRequestBody (body, protocolVersion) {
  const bodyStr = stringifyToXml({
    sendTimestamp: Math.round(new Date().getTime()),
    ...body
  })
  const signature = getSignature(protocolVersion, bodyStr)
  return (getByteLength(signature) > 5
    ? signature.substring(1)
    : signature) + protocolVersion + bodyStr
}

export function parseResponseBody (bodyStr, protocolVersion, correlationId) {
  if (bodyStr === '') {
    throw new TemporaryError('У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии')
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
  let symbols = _.chunk(padLeft(num.toString(16), 8, '0').split(''), 2)
    .map(hexPair => hexPair.join(''))
    .concat(padLeft(protocolStrLength.toString(16), 2, '0'))
  return symbols
    .map(hexStr => String.fromCharCode(parseInt(hexStr, 16)))
    .join('')
}

export function stringifyToXml (object) {
  if (object === null) {
    return '<null></null>'
  } else if (typeof object === 'boolean') {
    return `<boolean>${object === true ? '1' : '0'}</boolean>`
  } else if (typeof object === 'string') {
    return `<string>${object}</string>`
  } else if (typeof object === 'number') {
    return `<long>${object.toFixed(0)}</long>`
  } else if (object instanceof Date) {
    return '<date>' + object.getUTCFullYear() +
      padLeft(object.getUTCMonth() + 1, 2, '0') +
      padLeft(object.getUTCDate(), 2, '0') + 'T' +
      padLeft(object.getUTCHours(), 2, '0') +
      padLeft(object.getUTCMinutes(), 2, '0') +
      padLeft(object.getUTCSeconds(), 2, '0') + '.000Z</date>'
  } else if (_.isArray(object)) {
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
    throw new Error('unsupported xml object type')
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
