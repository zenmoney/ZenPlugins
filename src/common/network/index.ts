import _ from 'lodash'
import { IncompatibleVersionError } from '../../errors'
import { bufferToHex, isDebug } from '../utils'
import type { CookieJar as InterceptedCookieJar } from 'fetch-cookie'
import get from '../../types/get'
import { convertHeadersToPlainObject, generateRequestLogId, sanitizeNetworkLog } from './logging'
import type { NetworkHeaders } from './logging'
import type { TlsOptions } from './tls'

export { convertHeadersToPlainObject, generateRequestLogId } from './logging'
export type { NetworkHeaders } from './logging'
export { Socket } from './socket'
export type { TlsOptions } from './tls'
export { cookieJar, saveCookies, restoreCookies } from './cookies'
export type { CookieJar } from 'tough-cookie'

// Legacy HTTP and interception contracts use truthiness, including for completion values.
function isTruthy (value: unknown): boolean {
  return Boolean(value)
}

export type FetchResponseHeaders = NetworkHeaders

export interface FetchResponse {
  ok: boolean
  status: number
  statusText: string
  url: string
  headers: NetworkHeaders
  body: unknown
}

export interface FetchOptions<RawBody = string> {
  method?: string
  headers?: HeadersInit
  body?: unknown
  stringify?: (body: never) => unknown
  parse?: (this: FetchResponse, body: RawBody) => unknown
  redirect?: 'follow' | 'manual'
  binaryResponse?: boolean
  tls?: TlsOptions
  log?: boolean
  sanitizeRequestLog?: unknown
  sanitizeResponseLog?: unknown
}

export type FetchFunc = (url: string, options?: FetchOptions) => Promise<FetchResponse>

export interface InterceptedRequest {
  method?: string
  url: string
  headers?: HeadersInit
  body?: unknown
}

/** Common capabilities available on legacy hosts and in the browser fallback. */
export interface InterceptedWebView {
  cookieJar: InterceptedCookieJar
}

type WebViewNavigationAction = undefined | true | 2

type WebViewCompletion<T> = (error?: unknown, result?: T | null) => void
type CloseableInterceptedWebView<T> = InterceptedWebView & { close?: WebViewCompletion<T> | null }

export interface RequestInterceptor<T> {
  close: WebViewCompletion<T>
  mode?: WebViewNavigationAction
}

export interface WebViewInterceptOptions<T> {
  url: string
  headers?: HeadersInit
  log?: boolean
  sanitizeRequestLog?: unknown
  configure?: (webView: InterceptedWebView) => Promise<void>
  intercept: (this: RequestInterceptor<T>, request: InterceptedRequest, webView: InterceptedWebView) => T | Promise<T> | null | undefined
}

type NativeOpenWebView = <T>(
  url: string,
  headers: HeadersInit | undefined,
  intercept: (request: InterceptedRequest, complete: WebViewCompletion<T>) => WebViewNavigationAction | Promise<WebViewNavigationAction>,
  complete: WebViewCompletion<T>,
  options: { configure: (webView: CloseableInterceptedWebView<T>) => Promise<void> }
) => void

export class ParseError {
  readonly cause: unknown
  readonly response!: FetchResponse
  readonly stack: string | undefined
  readonly message: string

  constructor (message: string, response: FetchResponse, cause: unknown) {
    this.cause = cause
    Object.defineProperty(this, 'response', {
      enumerable: false,
      value: response
    })
    this.stack = new Error().stack
    this.message = message
  }
}

