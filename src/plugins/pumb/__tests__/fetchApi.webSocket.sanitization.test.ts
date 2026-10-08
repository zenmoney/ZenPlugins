import { EventEmitter } from 'events'
import type { WebSocketOpenEvent, WebSocketCloseEvent } from '../../../common/network/webSocket'

const { openAuthenticatedConnection } = jest.requireActual<{
  openAuthenticatedConnection: (token: string, deviceId: string) => Promise<{ close: () => Promise<void> }>
}>('../fetchApi')

// [model] Exercise the actual PUMB masks across the shared WebSocket logging boundary.
it('[model] masks authentication headers after WebSocket header normalization', async () => {
  const originalHost = global.ZenMoney
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  const state: { socket?: NativeWebSocket } = {}
  class NativeWebSocket extends EventEmitter {
    static readonly OPEN = 1
    static readonly CLOSED = 3
    readyState = 0
    onopen?: (event: WebSocketOpenEvent) => void
    onclose?: (event: WebSocketCloseEvent) => void
    constructor () { super(); state.socket = this }
    close (): void {
      this.readyState = 3
      const event: WebSocketCloseEvent = { type: 'close', code: 1000, reason: '', wasClean: true }
      this.emit('close', event)
      this.onclose?.(event)
    }
  }
  global.ZenMoney = { WebSocket: NativeWebSocket } as unknown as typeof ZenMoney
  try {
    const opening = openAuthenticatedConnection('model-token', 'model-device-id')
    const socket = state.socket
    assert(socket !== undefined, 'Model socket was not constructed')
    socket.readyState = 1
    const event = {
      type: 'open',
      response: { url: 'wss://example.test', status: 101, headers: new Headers({ 'X-Trace': 'trace-7', 'Set-Cookie': 'model-cookie' }), body: null }
    }
    socket.emit('open', event)
    socket.onopen?.(event as unknown as WebSocketOpenEvent)
    const connection = await opening
    await connection.close()
    const logs = JSON.stringify(debug.mock.calls)
    expect(logs).not.toContain('model-token')
    expect(logs).not.toContain('model-device-id')
    expect(logs).not.toContain('model-cookie')
    expect(logs).toContain('trace-7')
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
  } finally {
    global.ZenMoney = originalHost
    jest.restoreAllMocks()
  }
})
