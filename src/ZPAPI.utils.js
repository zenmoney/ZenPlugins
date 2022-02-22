/* global XMLHttpRequest */

import _ from 'lodash'
import { parseHeaderParameters } from './common/network'
import { generateUUID } from './common/utils'
import { getTargetUrl, MANUAL_REDIRECT_HEADER, PROXY_TARGET_HEADER, TRANSFERABLE_HEADER_PREFIX } from './shared'

let lastRequest = null
let lastRequestUrl = null

let throwOnError = true
let defaultEncoding = null
let lastError = null

export const setThrowOnError = value => { throwOnError = value }
export const setDefaultEncoding = value => { defaultEncoding = value }
export const getLastError = () => lastError

export const getLastStatusString = () => lastRequest
  ? 'HTTP/1.1 ' + (lastRequest.getResponseHeader(MANUAL_REDIRECT_HEADER) || (lastRequest.status + ' ' + lastRequest.statusText))
  : null

export const getLastStatusCode = () => lastRequest
  ? lastRequest.getResponseHeader(MANUAL_REDIRECT_HEADER)
    ? parseInt(lastRequest.getResponseHeader(MANUAL_REDIRECT_HEADER).split(/\s/)[0])
    : lastRequest.status
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
    const name = strokes[i].substring(0, idx).trim()
    if ([MANUAL_REDIRECT_HEADER].indexOf(name.toLowerCase()) >= 0) {
      continue
    }
    const header = [
      name.replace(TRANSFERABLE_HEADER_PREFIX, '').trim(),
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
  for (const key in obj) {
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
  if (body instanceof ZenMoney.Blob) {
    return body._getBytes()
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

function encodeFormData (formData, boundary) {
  const chunks = []
  for (const [name, value] of formData) {
    chunks.push(`--${boundary}\r\n`)
    if (value instanceof ZenMoney.Blob) {
      chunks.push(
        `Content-Disposition: form-data; name="${name}"${value.name === undefined ? '' : `; filename="${value.name}"`}\r\n` +
        `Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
        value,
        '\r\n'
      )
    } else {
      chunks.push(
        `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    }
  }
  chunks.push(`--${boundary}--`)
  return new ZenMoney.Blob(chunks)
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
      let value = v.toString()
      if (body && key.toLowerCase() === 'content-type') {
        contentType = value
        if (typeof body !== 'string') {
          const v = value.toLowerCase()
          if (v.indexOf('json') >= 0) {
            type = 'JSON'
          } else if (v.indexOf('xml') >= 0) {
            type = 'XML'
          } else if (v.indexOf('multipart/form-data') >= 0 && body instanceof ZenMoney.FormData) {
            let boundary = parseHeaderParameters(value).find(parameter => parameter[0].toLowerCase() === 'boundary')?.[1]
            if (!boundary) {
              boundary = generateUUID()
              value = value + '; boundary=' + boundary
            }
            body = encodeFormData(body, boundary)
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

export const fetchRemoteSync = ({ method, url, headers, body, binaryResponse, manualRedirect }) => {
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
  if (manualRedirect) {
    req.setRequestHeader(MANUAL_REDIRECT_HEADER, 'true')
  }
  for (const header of processedHeaders) {
    const { key, value } = header
    req.setRequestHeader(TRANSFERABLE_HEADER_PREFIX + key, value)
    if (key.toLowerCase() === 'content-type') {
      req.setRequestHeader(key, value)
    }
  }

  try {
    req.send(processedBody)
    const { pathname, search } = new URL(req.responseURL)
    lastRequest = req
    lastRequestUrl = getTargetUrl(pathname + search, origin)
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