export async function fetch<RawBody = string> (url: string, options: FetchOptions<RawBody> = {}): Promise<FetchResponse> {
  const init = {
    ..._.omit(options, ['sanitizeRequestLog', 'sanitizeResponseLog', 'log', 'stringify', 'parse']),
    ...isTruthy(options.body) && { body: options.stringify !== undefined ? (options.stringify as (body: unknown) => unknown)(options.body) : options.body }
  }
  const beforeFetchTicks = Date.now()
  const shouldLog = options.log !== false
  const id = shouldLog && generateRequestLogId()
  shouldLog && console.debug('request', sanitizeNetworkLog({
    id,
    url,
    method: init.method !== undefined && init.method !== '' ? init.method : 'GET',
    headers: init.headers,
    ...isTruthy(options.body) && { body: options.body }
  }, isTruthy(options.sanitizeRequestLog) ? options.sanitizeRequestLog : false))

  if (options.binaryResponse === true && !isTruthy(get(globalThis.ZenMoney, 'features.binaryResponseBody'))) {
    throw new IncompatibleVersionError()
  }

  let nativeResponse: Response
  try {
    nativeResponse = await global.fetch(url, init as RequestInit)
  } catch (e) {
    let err
    if (e instanceof TypeError && Boolean(get(e, 'cause'))) {
      err = get(e, 'cause')
    } else {
      err = e
    }
    shouldLog && console.debug('response', sanitizeNetworkLog({
      id,
      ms: Date.now() - beforeFetchTicks,
      url
    }, isTruthy(options.sanitizeRequestLog) ? options.sanitizeRequestLog : false), 'failed to receive due to error', err)
    throw err
  }

  const response: FetchResponse = {
    ..._.pick(nativeResponse, ['ok', 'status', 'statusText', 'url']),
    headers: convertHeadersToPlainObject(nativeResponse.headers),
    body: options.binaryResponse === true ? await nativeResponse.arrayBuffer() : await nativeResponse.text()
  }

  let bodyParsingException: unknown = null
  if (options.parse != null) {
    try {
      response.body = options.parse.call(response, response.body as RawBody)
    } catch (e) {
      bodyParsingException = e
    }
  }
  let bodyLog: unknown = response.body
  if (isTruthy(bodyLog)) {
    if (_.isTypedArray(bodyLog)) {
      bodyLog = (bodyLog as ArrayBufferView).buffer
    }
    if (_.isArrayBuffer(bodyLog)) {
      bodyLog = bufferToHex(bodyLog)
    }
  }

  shouldLog && console.debug('response', sanitizeNetworkLog({
    id,
    ms: Date.now() - beforeFetchTicks,
    url: response.url,
    status: response.status,
    headers: response.headers,
    body: bodyLog
  }, isTruthy(options.sanitizeResponseLog) ? options.sanitizeResponseLog : false))

  if (isTruthy(bodyParsingException)) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal -- Preserve the JS contract: ParseError is a standalone class.
    throw new ParseError(`Could not parse response. ${String(bodyParsingException)}`, response, bodyParsingException)
  }

  return response
}

export async function fetchJson (url: string, options: FetchOptions = {}): Promise<FetchResponse> {
  return await fetch(url, {
    stringify: JSON.stringify,
    parse: (body) => body === '' ? undefined : JSON.parse(body),
    ...options,
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...isTruthy(options.body) && { 'Content-Type': 'application/json;charset=UTF-8' },
      ...options.headers
    }
  })
}

export const RequestInterceptMode = {
  LOAD: undefined,
  BLOCK: true,
  OPEN_AS_DEEP_LINK: 2
} as const

