export interface FetchResponse {
  status: number
  url: string
  headers: unknown
  body: unknown
}

export interface FetchOptions {
  method?: string
  headers?: unknown
  body?: unknown
  stringify?: unknown
  parse?: unknown
  redirect?: 'follow' | 'manual'
  binaryResponse?: boolean
  pfx?: Uint8Array | null
  sanitizeRequestLog?: unknown
  sanitizeResponseLog?: unknown
}

export declare class ParseError {
  cause: unknown
  stack: unknown[]
  message: string
  response: FetchResponse

  constructor (message: string, response: FetchResponse, cause: unknown)
}

export declare interface InterceptedRequest {
  method?: string
  url: string
  headers?: unknown
}

export declare function fetch (url: string, options?: FetchOptions): Promise<FetchResponse>
export declare function fetchJson (url: string, options?: FetchOptions): Promise<FetchResponse>
export declare function openWebViewAndInterceptRequest (arg: {
  url: string
  headers?: unknown
  log?: boolean
  sanitizeRequestLog?: unknown
  intercept?: (request: InterceptedRequest) => unknown }
): Promise<void>
