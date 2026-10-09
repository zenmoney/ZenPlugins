import _ from 'lodash'
import { proxyConstructor } from './proxy'
import { withWebViewTls } from './network/tls'
import type { TlsOptions } from './network/tls'
import type { EventEmitter } from './events'
import type { CookieJar } from 'fetch-cookie'
import { generateRequestLogId, sanitizeNetworkLog } from './network/logging'

export interface WebViewOptions {
  userAgent?: string
  tls?: TlsOptions
  inspectable?: boolean
}

export interface WebViewPackageInfo {
  readonly name: string
  readonly version: string | null
  readonly build: number
}

export interface WebViewNavigation {
  readonly url: string
  readonly method: string
  readonly headers: HeadersInit
  readonly source: 'webView' | 'externalRedirect'
}

export type WebViewNavigationAction = WebViewConstructor['NavigationAction'][keyof WebViewConstructor['NavigationAction']]

export type WebViewNavigationPolicy = (
  navigation: WebViewNavigation
) => WebViewNavigationAction | Promise<WebViewNavigationAction>

export interface WebViewRequestLogOptions {
  log?: boolean
  sanitizeRequestLog?: unknown
}

export interface WebViewGotoOptions extends WebViewRequestLogOptions {
  headers?: HeadersInit
  referer?: string
  waitUntil?: 'commit' | 'domcontentloaded' | 'load'
  timeout?: number
}

export interface Disposable {
  dispose: () => Promise<void>
}

/** Page arguments replace handles with their referenced values, including nested handles. */
export type Unboxed<Arg> = Arg extends JSHandle<infer Value> ? Value
  : Arg extends ReadonlyMap<infer Key, infer Value> ? Map<Unboxed<Key>, Unboxed<Value>>
    : Arg extends ReadonlySet<infer Value> ? Set<Unboxed<Value>>
      : Arg extends Date | RegExp | ArrayBuffer | ArrayBufferView ? Arg
        : Arg extends object ? { [Key in keyof Arg]: Unboxed<Arg[Key]> }
          : Arg

export type PageFunction<Arg, R> = string | ((arg: Unboxed<Arg>) => R | Promise<R>)
export type PageFunctionOn<On, Arg, R> = string | ((value: On, arg: Unboxed<Arg>) => R | Promise<R>)

export interface JSHandle<T = unknown> extends Disposable {
  evaluate: <R, Arg = void>(
    pageFunction: PageFunctionOn<T, Arg, R>,
    arg?: Arg
  ) => Promise<R>

  evaluateHandle: <R = unknown, Arg = void>(
    pageFunction: PageFunctionOn<T, Arg, R>,
    arg?: Arg
  ) => Promise<JSHandle<R>>

  getProperty: (name: string) => Promise<JSHandle>
  getProperties: () => Promise<Map<string, JSHandle>>
  jsonValue: () => Promise<T>
}

export interface WebViewEvents extends Record<string, unknown[]> {
  close: []
}

/** Native browser session; see [WebView behavior](../../docs/plugins/webview.md). */
export interface WebViewInstance extends EventEmitter<WebViewEvents> {
  show: () => Promise<void>
  hide: () => Promise<void>
  isHidden: () => Promise<boolean>
  close: () => Promise<void>
  isClosed: () => Promise<boolean>

  goto: (url: string, options?: WebViewGotoOptions) => Promise<void>

  setContent: (html: string, options?: {
    baseURL?: string
    waitUntil?: 'commit' | 'domcontentloaded' | 'load'
    timeout?: number
  }) => Promise<void>

  url: () => Promise<string | null>

  waitForLoadState: (state?: 'domcontentloaded' | 'load', options?: {
    timeout?: number
  }) => Promise<void>

  evaluate: <R, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg
  ) => Promise<R>

  evaluateHandle: <R = unknown, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg
  ) => Promise<JSHandle<R>>

  addInitScript: <Arg = void>(
    pageFunction: (arg: Arg) => unknown,
    arg?: Arg
  ) => Promise<Disposable>

  exposeFunction: (
    name: string,
    callback: (...args: unknown[]) => unknown | Promise<unknown>
  ) => Promise<Disposable>

  readonly cookieJar: CookieJar
  navigationPolicy: WebViewNavigationPolicy | null
}

export interface WebViewConstructor {
  new (options?: WebViewOptions): WebViewInstance
  readonly createNavigationPolicy: (
    handler: WebViewNavigationPolicy,
    options?: WebViewRequestLogOptions
  ) => WebViewNavigationPolicy
  readonly package: WebViewPackageInfo | null
  readonly NavigationAction: Readonly<{
    LOAD: undefined
    BLOCK: true
    OPEN_EXTERNAL: 2
  }>
}

