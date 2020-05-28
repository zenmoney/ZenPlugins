import _ from 'lodash'
import { parse, stringify } from 'querystring'

export function sanitize (value, mask) {
  if (!mask) {
    return value
  }
  if (_.isFunction(mask)) {
    return mask(value)
  }
  if (_.isObject(mask) && !_.isObject(value)) {
    return value
  }
  if (_.isString(value)) {
    return '<string[' + value.length + ']>'
  }
  if (_.isNumber(value)) {
    return '<number>'
  }
  if (_.isDate(value)) {
    return '<date>'
  }
  if (_.isBoolean(value)) {
    return '<bool>'
  }
  if (_.isArray(value)) {
    return value.map((item) => sanitize(item, mask))
  }
  if (_.isObject(value)) {
    return _.mapValues(value, (val, key) => sanitize(val, mask === true ? true : mask[key]))
  }
  return '<value>'
}

export function sanitizeUrl (url, mask) {
  if (!_.isString(url) || !_.isObject(mask)) {
    return sanitize(url, mask)
  }
  const queryIndex = url.indexOf('?')
  if (queryIndex < 0 || queryIndex >= url.length - 1) {
    return url
  }
  const urlWithoutQuery = url.substring(0, queryIndex)
  const query = parse(url.substring(queryIndex + 1))
  return urlWithoutQuery + stringify(sanitize(query, mask.query)).replace(/%3Cstring%5B(\d+)%5D%3E/g, '<string[$1]>')
}

export function sanitizeUrlContainingObject (object, mask) {
  if (!_.isObject(object) || !_.isObject(mask) || !('url' in object) || !('url' in mask)) {
    return sanitize(object, mask)
  }
  return sanitize(object, {
    ...mask,
    url: (url) => sanitizeUrl(url, mask.url)
  })
}
