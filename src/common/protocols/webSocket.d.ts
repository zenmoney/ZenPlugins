export interface WebSocketOpenResponse {
  status: number
  url: string
  headers: unknown
  body: unknown
}

// WebSocket interface for request-response model
// It matches responses to requests by id,
// the first argument of send in request with result of getResponseId(body)
//
// Example usage:
// const socket = new WebSocket()
// socket.getResponseId = (body) => getString(body, 'requestId')
// const response1 = await socket.open('wss://example/ws2', {})
// const response2 = await socket.send(id, { body: { requestId: id } })
// await socket.close()
//
export default class WebSocket {
  getResponseId (body: unknown): string
  onUnexpectedMessage (body: unknown): void
  open (url: string, options?: {
    headers?: unknown
    log?: boolean
    sanitizeRequestLog?: unknown
    sanitizeResponseLog?: unknown
  }): Promise<WebSocketOpenResponse>
  send (id: string, options: {
    body: unknown
    log?: boolean
    sanitizeRequestLog?: unknown
    sanitizeResponseLog?: unknown
  }): Promise<{ body: unknown }>
  close (): Promise<void>
}