interface LoggedPolicy {
  handler: WebViewNavigationPolicy
  options: WebViewRequestLogOptions
}

interface ViewLogState {
  defaults: WebViewRequestLogOptions
  goto?: { options: WebViewRequestLogOptions }
}

const loggedPolicies = new WeakMap<WebViewNavigationPolicy, LoggedPolicy>()
const wrappedViews = new WeakMap<WebViewInstance, ViewLogState>()

function mergeLogOptions (base: WebViewRequestLogOptions, overrides?: WebViewRequestLogOptions): WebViewRequestLogOptions {
  const mask = overrides?.sanitizeRequestLog
  return {
    log: overrides?.log ?? base.log,
    sanitizeRequestLog: mask === undefined
      ? base.sanitizeRequestLog
      : _.isPlainObject(base.sanitizeRequestLog) && _.isPlainObject(mask)
        ? _.merge({}, base.sanitizeRequestLog, mask)
        : mask
  }
}

function logNavigation (navigation: WebViewNavigation, options: WebViewRequestLogOptions): void {
  if (options.log !== false) {
    console.debug('request', sanitizeNetworkLog({
      id: generateRequestLogId(),
      ...navigation,
      headers: navigation.headers
    }, options.sanitizeRequestLog ?? false))
  }
}

export const createNavigationPolicy: WebViewConstructor['createNavigationPolicy'] = (handler, options = {}) => {
  const policy = (navigation: WebViewNavigation): ReturnType<WebViewNavigationPolicy> => {
    logNavigation(navigation, options)
    return handler(navigation)
  }
  loggedPolicies.set(policy, { handler, options })
  return policy
}

/** Installs logging on native policy assignments, including the legacy adapter's policy. */
export function wrapWebView (webView: WebViewInstance, options?: WebViewRequestLogOptions): WebViewInstance {
  const previousState = wrappedViews.get(webView)
  if (previousState !== undefined) {
    if (options !== undefined) Object.assign(previousState.defaults, { log: options.log, sanitizeRequestLog: options.sanitizeRequestLog })
    return webView
  }
  let descriptor: PropertyDescriptor | undefined
  for (let owner: object | null = webView; owner !== null; owner = Object.getPrototypeOf(owner) as object | null) {
    descriptor = Object.getOwnPropertyDescriptor(owner, 'navigationPolicy')
    if (descriptor !== undefined) break
  }
  const get = descriptor?.get as (() => WebViewNavigationPolicy | null) | undefined
  const set = descriptor?.set as ((value: unknown) => void) | undefined
  assert(get !== undefined && set !== undefined, 'Native WebView navigationPolicy accessor is missing')
  const state: ViewLogState = { defaults: { ...options } }
  const initialPolicy = get.call(webView)
  Object.defineProperty(webView, 'navigationPolicy', {
    configurable: true,
    enumerable: true,
    get: () => get.call(webView),
    set: (value: WebViewNavigationPolicy | null) => {
      const handler = value === null ? (_navigation: WebViewNavigation) => undefined : value
      if (typeof handler !== 'function') {
        set.call(webView, handler)
        return
      }
      const base = loggedPolicies.get(handler) ?? { handler, options: state.defaults }
      const policy = (navigation: WebViewNavigation): ReturnType<WebViewNavigationPolicy> => {
        logNavigation(navigation, mergeLogOptions(base.options, state.goto?.options))
        return base.handler(navigation)
      }
      loggedPolicies.set(policy, base)
      set.call(webView, policy)
    }
  })
  webView.navigationPolicy = initialPolicy
  const nativeGoto = webView.goto
  if (typeof nativeGoto === 'function') {
    webView.goto = async function (url, options) {
      let nativeOptions = options
      const scope: { options: WebViewRequestLogOptions } = { options: {} }
      if (options != null && typeof options === 'object' && !Array.isArray(options)) {
        const { log, sanitizeRequestLog, ...rest } = options
        scope.options = { log, sanitizeRequestLog }
        if ('log' in options || 'sanitizeRequestLog' in options) nativeOptions = rest
      }
      state.goto = scope
      try {
        await nativeGoto.call(this, url, nativeOptions)
      } finally {
        if (state.goto === scope) state.goto = undefined
      }
    }
  }
  wrappedViews.set(webView, state)
  return webView
}

export const WebView = proxyConstructor<WebViewConstructor>('WebView', {
  statics: { createNavigationPolicy },
  construct (target, args, newTarget) {
    return wrapWebView(Reflect.construct(target, [withWebViewTls(args[0]), ...args.slice(1)], newTarget) as WebViewInstance)
  }
})
