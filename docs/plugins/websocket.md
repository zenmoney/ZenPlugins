# WebSocket

Use the [WebSocket standard](https://websockets.spec.whatwg.org/#the-websocket-interface) as the transport reference. The supported API and additional options are defined by [WebSocket](../../src/common/network/webSocket.ts).

Differences and wrapper behavior:

- Subscriptions use the shared [event semantics](runtime.md#event-emitters). Replacing a non-null property handler such as `onmessage` moves it to the end of the listener queue.
- Binary messages use `Uint8Array`; `binaryType` is immutable. Upgrade responses are exposed on opening/failure events and use shared [header normalization](utilities.md#network-headers).
- TLS inherits the shared [certificate defaults](utilities.md#tls-defaults).
- The wrapper logs one handshake request and its response or failure, independently of caller handlers. It does not log application messages. See [logging controls and masks](../debugging/production-logs.md#what-is-and-is-not-captured).

## Request/response client

[WebSocketRequestClient](../../src/common/network/webSocketRequestClient.ts) exchanges JSON messages and matches replies by ID in any arrival order. Pending IDs must be nonempty and unique. `getResponseId` defaults to `body.id`; override it for the service protocol. Unmatched messages go to `onUnexpectedMessage`.

The caller supplies authentication, timeouts and retry policy. Each request/reply pair has its own log ID and masks, separate from the handshake.
