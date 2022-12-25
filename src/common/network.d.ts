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
  log?: boolean
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

// * Almost the same as browser's fetch.
// * Automatically log requests & responses.
// * Use parse/stringify parameters to log only
// useful data, instead of encrypted blobs
// * Use sanitizeRequestLog/sanitizeResponseLog parameters
// to mask sensitive data from logs
// * Before parse response body is decoded to utf-8,
// to avoid it use { binaryResponse: true }. So, it will be ArrayBuffer.
export declare function fetch (url: string, options?: FetchOptions): Promise<FetchResponse>

// fetch wrapper with { parse: JSON.parse, stringify: JSON.stringify } and default JSON
// headers { Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json;charset=UTF-8' }.
// When you are reimplementing private API, it is advised to fully match all details
// including `Accept` and `Content-Type` headers, so if these headers don't match yours,
// you should use `fetch` with proper headers.
export declare function fetchJson (url: string, options?: FetchOptions): Promise<FetchResponse>

// WebView flow, useful for auth flow
// All requests are intercepted in intercept function.
// So we can detect when flow is finished and extract necessary tokens
//
// Example usage:
// const response = await openWebViewAndInterceptRequest({
//   url: `https://example/authorize?client_id={client_id}&redirect_uri={redirect_uri}`,
//   sanitizeRequestLog: { url: { query: { client_id: true, redirect_uri: true } } },
//   intercept: request => {
//     const url = request.url
//     if (url.indexOf(redirectUri) !== 0) {
//       return null
//     }
//     const queryParameters = parse(url.slice(url.indexOf('?') + 1))
//     if (queryParameters.code) {
//       return { code: queryParameters.code }
//     } else {
//       return { error: queryParameters }
//     }
//   }
// })
export declare function openWebViewAndInterceptRequest (arg: {
  url: string
  headers?: unknown
  log?: boolean
  sanitizeRequestLog?: unknown
  intercept?: (request: InterceptedRequest) => unknown }
): Promise<void>
