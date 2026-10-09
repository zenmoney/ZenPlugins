import { proxyConstructor } from '../proxy'
import type { EventEmitter } from '../events'

export interface SocketOptions {
  allowHalfOpen?: boolean
  keepAlive?: boolean
  noDelay?: boolean
  highWaterMark?: number
}

export interface SocketEvents extends Record<string, unknown[]> {
  connect: []
  data: [chunk: Uint8Array]
  end: []
  drain: []
  finish: []
  error: [error: unknown]
  close: [hadError: boolean]
}

/** Raw TCP connection; see [SocketInstance behavior](../../../docs/plugins/socket.md). */
export interface SocketInstance extends EventEmitter<SocketEvents> {
  readonly connecting: boolean
  readonly destroyed: boolean
  readonly writableEnded: boolean
  connect: (options: { host: string, port: number }, connectListener?: () => void) => this
  write: (chunk: Uint8Array, callback?: (error?: unknown) => void) => boolean
  end: (chunk: Uint8Array, callback?: (error?: unknown) => void) => this
  destroy: (error?: unknown) => this
  setKeepAlive: (enable?: boolean) => this
  setNoDelay: (noDelay?: boolean) => this
}

export type SocketConstructor = new (options?: SocketOptions) => SocketInstance

export const Socket = proxyConstructor<SocketConstructor>('Socket')
