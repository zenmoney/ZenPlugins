import { IncompatibleVersionError } from '../errors'
import get from '../types/get'
import type { EventSource } from './events'
import { proxyMethod } from './proxy'

export type ReadLineInputType =
  | 'text'
  | 'number'
  | 'password'
  | 'textPassword'
  | 'numberPassword'
  | 'phone'
  | 'textEmailAddress'
  | 'textWebEmailAddress'
  | 'numberDecimal'

export interface ReadLineOptions {
  image?: Uint8Array
  inputType?: ReadLineInputType
}

export interface PickDocumentsOptions {
  mimeTypes?: readonly string[]
  allowMultipleSelection?: boolean
}

export type PictureFormat = 'jpeg' | 'png'

export type VisibilityState = 'visible' | 'hidden'

export type Theme = 'light' | 'dark'

export interface VisibilityChangeEvent {
  readonly oldValue: VisibilityState
  readonly newValue: VisibilityState
}

export interface UiEvents {
  visibilitychange: [event: VisibilityChangeEvent]
}

/** Shared user interaction; see [UI contract](../../docs/plugins/runtime.md#background-execution-and-ui). */
export interface PluginUi extends EventSource<UiEvents> {
  readonly visibilityState: VisibilityState
  readonly theme: Theme
  alert: (message: string) => Promise<void>
  readLine: (message: string, options?: ReadLineOptions) => Promise<string | null>
  pickDocuments: (options?: PickDocumentsOptions) => Promise<Blob[]>
  takePicture: (format: PictureFormat) => Promise<Blob | null>
}

type NativeListener = (payload: VisibilityChangeEvent) => void
type NativeSubscription = (event: string | symbol, listener: NativeListener) => unknown

interface UiHost {
  on: NativeSubscription
  once: NativeSubscription
  off: NativeSubscription
  listenerCount: (event: string | symbol, listener?: NativeListener) => number
  emit: (event: symbol, payload: VisibilityChangeEvent) => boolean
  alert: PluginUi['alert']
  readLine: PluginUi['readLine']
  takePicture: PluginUi['takePicture']
  pickDocuments: (mimeTypes: string[], allowMultipleSelection: boolean) => Promise<Blob[]>
}

function visibility (state: unknown): VisibilityState {
  if (state === 'created') return 'hidden'
  if (state === 'started' || state === 'resumed') return 'visible'
  throw new Error('Unsupported application state')
}

// Normalize once per host; the native emitter owns every UI listener and its lifecycle.
const visibilityEvent = Symbol('Zenmoney.ui.visibilitychange')
const visibilityHosts = new WeakSet<object>()

function subscribe (method: 'on' | 'once', listener: NativeListener): void {
  const host = globalThis.ZenMoney
  const add = proxyMethod<UiHost[typeof method]>(method, host)
  if (!visibilityHosts.has(host)) {
    const emit = proxyMethod<UiHost['emit']>('emit', host)
    proxyMethod<UiHost['on']>('on', host)('visibilitychange', (payload: unknown) => {
      const oldValue = visibility(get(payload, 'oldValue'))
      const newValue = visibility(get(payload, 'newValue'))
      if (oldValue !== newValue) emit(visibilityEvent, { oldValue, newValue })
    })
    visibilityHosts.add(host)
  }
  add(visibilityEvent, listener)
}

export const ui: PluginUi = {
  get visibilityState () {
    const state = get(globalThis.ZenMoney, 'applicationState')
    if (state === undefined) throw new IncompatibleVersionError()
    return visibility(state)
  },
  get theme () {
    const theme = get(globalThis.ZenMoney, 'application.theme')
    if (theme === 'light' || theme === 'dark') return theme
    if (theme === undefined) throw new IncompatibleVersionError()
    throw new Error('Unsupported UI theme')
  },
  on (event, listener) {
    subscribe('on', listener)
    return this
  },
  once (event, listener) {
    subscribe('once', listener)
    return this
  },
  off (event, listener) {
    proxyMethod<UiHost['off']>('off')(visibilityEvent, listener)
    return this
  },
  listenerCount (event, listener) {
    return proxyMethod<UiHost['listenerCount']>('listenerCount')(visibilityEvent, listener)
  },
  async alert (message) {
    await proxyMethod<UiHost['alert']>('alert')(message)
  },
  async readLine (message, options) {
    return await proxyMethod<UiHost['readLine']>('readLine')(message, options)
  },
  async pickDocuments ({ mimeTypes = [], allowMultipleSelection = false } = {}) {
    return await proxyMethod<UiHost['pickDocuments']>('pickDocuments')([...mimeTypes], allowMultipleSelection)
  },
  async takePicture (format) {
    return await proxyMethod<UiHost['takePicture']>('takePicture')(format)
  }
}
