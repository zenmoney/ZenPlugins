export interface WebSocketOpenResponse {
  status: number
  url: string
  headers: unknown
  body: unknown
}

export default class WebSocket {
  getResponseId (body: unknown): string
  onUnexpectedMessage (body: unknown): void
  open (url: string, options?: { headers?: unknown, sanitizeRequestLog?: unknown, sanitizeResponseLog?: unknown }): Promise<WebSocketOpenResponse>
  send (id: string, options: { body: unknown, sanitizeRequestLog?: unknown, sanitizeResponseLog?: unknown }): Promise<{body: unknown}>
  close (): Promise<void>
}
