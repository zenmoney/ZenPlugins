import { proxyConstructor } from '../proxy'
import { IncompatibleVersionError } from '../../errors'
import type { EventEmitter } from '../events'
import { withDefaultTls } from './tls'
import type { TlsOptions } from './tls'
import get from '../../types/get'
import { convertHeadersToPlainObject, generateRequestLogId, sanitizeNetworkLog } from './logging'
import type { FetchResponse } from './index'

export interface WebSocketResponse extends Omit<FetchResponse, 'ok'> {
  protocol: string
}

export interface WebSocketOpenEvent {
  readonly type: 'open'
  readonly response: WebSocketResponse
}

export interface WebSocketCloseEvent extends Pick<CloseEvent, 'code' | 'reason' | 'wasClean'> {
  readonly type: 'close'
}

export interface WebSocketErrorEvent {
  readonly type: 'error'
  readonly message: string | null
  readonly error?: unknown
  readonly response: WebSocketResponse | null
}

export interface WebSocketMessageEvent extends Pick<MessageEvent<string | Uint8Array>, 'data'> {
  readonly type: 'message'
}

type WebSocketStates = Pick<typeof globalThis.WebSocket, 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>

export interface WebSocketEvents extends Record<string, unknown[]> {
  open: [event: WebSocketOpenEvent]
  close: [event: WebSocketCloseEvent]
  error: [event: WebSocketErrorEvent]
  message: [event: WebSocketMessageEvent]
}

/** DOM-compatible transport members with the native emitter and binary payloads. */
export interface WebSocketInstance extends WebSocketStates, EventEmitter<WebSocketEvents>, Pick<globalThis.WebSocket,
'url' | 'readyState' | 'protocol' | 'extensions' | 'close'> {
  readonly binaryType: 'uint8array'
  onopen: ((this: WebSocketInstance, event: WebSocketOpenEvent) => void) | null
  onclose: ((this: WebSocketInstance, event: WebSocketCloseEvent) => void) | null
  onerror: ((this: WebSocketInstance, event: WebSocketErrorEvent) => void) | null
  onmessage: ((this: WebSocketInstance, event: WebSocketMessageEvent) => void) | null
  send: (data: string | Uint8Array | Blob) => void
}

export interface WebSocketOptions {
  headers?: HeadersInit
  tls?: TlsOptions
  log?: boolean
  sanitizeRequestLog?: unknown
  sanitizeResponseLog?: unknown
}

export interface WebSocketConstructor extends WebSocketStates {
  new (url: string, protocols?: string | string[] | null, options?: WebSocketOptions): WebSocketInstance
}

export const WebSocket = proxyConstructor<WebSocketConstructor>('WebSocket', {
  construct (target, args, newTarget) {
    const rawOptions = args[2]
    const options = (rawOptions != null && typeof rawOptions === 'object' ? rawOptions : {}) as WebSocketOptions
    const optionsWithDefaults = withDefaultTls(options)
    let nativeArgs = args
    if (optionsWithDefaults !== options || 'log' in options || 'sanitizeRequestLog' in options || 'sanitizeResponseLog' in options) {
      const { log, sanitizeRequestLog, sanitizeResponseLog, ...nativeOptions } = optionsWithDefaults
      nativeArgs = [...args]
      nativeArgs[2] = nativeOptions
    }
    const construct = (): WebSocketInstance => Reflect.construct(target, nativeArgs, newTarget) as WebSocketInstance
    const shouldLog = options.log !== false
    const id = shouldLog && generateRequestLogId()
    const startedAt = Date.now()
    const url = args[0]
    shouldLog && console.debug('request', sanitizeNetworkLog({
      id,
      url,
      headers: options.headers
    }, options.sanitizeRequestLog ?? false))

    let completed = false
    const logResponse = (response: WebSocketResponse | null, error?: unknown): void => {
      if (!shouldLog || completed) return
      completed = true
      console.debug('response', sanitizeNetworkLog({
        id,
        ms: Date.now() - startedAt,
        url: response?.url ?? url,
        ...(response != null && {
          status: response.status,
          headers: response.headers,
          body: response.body
        }),
        ...(error !== undefined && { error })
      }, options.sanitizeResponseLog ?? (response == null ? options.sanitizeRequestLog : false)))
    }

    let socket: WebSocketInstance
    try {
      socket = construct()
      if (typeof socket.once !== 'function') {
        socket.close()
        throw new IncompatibleVersionError()
      }
    } catch (error) {
      logResponse(null, get(error, 'message') ?? error)
      throw error
    }
    const normalizeResponse = (response: WebSocketResponse | null): WebSocketResponse | null => {
      if (response !== null) response.headers = convertHeadersToPlainObject(response.headers)
      return response
    }
    socket.once('open', event => logResponse(normalizeResponse(event.response)))
    socket.once('error', event => logResponse(normalizeResponse(event.response), event.message ?? get(event.error, 'message') ?? event.error))
    socket.once('close', event => logResponse(null, { message: 'WebSocket closed before opening', code: event.code, reason: event.reason }))
    return socket
  }
})