export async function openWebViewAndInterceptRequest<T> ({ url, headers, log, sanitizeRequestLog, intercept, configure }: WebViewInterceptOptions<T>): Promise<T | null | undefined> {
  console.assert(typeof url === 'string', 'url must be string')
  console.assert(typeof intercept === 'function', 'intercept must be a function (request) => result')
  const nativeOpenWebView = get(globalThis.ZenMoney, 'openWebView') as NativeOpenWebView | undefined
  const openWebView = nativeOpenWebView?.bind(globalThis.ZenMoney)
  if (openWebView !== undefined) {
    let webView: CloseableInterceptedWebView<T> | null = {
      close: null,
      cookieJar: {
        getCookieString: async () => { throw new IncompatibleVersionError() },
        setCookie: async () => { throw new IncompatibleVersionError() }
      }
    }
    return await new Promise<T | null | undefined>((resolve, reject) => {
      openWebView<T>(url, headers, (request, callback): WebViewNavigationAction | Promise<WebViewNavigationAction> => {
        assert(webView !== null, 'WebView already completed')
        webView.close = callback
        const shouldLog = log !== false
        const id = shouldLog && generateRequestLogId()
        shouldLog && console.debug('request', sanitizeNetworkLog({
          id,
          url: request.url,
          method: request.method !== undefined && request.method !== '' ? request.method : 'GET',
          headers: request.headers,
          ...isTruthy(request.body) && { body: request.body }
        }, isTruthy(sanitizeRequestLog) ? sanitizeRequestLog : false))
        const interceptor: RequestInterceptor<T> = {
          close: (error, result) => {
            if ((webView?.close) != null) {
              webView.close(error, result)
            }
          }
        }
        let result: T | Promise<T> | null | undefined
        try {
          result = intercept.call(interceptor, request, webView)
        } catch (e) {
          callback(e)
          return RequestInterceptMode.BLOCK
        }
        if (isTruthy(get(globalThis.ZenMoney, 'features.webViewConfiguration'))) {
          return Promise.resolve(result).then(
            (result) => {
              if (isTruthy(result)) {
                callback(null, result)
              }
              return 'mode' in interceptor ? interceptor.mode : isTruthy(result) ? RequestInterceptMode.BLOCK : RequestInterceptMode.LOAD
            },
            (e) => {
              callback(e)
              return RequestInterceptMode.BLOCK
            }
          )
        } else if (isTruthy(result) && typeof get(result, 'then') === 'function') {
          callback(new IncompatibleVersionError())
          return RequestInterceptMode.BLOCK
        }
        if (isTruthy(result)) {
          callback(null, result as T)
        }
        return 'mode' in interceptor ? interceptor.mode : isTruthy(result) ? RequestInterceptMode.BLOCK : RequestInterceptMode.LOAD
      }, (error, result) => {
        if (webView !== null) webView.close = null
        webView = null
        if (isTruthy(error)) {
          reject(error)
        } else {
          resolve(result)
        }
      }, {
        configure: async (wv) => {
          assert(webView !== null, 'WebView already completed')
          const close = webView.close
          webView = wv
          webView.close = close
          if (configure != null) {
            await configure(webView)
          }
        }
      })
    })
  } else if (isDebug()) {
    console.log(url)
    const cookies: Array<[string, string]> = []
    const webView: InterceptedWebView = {
      cookieJar: {
        getCookieString: async (url) => {
          console.log('cookie jar entries:', cookies)
          return (await ZenMoney.readLine(`Enter cookies for ${url}`)) ?? ''
        },
        setCookie: async (cookieString, url) => {
          cookies.push([cookieString, url])
        }
      }
    }
    if (configure != null) {
      await configure(webView)
    }
    const interceptedRequestUrl = await ZenMoney.readLine(url)
    assert(interceptedRequestUrl !== null && interceptedRequestUrl !== '', 'Could not get intercepted request URL')
    const result = await (intercept as OmitThisParameter<typeof intercept>)({ url: interceptedRequestUrl }, webView)
    console.assert(result, 'intercepted request url doesn\'t match expectations')
    return result
  } else {
    throw new IncompatibleVersionError()
  }
}

export function parseHeaderParameters (header: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  const regex = /;\s*(?:([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)=(?:([a-zA-Z0-9-!#$%&'*+.^_`{|}~]+)|"([^"]*)"))?/g
  while (true) {
    const match = regex.exec(header)
    if (match == null) {
      break
    }
    pairs.push([match[1], match[2] !== undefined && match[2] !== '' ? match[2] : match[3]])
  }
  return pairs
}
