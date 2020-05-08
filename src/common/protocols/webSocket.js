import { sanitize } from '../sanitize'
import { generateUUID } from '../utils'

export default class WebSocket {
  getResponseId (body) {
    return body.id
  }

  onUnexpectedMessage (body) {

  }

  async open (url, { headers = {}, sanitizeRequestLog, sanitizeResponseLog } = {}) {
    console.assert(!this._socket, 'previous connection must be closed before opening new connection')
    return new Promise((resolve, reject) => {
      console.debug('request', sanitize({
        url,
        headers
      }, sanitizeRequestLog))
      this._socket = new ZenMoney.WebSocket(url, null, { headers })
      this._socket.onerror = (event) => {
        this._errorMessage = event.message || null
      }
      this._socket.onopen = (event) => {
        const response = event.response
        console.debug('response', sanitize({
          status: response.status,
          url: response.url,
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

  async send (id, { body, sanitizeRequestLog, sanitizeResponseLog }) {
    console.assert(this._socket && this._socket.readyState === ZenMoney.WebSocket.OPEN, 'connection must be opened before sending request')
    return new Promise((resolve, reject) => {
      this.putCallback(id, (err, body) => {
        if (err) {
          return reject(err)
        }
        const response = { body }
        console.debug('response', sanitize(response, sanitizeResponseLog))
        resolve(response)
      })
      console.debug('request', sanitize({ body }, sanitizeRequestLog))
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
    return this._socket === null && event.wasClean ? new TemporaryError('[NER]') : new Error(this._errorMessage || 'error')
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
