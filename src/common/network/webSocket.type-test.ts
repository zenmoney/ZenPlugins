import type { WebSocketInstance } from './webSocket'
import type { FetchResponse, FetchResponseHeaders } from './index'

declare function expectType<T> (value: T): void

// Compile-only host contract checks; events use native payloads, not DOM Events.
export function checkWebSocketTypes (socket: WebSocketInstance): void {
  expectType<Pick<globalThis.WebSocket, 'url' | 'readyState' | 'protocol' | 'extensions' | 'close'>>(socket)
  socket.on('open', event => {
    expectType<FetchResponseHeaders>(event.response.headers)
    expectType<Omit<FetchResponse, 'ok'>>(event.response)
    expectType<string>(event.response.protocol)
    // @ts-expect-error A WebSocket handshake response does not expose Fetch's ok flag.
    void event.response.ok
    // @ts-expect-error Native event objects do not implement Event.preventDefault.
    event.preventDefault()
  })
  socket.onmessage = function (event) {
    expectType<WebSocketInstance>(this)
    expectType<string | Uint8Array>(event.data)
  }
  socket.send(new Uint8Array([1]))
  // @ts-expect-error The native send method accepts Uint8Array, not arbitrary buffers.
  socket.send(new ArrayBuffer(1))
  // @ts-expect-error Shared subscriptions use on/once/off.
  socket.addEventListener('open', () => {})
  // @ts-expect-error Shared subscriptions use on/once/off.
  socket.removeEventListener('open', () => {})
  // @ts-expect-error bufferedAmount is not exposed by the native host.
  expectType<number>(socket.bufferedAmount)
  // @ts-expect-error Native constructors are accessed through the shared modules.
  void ZenMoney.WebSocket
}
