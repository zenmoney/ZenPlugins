import { WebSocket, WebSocketInstance, WebSocketCloseEvent, WebSocketResponse, WebSocketOptions } from './webSocket'
import get from '../../types/get'
import { TemporaryError } from '../../errors'
import { generateRequestLogId } from './logging'
import { sanitize } from '../sanitize'
import { generateUUID } from '../utils'

export interface WebSocketRequestOptions {
  body: unknown
  log?: boolean
  sanitizeRequestLog?: unknown
  sanitizeResponseLog?: unknown
}

export type WebSocketOpenOptions = WebSocketOptions

type ResponseCallback = (error: Error | null, body?: unknown) => void

/** JSON requests whose responses are matched by getResponseId(body). */
export class WebSocketRequestClient {
  private _socket: WebSocketInstance | null = null
  private _errorMessage: string | null = null
  private _callbacks: Record<string, ResponseCallback> = {}

  getResponseId (body: unknown): string | number | undefined {
    assert(body != null, 'Expected a WebSocket message')
    const id = get(body, 'id')
    assert(id === undefined || typeof id === 'string' || typeof id === 'number', 'Expected a string or numeric response ID')
    return id
  }

  onUnexpectedMessage (body: unknown): void {

  }

  async open (url: string, options: WebSocketOpenOptions = {}): Promise<WebSocketResponse> {
    assert(this._socket === null, 'previous connection must be closed before opening new connection')
    return await new Promise((resolve, reject) => {
      this._socket = new WebSocket(url, null, options)
      this._socket.onerror = (event) => {
        this._errorMessage = event.message !== '' ? event.message : null
      }
      this._socket.onopen = (event) => {
        const response = event.response
        this.setupSocket()
        resolve(response)
      }
      this._socket.onclose = (event) => {
        reject(this.getErrorFromCloseEvent(event))
      }
    })
  }

  async request (id: string, { body, sanitizeRequestLog, sanitizeResponseLog, log }: WebSocketRequestOptions): Promise<{ body: unknown }> {
    const socket = this._socket
    assert(socket !== null && socket.readyState === WebSocket.OPEN, 'Connection must be opened before sending request')
    const beforeFetchTicks = Date.now()
    const shouldLog = log !== false
    const logId = shouldLog && generateRequestLogId()
    return await new Promise((resolve, reject) => {
      this.putCallback(id, (err, body) => {
        if (err != null) {
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
      socket.send(JSON.stringify(body))
    })
  }

  async close (): Promise<void> {
    if (this._socket !== null && this._socket.readyState !== WebSocket.CLOSED) {
      const socket = this._socket
      await new Promise<void>((resolve) => {
        this.putCallback(generateUUID(), () => resolve())
        this._socket = null
        socket.close()
      })
    } else {
      this._socket = null
    }
  }

  private putCallback (id: string, callback: ResponseCallback): void {
    assert(id !== '', 'Request ID must be nonempty')
    assert(this._callbacks[id] === undefined, 'There is a pending request with the same ID', id)
    this._callbacks[id] = callback
  }

  private getErrorFromCloseEvent (event: WebSocketCloseEvent): Error {
    return this._socket === null || event.wasClean
      ? new TemporaryError('[NER] WebSocket closed')
      : new Error(this._errorMessage !== null && this._errorMessage !== '' ? this._errorMessage : 'Unexpected WebSocket error')
  }

  private setupSocket (): void {
    const socket = this._socket
    assert(socket !== null, 'Connection must be opened before installing listeners')
    this._errorMessage = null
    this._callbacks = {}
    socket.onclose = (event) => {
      const err = this.getErrorFromCloseEvent(event)
      const callbacks = this._callbacks
      this._callbacks = {}
      for (const id of Object.keys(callbacks)) {
        const callback = callbacks[id]
        callback(err)
      }
    }
    socket.onmessage = (event) => {
      let body: unknown
      try {
        assert(typeof event.data === 'string', 'Expected a text WebSocket message')
        body = JSON.parse(event.data)
      } catch (e) {
        console.assert(false, 'unexpected message', event)
        return
      }
      const id = this.getResponseId(body)
      const callback = id === undefined ? undefined : this._callbacks[id]
      if (id !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this._callbacks[id]
      }
      if (callback != null) {
        callback(null, body)
      } else {
        this.onUnexpectedMessage(body)
      }
    }
  }
}
