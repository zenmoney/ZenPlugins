# TCP Socket

Use [Node.js `net.Socket`](https://nodejs.org/api/net.html#class-netsocket) as the reference for connection and stream lifecycle. The supported API is defined by [SocketInstance](../../src/common/network/socket.ts).

Subscriptions use the shared [event semantics](runtime.md#event-emitters). Handle errors by rejecting the owning operation. Raw TCP has no automatic request/response logging; follow [sanitization](../debugging/log-sanitization.md) for explicit diagnostics.
