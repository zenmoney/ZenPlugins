/* global XMLHttpRequest */

import { getTargetUrl, PROXY_TARGET_HEADER, TRANSFERABLE_HEADER_PREFIX } from './shared'
import * as _ from 'lodash'
import { splitCookiesString, parse as parseCookieString } from 'set-cookie-parser'

let lastRequest = null
let lastRequestUrl = null

let throwOnError = true
let defaultEncoding = null
let lastError = null

export const setThrowOnError = value => { throwOnError = value }
export const setDefaultEncoding = value => { defaultEncoding = value }
export const getLastError = () => lastError

export const getLastStatusString = () => lastRequest
  ? 'HTTP/1.1 ' + lastRequest.status + ' ' + lastRequest.statusText
  : null

export const getLastStatusCode = () => lastRequest
  ? lastRequest.status
  : 0

export const getLastResponseHeader = (name) => lastRequest
  ? lastRequest.getResponseHeader(TRANSFERABLE_HEADER_PREFIX + name) || lastRequest.getResponseHeader(name)
  : null

export const getLastResponseHeaders = function () {
  if (!lastRequest) {
    return null
  }
  const strokes = lastRequest.getAllResponseHeaders().split(/\r?\n/)
  const headers = []
  for (let i = 0; i < strokes.length; i++) {
    const idx = strokes[i].indexOf(':')
    const header = [
      strokes[i].substring(0, idx).replace(TRANSFERABLE_HEADER_PREFIX, '').trim(),
      strokes[i].substring(idx + 2)
    ]
    if (header[0].length > 0) {
      headers.push(header)
    }
  }
  return headers
}

export const getLastUrl = () => lastRequestUrl

export const getLastResponseParameters = () => lastRequest
  ? {
    url: getLastUrl(),
    status: getLastStatusString(),
    headers: getLastResponseHeaders()
  }
  : null

function urlEncodeParameters (obj) {
  let str = ''
  for (let key in obj) {
    if (str) {
      str += '&'
    }
    str += key + '=' + encodeURIComponent(obj[key])
  }
  return str
}

export const getResourceSync = (url) => {
  const req = new XMLHttpRequest()
  req.open('GET', url, false)
  req.send()
  return {
    body: req.responseText && req.responseText.length > 0
      ? req.responseText
      : null,
    status: req.status
  }
}

export const handleException = (message) => {
  if (typeof message !== 'string') {
    throw new Error('message must be string')
  }
  lastError = message
  if (throwOnError) {
    throw new Error(message)
  }
  return null
}

const processBody = (body, type) => {
  if (!body || typeof body === 'string' || _.isTypedArray(body)) {
    return body
  }
  switch (type) {
    case 'URL_ENCODING':
      return urlEncodeParameters(body)
    case 'JSON':
      return JSON.stringify(body)
    case 'XML':
      handleException('[NDA] XML type not supported')
      return null
    default:
      throw new Error(`Unknown type ${type}`)
  }
}

export const processHeadersAndBody = ({ headers, body }) => {
  let contentType = null
  let type = 'URL_ENCODING'

  const resultHeaders = Object.entries(headers || {})
    .map(([key, v]) => {
      if (!key || !v) {
        handleException(`[NHE] Wrong header ${JSON.stringify({ key, value: v })}`)
        return null
      }
      const value = v.toString()
      if (body && key.toLowerCase() === 'content-type') {
        contentType = value
        if (typeof body !== 'string') {
          const v = value.toLowerCase()
          if (v.indexOf('json') >= 0) {
            type = 'JSON'
          } else if (v.indexOf('xml') >= 0) {
            type = 'XML'
          }
        }
      }
      return { key, value }
    })
  body = processBody(body, type)
  if (body && !contentType) {
    resultHeaders.push({ key: 'Content-Type', value: 'application/x-www-form-urlencoded; charset=' + (defaultEncoding || 'utf-8') })
  }
  return { headers: resultHeaders, body }
}

const cookies = []
export const getCookies = () => cookies.slice()
export const addCookies = (newCookies) => {
  for (const cookie of newCookies) {
    for (let i = 0; i < cookies.length; i++) {
      const existing = cookies[i]
      if (existing.name === cookie.name) {
        cookies.splice(i, 1)
        break
      }
    }
    if (cookie.value !== null && cookie.value !== undefined) {
      cookies.push(cookie)
    }
  }
}

export const fetchRemoteSync = ({ method, url, headers, body, binaryResponse }) => {
  const req = new XMLHttpRequest()
  req.withCredentials = true
  if (binaryResponse) {
    req.responseType = 'arraybuffer'
  }

  const { origin, pathname, search } = new URL(url)
  const pathWithQueryParams = pathname + search
  req.open(method, pathWithQueryParams, false)

  const { headers: processedHeaders, body: processedBody } = processHeadersAndBody({ headers, body })
  req.setRequestHeader(PROXY_TARGET_HEADER, origin)
  processedHeaders.forEach(({ key, value }) => {
    req.setRequestHeader(TRANSFERABLE_HEADER_PREFIX + key, value)
    if (key.toLowerCase() === 'content-type') {
      req.setRequestHeader(key, value)
    }
  })

  try {
    req.send(processedBody)
    const { pathname, search } = new URL(req.responseURL)
    lastRequest = req
    lastRequestUrl = getTargetUrl(pathname + search, origin)
    const cookieStr = req.getResponseHeader(TRANSFERABLE_HEADER_PREFIX + 'set-cookie')
    if (cookieStr) {
      const now = new Date()
      addCookies(parseCookieString(splitCookiesString(cookieStr)).map(c => {
        const cookie = {}
        cookie.name = c.name
        cookie.value = c.value
        cookie.domain = c.domain || null
        cookie.path = c.path || null
        cookie.persistent = true
        cookie.secure = c.secure || false
        const expires = c.expires ? c.expires : 'maxAge' in c ? new Date(now.getTime() + c.maxAge * 1000) : null
        if (expires) {
          cookie.expires = expires.toUTCString()
        } else {
          cookie.expires = null
        }
        return cookie
      }))
    }
    if (binaryResponse) {
      return req.response
    } else {
      return req.responseText
    }
  } catch (e) {
    handleException('[NER] Connection error. ' + e)
    return null
  }
}
