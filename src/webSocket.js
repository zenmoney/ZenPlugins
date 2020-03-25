/* global XMLHttpRequest */

import { PROXY_TARGET_HEADER } from './shared'

const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']

export default class WebSocket {
  constructor (url, protocols, options) {
    const id = initWebSocket(url, options)
    const { pathname } = new URL(url)
    this._url = url
    this._socket = new global.WebSocket(`ws://localhost:5000${pathname}?${PROXY_TARGET_HEADER}=${id}`, protocols)
    this._socket.binaryType = 'arraybuffer'
    this._socket.onopen = () => {
      if (this.onopen) {
        this.onopen({
          target: this,
          type: 'open',
          response: (getWebSocketResponseResult(id) || [])[1] || null
        })
      }
    }
    this._socket.onclose = (event) => {
      if (this.onclose) {
        this.onclose({
          target: this,
          type: 'close',
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean || false
        })
      }
    }
    this._socket.onerror = (event) => {
      if (this.onerror) {
        const result = getWebSocketResponseResult(id)
        this.onerror({
          target: this,
          type: 'error',
          message: 'message' in event
            ? event.message
            : result && result[0] && result[0].message
              ? result[0].message
              : null,
          response: (result && result[1]) || null
        })
      }
    }
    this._socket.onmessage = (event) => {
      if (this.onmessage) {
        this.onmessage({
          target: this,
          type: 'message',
          data: event.data
        })
      }
    }
  }

  get url () {
    return this._url
  }

  get readyState () {
    return this._socket.readyState
  }

  get bufferedAmount () {
    return this._socket.bufferedAmount
  }

  get binaryType () {
    return this._socket.binaryType
  }

  set binaryType (type) {
    if (type !== 'arraybuffer') {
      throw new Error(`Could not change binaryType to ${type}. Only 'arraybuffer' is supported`)
    }
    this._socket.binaryType = type
  }

  get protocol () {
    return this._socket.protocol
  }

  get extensions () {
    return this._socket.extensions
  }

  get CONNECTING () {
    return WebSocket.CONNECTING
  }

  get OPEN () {
    return WebSocket.OPEN
  }

  get CLOSING () {
    return WebSocket.CLOSING
  }

  get CLOSED () {
    return WebSocket.CLOSED
  }

  send (data) {
    this._socket.send(data)
  }

  close (code, reason) {
    this._socket.close(code, reason)
  }
}

readyStates.forEach((readyState, i) => {
  WebSocket[readyState] = i
})

function fetchSync ({ method, url, headers, body, binaryResponse }) {
  const req = new XMLHttpRequest()
  req.withCredentials = true
  if (binaryResponse) {
    req.responseType = 'arraybuffer'
  }

  req.open(method, url, false)

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      req.setRequestHeader(key, value)
    })
  }
  req.send(body)

  const res = {
    url,
    status: req.status,
    statusText: req.statusText,
    headers: {},
    body: null
  }

  const strokes = req.getAllResponseHeaders().split(/\r?\n/)
  for (let i = 0; i < strokes.length; i++) {
    const idx = strokes[i].indexOf(':')
    const header = [
      strokes[i].substring(0, idx).trim(),
      strokes[i].substring(idx + 2)
    ]
    if (header[0].length > 0) {
      res.headers[header[0]] = header[1]
    }
  }
  if (binaryResponse) {
    res.body = req.response
  } else {
    res.body = req.responseText
  }

  return res
}

function initWebSocket (url, options) {
  let id
  try {
    id = JSON.parse(fetchSync({
      url: 'http://localhost:5000/zen/ws',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({
        ...options,
        url: url
      })
    }).body).id
  } catch (e) {
    id = null
  }
  if (id) {
    return id
  }
  throw new Error('Could not init WebSocket. Check that dev server is running')
}

function getWebSocketResponseResult (id) {
  const res = fetchSync({
    url: `http://localhost:5000/zen/ws/${id}`,
    method: 'GET'
  })
  if (res.status === 200 || res.status === 502) {
    try {
      const data = JSON.parse(res.body)
      if (res.status === 200) {
        return [null, data]
      } else {
        return [data, null]
      }
    } catch (e) {}
  }
  throw new Error('Could not fetch WebSocket response. Check that dev server is running')
}
