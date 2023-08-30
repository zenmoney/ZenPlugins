import { generateRequestLogId } from '../network'
import { sanitize } from '../sanitize'
import { generateUUID } from '../utils'

export default class WebSocket {
  getResponseId (body) {
    return body.id
  }

  onUnexpectedMessage (body) {

  }

  async open (url, { headers = {}, sanitizeRequestLog, sanitizeResponseLog, log } = {}) {
    console.assert(!this._socket, 'previous connection must be closed before opening new connection')
    const beforeFetchTicks = Date.now()
    const shouldLog = log !== false
    const id = shouldLog && generateRequestLogId()
    return new Promise((resolve, reject) => {
      shouldLog && console.debug('request', sanitize({
        id,
        url,
        headers
      }, sanitizeRequestLog))
      this._socket = new ZenMoney.WebSocket(url, null, { headers })
      this._socket.onerror = (event) => {
        this._errorMessage = event.message || null
      }
      this._socket.onopen = (event) => {
        const response = event.response
        shouldLog && console.debug('response', sanitize({
          id,
          ms: Date.now() - beforeFetchTicks,
          url: response.url,
          status: response.status,
          headers: response.headers,
          body: response.body
        }, sanitizeResponseLog))
        this.setupSocket()
        resolve(response)
      }
      this._socket.onclose = (event) => {
        reject(this.getErrorFromCloseEvent(event))
      }
    })
  }

  async send (id, { body, sanitizeRequestLog, sanitizeResponseLog, log }) {
    console.assert(this._socket && this._socket.readyState === ZenMoney.WebSocket.OPEN, 'connection must be opened before sending request')
    const beforeFetchTicks = Date.now()
    const shouldLog = log !== false
    const logId = shouldLog && generateRequestLogId()
    return new Promise((resolve, reject) => {
      this.putCallback(id, (err, body) => {
        if (err) {
          return reject(err)
        }
        const response = { body }
        shouldLog && console.debug('response', sanitize({
          id: logId,
          ms: Date.now() - beforeFetchTicks,
          body
        }, sanitizeResponseLog))
        resolve(response)
      })
      shouldLog && console.debug('request', sanitize({
        id: logId,
        body
      }, sanitizeRequestLog))
      this._socket.send(JSON.stringify(body))
    })
  }

  async close () {
    if (this._socket && this._socket.readyState !== ZenMoney.WebSocket.CLOSED) {
      await new Promise((resolve) => {
        this.putCallback(generateUUID(), resolve)
        const socket = this._socket
        this._socket = null
        socket.close()
      })
    } else {
      this._socket = null
    }
  }

  /**
   * @private
   */
  putCallback (id, callback) {
    console.assert(id, 'request id must be truthy')
    console.assert(!this._callbacks[id], 'there is a pending request with the same id', id)
    console.assert(typeof callback === 'function', 'invalid callback', callback)
    this._callbacks[id] = callback
  }

  /**
   * @private
   */
  getErrorFromCloseEvent (event) {
    return this._socket === null || event.wasClean
      ? new TemporaryError('[NER] WebSocket closed')
      : new Error(this._errorMessage || 'Unexpected WebSocket error')
  }

  /**
   * @private
   */
  setupSocket () {
    this._errorMessage = null
    this._callbacks = {}
    this._socket.onclose = (event) => {
      const err = this.getErrorFromCloseEvent(event)
      const callbacks = this._callbacks
      this._callbacks = {}
      for (const id of Object.keys(callbacks)) {
        const callback = callbacks[id]
        callback(err)
      }
    }
    this._socket.onmessage = (event) => {
      let body
      try {
        body = JSON.parse(event.data)
      } catch (e) {
        console.assert(false, 'unexpected message', event)
        return
      }
      const id = this.getResponseId(body)
      const callback = this._callbacks[id]
      delete this._callbacks[id]
      if (callback) {
        callback(null, body)
      } else {
        this.onUnexpectedMessage(body)
      }
    }
  }
}
