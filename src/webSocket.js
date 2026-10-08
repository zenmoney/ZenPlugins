/* global XMLHttpRequest */

import { PROXY_TARGET_HEADER } from './shared'
import { convertHeadersToPlainObject } from './common/network/logging'

const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']

export default class WebSocket {
  constructor (url, protocols, options) {
    if (typeof url !== 'string' || !/^(ws|wss|http|https):\/\//.test(url) || url.includes('#')) {
      throw namedError('Invalid WebSocket URL', 'SyntaxError')
    }
    url = url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
    protocols = typeof protocols === 'string' ? [protocols] : protocols == null ? [] : protocols
    if (!Array.isArray(protocols) || protocols.some(protocol => typeof protocol !== 'string')) {
      throw new TypeError('Expected protocols to be one of: String, Array, Null')
    }
    if (new Set(protocols).size !== protocols.length || protocols.some(protocol => !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(protocol))) {
      throw namedError('Invalid or duplicated WebSocket protocol', 'SyntaxError')
    }
    this._listeners = new Map()
    this._eventHandlers = new Map()
    Object.defineProperty(this, 'binaryType', { value: 'uint8array', writable: false })
    const { pathname } = new URL(url)
    const id = initWebSocket(url, options)
    this._url = url
    this._socket = new global.WebSocket(`ws://${global.location.host}${pathname}?${PROXY_TARGET_HEADER}=${id}`, protocols)
    this._socket.binaryType = 'arraybuffer'
    this._socket.addEventListener('open', () => {
      if (this.onopen || this.listenerCount('open') > 0) {
        this._emit({
          target: this,
          type: 'open',
          response: (getWebSocketResponseResult(id) || [])[1] || null
        })
      }
    })
    this._socket.addEventListener('close', (event) => {
      if (this.onclose || this.listenerCount('close') > 0) {
        this._emit({
          target: this,
          type: 'close',
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean || false
        })
      }
    })
    this._socket.addEventListener('error', (event) => {
      if (this.onerror || this.listenerCount('error') > 0) {
        const result = getWebSocketResponseResult(id)
        this._emit({
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
    })
    this._socket.addEventListener('message', (event) => {
      if (this.onmessage || this.listenerCount('message') > 0) {
        this._emit({
          target: this,
          type: 'message',
          data: event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data
        })
      }
    })
  }

  on (event, listener) {
    return this._addListener(event, listener, false)
  }

  once (event, listener) {
    return this._addListener(event, listener, true)
  }

  addEventListener (event, listener) {
    return this._addListener(event, listener, false, true)
  }

  removeEventListener (event, listener) {
    return this.off(event, listener)
  }

  off (event, listener) {
    if (typeof listener !== 'function') throw new TypeError('The listener must be a function')
    const listeners = this._listeners.get(event) || []
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i].listener === listener) {
        this._removeListener(event, listeners[i])
        break
      }
    }
    return this
  }

  listenerCount (event, listener) {
    const listeners = this._listeners.get(event) || []
    return typeof listener !== 'function' ? listeners.length : listeners.filter(entry => entry.listener === listener).length
  }

  emit (event, ...args) {
    const listeners = [...(this._listeners.get(event) || [])]
    for (const entry of listeners) {
      if (entry.once) {
        if (entry.fired) continue
        entry.fired = true
        this._removeListener(event, entry)
      }
      entry.listener.apply(globalThis, args)
    }
    return listeners.length > 0
  }

  _addListener (event, listener, once, unique = false) {
    if (typeof listener !== 'function') throw new TypeError('The listener must be a function')
    const listeners = this._listeners.get(event) || []
    if (unique && listeners.some(entry => entry.listener === listener)) return this
    listeners.push({ listener, once, fired: false })
    this._listeners.set(event, listeners)
    return this
  }

  _removeListener (event, entry) {
    const listeners = this._listeners.get(event)
    const index = listeners ? listeners.indexOf(entry) : -1
    if (index < 0) return
    listeners.splice(index, 1)
    if (listeners.length === 0) this._listeners.delete(event)
  }

  _emit (event) {
    this.emit(event.type, event)
  }

  get url () {
    return this._url
  }

  get readyState () {
    return this._socket.readyState
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
    if (this.readyState === WebSocket.CONNECTING) {
      throw namedError('WebSocket is still in CONNECTING state', 'InvalidStateError')
    }
    if (this.readyState !== WebSocket.OPEN) return
    if (typeof data !== 'string' && !(data instanceof Uint8Array) && !(data instanceof global.Blob)) {
      throw new Error('Expected data to be one of: String, Uint8Array, Blob')
    }
    this._socket.send(data)
  }

  close (code, reason) {
    this._socket.close(code, reason)
  }
}

for (let i = 0; i < readyStates.length; i++) {
  WebSocket[readyStates[i]] = i
}

// Native property handlers are subscriptions, so replacement changes their registration order.
for (const event of ['open', 'message', 'error', 'close']) {
  Object.defineProperty(WebSocket.prototype, `on${event}`, {
    configurable: true,
    enumerable: true,
    get () {
      return this._eventHandlers.get(event)?.listener ?? null
    },
    set (listener) {
      const previous = this._eventHandlers.get(event)
      if (previous) {
        this.removeEventListener(event, previous.wrapper)
        this._eventHandlers.delete(event)
      }
      if (typeof listener === 'function') {
        const wrapper = (...args) => listener.apply(this, args)
        this._eventHandlers.set(event, { listener, wrapper })
        this.addEventListener(event, wrapper)
      }
    }
  })
}

function namedError (message, name) {
  const error = new Error(message)
  error.name = name
  return error
}

function fetchSync ({ method, url, headers, body, binaryResponse }) {
  const req = new XMLHttpRequest()
  req.withCredentials = true
  if (binaryResponse) {
    req.responseType = 'arraybuffer'
  }

  req.open(method, url, false)

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      req.setRequestHeader(key, value)
    }
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
      url: '/zen/ws',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({
        ...options,
        ...options?.headers != null && { headers: convertHeadersToPlainObject(options.headers) },
        url
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
    url: `/zen/ws/${id}`,
    method: 'GET'
  })
  if (res.status === 200 || res.status === 502) {
    try {
      const data = JSON.parse(res.body)
      if (res.status === 200) {
        data.headers = new global.Headers(data.headers)
        return [null, data]
      } else {
        return [data, null]
      }
    } catch (e) {}
  }
  throw new Error('Could not fetch WebSocket response. Check that dev server is running')
}
