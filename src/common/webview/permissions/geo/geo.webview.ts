import type { PermissionRuntime } from '../core/browser'
import type { Position } from '.'

interface Task {
  cancelled: boolean
  cancellations: Set<() => void>
  cancel: () => void
}

interface Watch {
  success: PositionCallback
  failure?: PositionErrorCallback | null
  options: Required<PositionOptions>
  cancelled: boolean
  synthetic: boolean
  task: Task | null
  timer?: ReturnType<typeof setTimeout>
  nativeId?: number
  inFlight: Promise<unknown> | null
  last: string | null
}

type Result = { position: GeolocationPosition, failure?: never } | { failure: GeolocationPositionError, position?: never }

function positionError (code: number, message: string): GeolocationPositionError {
  return Object.freeze({ code, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
}

function message (error: unknown): string {
  const value = error !== null && typeof error === 'object' ? (error as { message?: unknown }).message : undefined
  return typeof value === 'string' ? value : 'Position provider failed'
}

function optionsFor (input?: PositionOptions): Required<PositionOptions> {
  if (input != null && typeof input !== 'object') throw new TypeError('Position options must be a dictionary')
  const value = input ?? {}
  const number = (n: unknown, fallback: number): number => n === undefined ? fallback : Number.isNaN(Number(n)) ? 0 : Math.max(0, Math.min(0xffffffff, Math.floor(Number(n))))
  return {
    enableHighAccuracy: Boolean(value.enableHighAccuracy),
    maximumAge: number(value.maximumAge, 0),
    timeout: number(value.timeout, Infinity)
  }
}

function positionFor (value: unknown): GeolocationPosition | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const { latitude, longitude, accuracy } = value as Partial<Position>
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
    typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
    (accuracy !== undefined && (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0))) return undefined
  return {
    coords: { latitude, longitude, accuracy: accuracy ?? 0, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now()
  }
}

function deliver<T> (callback: ((value: T) => void) | null | undefined, value: T): void {
  if (typeof callback !== 'function') return
  try { callback(value) } catch (failure) { setTimeout(() => { throw failure }, 0) }
}

function validateCallbacks (success: PositionCallback, failure?: PositionErrorCallback | null): void {
  if (typeof success !== 'function' || (failure != null && typeof failure !== 'function')) throw new TypeError('Invalid geolocation callback')
}

export default function installGeo (api: PermissionRuntime): void {
  const permission = 'geolocation'
  const allowed = (): boolean => {
    if (!window.isSecureContext) return false
    const documentPolicy = document as Document & { permissionsPolicy?: { allowsFeature: (feature: string) => boolean }, featurePolicy?: { allowsFeature: (feature: string) => boolean } }
    const policy = documentPolicy.permissionsPolicy ?? documentPolicy.featurePolicy
    return policy?.allowsFeature('geolocation') ?? true
  }
  api.guard(permission, allowed)
  let geo = navigator.geolocation as Partial<Geolocation> | undefined
  if (geo === undefined) {
    geo = {}
    api.replace(navigator, 'geolocation', geo)
  }
  const nativeGet = geo.getCurrentPosition
  const nativeWatch = geo.watchPosition
  const nativeClear = geo.clearWatch
  const tasks = new Set<Task>()
  const watches = new Map<number, Watch>()
  let nextWatch = 0x40000000
  let cache: { position: GeolocationPosition, highAccuracy: boolean } | null = null
  const createTask = (): Task => {
    const task: Task = {
      cancelled: false,
      cancellations: new Set(),
      cancel: () => {
        if (task.cancelled) return
        task.cancelled = true
        for (const cancel of task.cancellations) cancel()
        task.cancellations.clear()
        tasks.delete(task)
      }
    }
    tasks.add(task)
    return task
  }
  const living = (task: Task): boolean => api.alive && !task.cancelled
  const visible = async (task: Task): Promise<void> => {
    if (!document.hidden || !living(task)) return
    await new Promise<void>(resolve => {
      const finish = (): void => {
        document.removeEventListener('visibilitychange', onVisibility)
        task.cancellations.delete(finish)
        resolve()
      }
      const onVisibility = (): void => { if (!document.hidden) finish() }
      document.addEventListener('visibilitychange', onVisibility)
      task.cancellations.add(finish)
    })
  }
  const read = async (task: Task, operation: 'getCurrentPosition' | 'watchPosition', options: Required<PositionOptions>, watch?: Watch): Promise<Result | null> => {
    await visible(task)
    if (!living(task)) return null
    if (!allowed() || api.state(permission) !== 'granted') return { failure: positionError(1, 'Geolocation permission is denied') }
    if (cache !== null && options.maximumAge > 0 && Date.now() - cache.position.timestamp <= options.maximumAge && cache.highAccuracy === options.enableHighAccuracy) return { position: cache.position }
    // A timed-out provider cannot be cancelled through exposeFunction. Keep one
    // provider call per watch, even across timeout/visibility transitions.
    const inFlight = watch?.inFlight
    if (inFlight != null) {
      await Promise.race([inFlight.catch(() => {}), new Promise<void>(resolve => {
        const cancel = (): void => resolve()
        task.cancellations.add(cancel)
        void inFlight.then(() => task.cancellations.delete(cancel), () => task.cancellations.delete(cancel))
      })])
      if (!living(task)) return null
    }
    if (options.timeout === 0) return { failure: positionError(3, 'Geolocation request timed out') }
    const result = await new Promise<Result | null>(resolve => {
      let finished = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const finish = (result: Result | null): void => {
        if (finished) return
        finished = true
        clearTimeout(timer)
        task.cancellations.delete(cancel)
        resolve(result)
      }
      const cancel = (): void => finish(null)
      task.cancellations.add(cancel)
      if (Number.isFinite(options.timeout)) {
        const deadline = Date.now() + options.timeout
        const expire = (): void => {
          const remaining = deadline - Date.now()
          if (remaining <= 0) finish({ failure: positionError(3, 'Geolocation request timed out') })
          else timer = setTimeout(expire, Math.min(remaining, 0x7fffffff))
        }
        timer = setTimeout(expire, Math.min(options.timeout, 0x7fffffff))
      }
      const source = api.invoke(permission, operation, {
        options: {
          ...options,
          timeout: Number.isFinite(options.timeout) ? options.timeout : null
        }
      })
      if (watch !== undefined) {
        watch.inFlight = source
        const release = (): void => { if (watch.inFlight === source) watch.inFlight = null }
        void source.then(release, release)
      }
      void source.then(value => {
        const position = positionFor(value)
        finish(position === undefined ? { failure: positionError(2, 'Position is unavailable or invalid') } : { position })
      }, failure => finish({ failure: positionError(2, message(failure)) }))
    })
    if (!living(task) || result === null) return null
    await visible(task)
    if (!living(task)) return null
    if (!allowed()) return { failure: positionError(1, 'Geolocation permission is denied') }
    if (result.position !== undefined) cache = { position: result.position, highAccuracy: options.enableHighAccuracy }
    return result
  }
  const finishGet = (task: Task, success: PositionCallback, failure: PositionErrorCallback | null | undefined, result: Result | null): void => {
    if (!living(task) || result === null) return
    task.cancel()
    if (result.failure !== undefined) deliver(failure, result.failure)
    else deliver(success, result.position)
  }
  api.replace(geo, 'getCurrentPosition', function (success: PositionCallback, failure?: PositionErrorCallback | null, input?: PositionOptions): void {
    validateCallbacks(success, failure)
    if (!api.alive && nativeGet !== undefined) return nativeGet.call(geo, success, failure, input)
    const options = optionsFor(input)
    const task = createTask()
    const synthetic = (): void => { void read(task, 'getCurrentPosition', options).then(result => finishGet(task, success, failure, result), cause => finishGet(task, success, failure, { failure: positionError(2, message(cause)) })) }
    const denied = async (original: GeolocationPositionError, unavailable: boolean): Promise<void> => {
      try {
        if (await api.fallback(permission, 'geolocation.getCurrentPosition', unavailable ? 'unavailable' : original.code === 1 ? 'denied' : 'error', original)) {
          if (living(task)) synthetic()
        } else finishGet(task, success, failure, { failure: original })
      } catch (cause) { finishGet(task, success, failure, { failure: positionError(2, message(cause)) }) }
    }
    if (api.isActive(permission)) synthetic()
    else if (nativeGet !== undefined) {
      try {
        nativeGet.call(geo, position => finishGet(task, success, failure, { position }), original => { void denied(original, false) }, input)
      } catch (cause) { task.cancel(); throw cause }
    } else void denied(positionError(allowed() ? 2 : 1, 'Native geolocation is unavailable'), true)
  })
  const clearNative = (watch: Watch): void => {
    if (watch.nativeId !== undefined && nativeClear !== undefined) {
      nativeClear.call(geo, watch.nativeId)
      watch.nativeId = undefined
    }
  }
  const poll = async (watch: Watch): Promise<void> => {
    if (watch.cancelled || !api.alive || document.hidden || watch.task !== null) return
    const task = createTask()
    watch.task = task
    try {
      const result = await read(task, 'watchPosition', watch.options, watch)
      if (!living(task) || watch.cancelled || result === null) return
      if (result.failure !== undefined) deliver(watch.failure, result.failure)
      else {
        const signature = JSON.stringify(result.position.coords)
        if (signature !== watch.last) {
          watch.last = signature
          deliver(watch.success, result.position)
        }
      }
    } catch (cause) {
      if (living(task) && !watch.cancelled) deliver(watch.failure, positionError(2, message(cause)))
    } finally {
      task.cancel()
      if (watch.task === task) {
        watch.task = null
        if (!watch.cancelled && api.alive && !document.hidden) watch.timer = setTimeout(() => { void poll(watch) }, 1000)
      }
    }
  }
  const switchWatch = (watch: Watch): void => {
    if (watch.cancelled || watch.synthetic) return
    clearNative(watch)
    watch.synthetic = true
    void poll(watch)
  }
  api.cleanup(api.onActivate(permission, () => { for (const watch of watches.values()) switchWatch(watch) }))
  api.replace(geo, 'watchPosition', function (success: PositionCallback, failure?: PositionErrorCallback | null, input?: PositionOptions): number {
    validateCallbacks(success, failure)
    if (!api.alive && nativeWatch !== undefined) return nativeWatch.call(geo, success, failure, input)
    const watch: Watch = { success, failure, options: optionsFor(input), cancelled: false, synthetic: false, task: null, inFlight: null, last: null }
    const id = nextWatch++
    watches.set(id, watch)
    const denied = async (original: GeolocationPositionError, unavailable: boolean): Promise<void> => {
      if (watch.cancelled || !api.alive) return
      try {
        const accepted = await api.fallback(permission, 'geolocation.watchPosition', unavailable ? 'unavailable' : original.code === 1 ? 'denied' : 'error', original)
        if (watch.cancelled || !api.alive) return
        if (accepted) switchWatch(watch)
        else deliver(failure, original)
      } catch (cause) { if (!watch.cancelled && api.alive) deliver(failure, positionError(2, message(cause))) }
    }
    if (api.isActive(permission)) switchWatch(watch)
    else if (nativeWatch !== undefined) {
      try {
        watch.nativeId = nativeWatch.call(geo, position => { if (!watch.cancelled && api.alive && !watch.synthetic) deliver(success, position) }, original => { if (!watch.synthetic) void denied(original, false) }, input)
      } catch (cause) { watches.delete(id); throw cause }
    } else void denied(positionError(allowed() ? 2 : 1, 'Native geolocation is unavailable'), true)
    return id
  })
  const cancelWatch = (watch: Watch): void => {
    watch.cancelled = true
    clearTimeout(watch.timer)
    watch.task?.cancel()
    watch.task = null
    clearNative(watch)
  }
  api.replace(geo, 'clearWatch', (id: number) => {
    const watch = watches.get(Number(id))
    if (watch !== undefined) {
      cancelWatch(watch)
      watches.delete(Number(id))
    } else nativeClear?.call(geo, id)
  })
  const onVisibility = (): void => {
    for (const watch of watches.values()) {
      if (!watch.synthetic) continue
      if (document.hidden) {
        clearTimeout(watch.timer)
        watch.task?.cancel()
        watch.task = null
      } else void poll(watch)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  api.cleanup(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    let failure: unknown
    for (const task of tasks) task.cancel()
    for (const watch of watches.values()) {
      try { cancelWatch(watch) } catch (cause) { if (failure === undefined) failure = cause }
    }
    watches.clear()
    cache = null
    if (failure !== undefined) throw failure
  })
}
