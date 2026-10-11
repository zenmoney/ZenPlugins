import type { BridgePacket, BridgeReply, PageConfig, PageLifecycle, PermissionRuntime } from './browser'
import type { PermissionFailure } from './internal'

interface NativeStatus {
  readonly state: PermissionState
  addEventListener?: EventTarget['addEventListener']
  removeEventListener?: EventTarget['removeEventListener']
}

type NativeQuery = (descriptor: unknown) => Promise<NativeStatus>

function errorInfo (error: unknown): NonNullable<PermissionFailure['error']> {
  const value = (error !== null && typeof error === 'object' ? error : {}) as { name?: unknown, message?: unknown, code?: unknown }
  return {
    name: typeof value.name === 'string' ? value.name : 'Error',
    message: typeof value.message === 'string' ? value.message : 'Permission operation failed',
    ...(typeof value.code === 'number' ? { code: value.code } : {})
  }
}

export default function install (config: PageConfig, installers: ReadonlyArray<(api: PermissionRuntime) => void>): void {
  if (window.top !== window || !config.origins.includes(window.location.origin)) return
  const owner = window as unknown as Record<string, PageLifecycle | undefined>
  if (owner[config.key] !== undefined) return
  const lifecycle: PageLifecycle = { documentId: null, stop: () => {}, dispose: () => {} }
  let disposed = false
  const start = (): void => {
    if (disposed || lifecycle.documentId !== null) return
    const documentId = Date.now().toString(36) + Math.random().toString(36)
    lifecycle.documentId = documentId
    let alive = true
    const cleanups: Array<() => void> = []
    const active = new Set(config.mode === 'force' ? Object.keys(config.permissions) : [])
    const pending = new Map<string, Promise<boolean>>()
    const statuses = new Map<string, Set<Status>>()
    const guards = new Map<string, () => boolean>()
    const activationListeners = new Map<string, Set<() => void>>()
    const configured = (name: string): boolean => Object.prototype.hasOwnProperty.call(config.permissions, name)
    const applicable = (name: string): boolean => guards.get(name)?.() ?? true
    const isActive = (name: string): boolean => alive && applicable(name) && active.has(name)
    const bridge = (window as unknown as Record<string, unknown>)[config.bridgeName] as (packet: BridgePacket) => Promise<BridgeReply>
    const invoke = async (kind: BridgePacket['kind'], permission: string, operation: string, data: unknown): Promise<unknown> => {
      if (!alive) throw new Error('Permission document is inactive')
      const result = await bridge({ kind, permission, operation, origin: window.location.origin, documentId, data })
      if (!alive) throw new Error('Permission document is inactive')
      if (!result.ok) throw new Error(result.message)
      return result.value
    }
    const fallback: PermissionRuntime['fallback'] = async (permission, operation, reason, error) => {
      if (!alive || !applicable(permission)) return false
      if (isActive(permission)) return true
      if (config.mode !== 'fallback') return false
      const existing = pending.get(permission)
      if (existing !== undefined) return await existing
      const decision = (async () => {
        const accepted = await invoke('fallback', permission, operation, { reason, ...(error === undefined ? {} : { error: errorInfo(error) }) })
        if (accepted !== true || !alive || !applicable(permission)) return false
        active.add(permission)
        for (const status of statuses.get(permission) ?? []) status.notify()
        for (const listener of activationListeners.get(permission) ?? []) listener()
        return true
      })()
      pending.set(permission, decision)
      try { return await decision } finally {
        if (pending.get(permission) === decision) pending.delete(permission)
      }
    }
    const replace: PermissionRuntime['replace'] = (owner, name, value) => {
      const descriptor = Object.getOwnPropertyDescriptor(owner, name)
      Object.defineProperty(owner, name, { configurable: true, enumerable: descriptor?.enumerable ?? true, writable: true, value })
      cleanups.push(() => {
        const current = Object.getOwnPropertyDescriptor(owner, name)
        if (current === undefined || (current.value as unknown) !== value) return
        if (descriptor !== undefined) Object.defineProperty(owner, name, descriptor)
        else Reflect.deleteProperty(owner, name)
      })
    }
    const stop = (): void => {
      if (!alive) return
      alive = false
      lifecycle.documentId = null
      let failure: unknown
      for (const cleanup of cleanups.reverse()) {
        try { cleanup() } catch (error) { if (failure === undefined) failure = error }
      }
      pending.clear()
      statuses.clear()
      activationListeners.clear()
      if (failure !== undefined) throw failure
    }
    lifecycle.stop = stop
    const api: PermissionRuntime = {
      get alive () { return alive },
      isActive,
      state: permission => config.permissions[permission],
      fallback,
      invoke: async (permission, operation, data) => await invoke('adapter', permission, operation, data),
      guard: (permission, guard) => { guards.set(permission, guard) },
      cleanup: cleanup => { cleanups.push(cleanup) },
      replace,
      onActivate: (permission, listener) => {
        let listeners = activationListeners.get(permission)
        if (listeners === undefined) activationListeners.set(permission, (listeners = new Set()))
        listeners.add(listener)
        return () => { listeners?.delete(listener) }
      }
    }
    class Status extends EventTarget {
      declare readonly name: string
      declare readonly state: PermissionState
      declare onchange: EventListener | null
      readonly notify: () => void

      constructor (name: string, native: NativeStatus) {
        super()
        let last = isActive(name) ? config.permissions[name] : native.state
        let handler: EventListener | null = null
        const onChange = (event: Event): void => { handler?.call(this, event) }
        Object.defineProperties(this, {
          name: { enumerable: true, get: () => name },
          state: { enumerable: true, get: () => isActive(name) ? config.permissions[name] : native.state },
          onchange: {
            enumerable: true,
            get: () => handler,
            set: (value: unknown) => {
              const next = typeof value === 'function' ? value as EventListener : null
              if (handler === null && next !== null) this.addEventListener('change', onChange)
              if (handler !== null && next === null) this.removeEventListener('change', onChange)
              handler = next
            }
          }
        })
        this.notify = () => {
          if (!alive || this.state === last) return
          last = this.state
          this.dispatchEvent(new Event('change'))
        }
        let group = statuses.get(name)
        if (group === undefined) statuses.set(name, (group = new Set()))
        group.add(this)
        native.addEventListener?.('change', this.notify)
        cleanups.push(() => native.removeEventListener?.('change', this.notify))
      }
    }
    try {
      let permissions = navigator.permissions as unknown as { query?: NativeQuery } | undefined
      if (permissions === undefined) {
        permissions = {}
        replace(navigator, 'permissions', permissions)
      }
      const nativeQuery = permissions.query
      const callNative = async (descriptor: unknown): Promise<NativeStatus> => {
        if (typeof nativeQuery !== 'function') throw new TypeError('Permissions query is unavailable')
        return await nativeQuery.call(permissions, descriptor)
      }
      replace(permissions, 'query', async (descriptor: unknown) => {
        const name = descriptor !== null && typeof descriptor === 'object' ? (descriptor as { name?: unknown }).name : undefined
        const basic = descriptor !== null && typeof descriptor === 'object' &&
          (Object.getPrototypeOf(descriptor) === Object.prototype || Object.getPrototypeOf(descriptor) === null) &&
          Reflect.ownKeys(descriptor).every(key => key === 'name')
        if (!alive || !basic || typeof name !== 'string' || !configured(name) || !applicable(name)) return await callNative(descriptor)
        if (isActive(name)) return new Status(name, { state: config.permissions[name] })
        let native: NativeStatus
        try {
          native = await callNative(descriptor)
        } catch (error) {
          const accepted = await fallback(name, 'permissions.query', typeof nativeQuery === 'function' ? 'error' : 'unavailable', error)
          if (!accepted) throw error
          return new Status(name, { state: config.permissions[name] })
        }
        if (!alive) return native
        const status = new Status(name, native)
        if (native.state === 'denied') await fallback(name, 'permissions.query', 'denied')
        return status
      })
      for (const installer of installers) installer(api)
    } catch (error) {
      try { stop() } catch (_) {}
      throw error
    }
  }
  const onHide = (): void => lifecycle.stop()
  const onShow = (event: PageTransitionEvent): void => { if (event.persisted) start() }
  lifecycle.dispose = () => {
    if (disposed) return
    disposed = true
    window.removeEventListener('pagehide', onHide)
    window.removeEventListener('pageshow', onShow)
    if (owner[config.key] === lifecycle) Reflect.deleteProperty(owner, config.key)
    lifecycle.stop()
  }
  Object.defineProperty(window, config.key, { configurable: true, value: lifecycle })
  window.addEventListener('pagehide', onHide)
  window.addEventListener('pageshow', onShow)
  try { start() } catch (error) { lifecycle.dispose(); throw error }
}
