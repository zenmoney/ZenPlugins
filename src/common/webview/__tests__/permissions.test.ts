import { createContext, runInContext } from 'vm'
import type { Context } from 'vm'
import { resolve as resolvePath } from 'path'
import { buildProductionScript } from '../../../../scripts/__tests__/helpers/webpack'
import type { Disposable, WebViewInstance } from '../../webView'
import { geoPermission, installPermissions } from '../permissions'
import type { Position } from '../permissions'

const ORIGIN = 'https://example.test'
const POSITION = { latitude: 53.89, longitude: 27.52, accuracy: 10 }
const NATIVE_ERROR: GeolocationPositionError = { code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }
const NATIVE_POSITION: GeolocationPosition = {
  coords: { ...POSITION, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
  timestamp: 1000
}

class NativeStatus extends EventTarget {
  constructor (public state: PermissionState = 'prompt') { super() }
  change (state: PermissionState): void {
    this.state = state
    this.dispatchEvent(new Event('change'))
  }
}

class PageDocument extends EventTarget {
  hidden = false
  visibilityState = 'visible'
  visible (value: boolean): void {
    this.hidden = !value
    this.visibilityState = value ? 'visible' : 'hidden'
    this.dispatchEvent(new Event('visibilitychange'))
  }
}

class View {
  readonly webView = this as unknown as WebViewInstance
  readonly bridges = new Map<string, (...args: unknown[]) => unknown>()
  readonly scripts = new Set<{ script: Function, arg: unknown }>()
  readonly listeners = new Set<() => void>()
  readonly document = new PageDocument()
  readonly nativeStatus = new NativeStatus()
  readonly nativeQuery = jest.fn(async () => this.nativeStatus)
  readonly nativeGet = jest.fn((_success: PositionCallback, failure?: PositionErrorCallback) => {
    failure?.(NATIVE_ERROR)
  })

  readonly nativeWatch = jest.fn((_success: PositionCallback, failure?: PositionErrorCallback) => {
    setTimeout(() => failure?.(NATIVE_ERROR), 0)
    return 7
  })

  readonly nativeClear = jest.fn()
  context!: Context
  closed = false
  currentUrl = `${ORIGIN}/login`
  failInit = false
  failEvaluate = false

  constructor () { this.page() }

  page (origin = ORIGIN): void {
    const events = new EventTarget()
    this.currentUrl = `${origin}/login`
    this.context = createContext({
      navigator: {
        permissions: { query: this.nativeQuery },
        geolocation: { getCurrentPosition: this.nativeGet, watchPosition: this.nativeWatch, clearWatch: this.nativeClear }
      },
      location: { origin, href: this.currentUrl },
      isSecureContext: true,
      document: this.document,
      EventTarget,
      Event,
      setTimeout,
      clearTimeout,
      Date,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events)
    })
    runInContext('window = globalThis; top = window', this.context)
    for (const [name, callback] of this.bridges) this.context[name] = callback
  }

  async navigate (origin = ORIGIN): Promise<void> {
    this.run("dispatchEvent(new Event('pagehide'))")
    this.page(origin)
    for (const item of this.scripts) this.execute(item.script, item.arg)
  }

  run<T = unknown> (source: string): T { return runInContext(source, this.context) as T }

  execute (script: Function, arg: unknown): unknown {
    this.context.__arg = arg
    return this.run(`(${script.toString()})(__arg)`)
  }

  async url (): Promise<string | null> { return this.currentUrl }
  async isClosed (): Promise<boolean> { return this.closed }
  on (_event: string, listener: () => void): this { this.listeners.add(listener); return this }
  off (_event: string, listener: () => void): this { this.listeners.delete(listener); return this }
  async close (): Promise<void> {
    this.closed = true
    for (const listener of this.listeners) listener()
    await settle()
  }

  async exposeFunction (name: string, callback: (...args: unknown[]) => unknown): Promise<Disposable> {
    this.bridges.set(name, callback)
    this.context[name] = callback
    return { dispose: async () => { this.bridges.delete(name); Reflect.deleteProperty(this.context, name) } }
  }

  async addInitScript (script: Function, arg: unknown): Promise<Disposable> {
    if (this.failInit) throw new Error('Init registration failed')
    const item = { script, arg }
    this.scripts.add(item)
    return { dispose: async () => { this.scripts.delete(item) } }
  }

  async evaluate (script: Function, arg?: unknown): Promise<unknown> {
    if (this.failEvaluate) throw new Error('Page evaluation failed')
    return this.execute(script, arg)
  }

  async query (descriptor = "{ name: 'geolocation' }"): Promise<PermissionStatus & { readonly name: string }> {
    return await this.run(`navigator.permissions.query(${descriptor})`)
  }

  async position (options = '{}'): Promise<{ coords: Position, timestamp: number }> {
    return await this.run(`new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, ${options}))`)
  }
}

async function settle (): Promise<void> {
  for (let i = 0; i < 40; i++) await Promise.resolve()
}

// [model] Synthetic browser APIs exercise fallback/lifecycle independently of bank data.
describe('[model] WebView permissions', () => {
  let view: View
  let disposables: Disposable[]
  beforeEach(() => { jest.useFakeTimers({ doNotFake: ['performance'] }); view = new View(); disposables = [] })
  afterEach(async () => {
    view.failEvaluate = false
    for (const disposable of disposables) await disposable.dispose()
    jest.useRealTimers()
  })

  async function install (options: { mode?: 'force' | 'fallback', fallbackWhen?: () => boolean | Promise<boolean>, getPosition?: () => Position | null | Promise<Position | null>, state?: PermissionState, adapter?: boolean } = {}): Promise<void> {
    const base = {
      origins: [ORIGIN],
      permissions: { geolocation: options.state ?? 'granted' },
      adapters: options.adapter === false ? [] : [geoPermission({ getPosition: options.getPosition ?? (() => POSITION) })]
    }
    disposables.push(await installPermissions(view.webView, options.mode === 'force'
      ? { ...base, mode: 'force' }
      : { ...base, mode: 'fallback', fallbackWhen: options.fallbackWhen ?? (() => true) }))
  }

  it('forces query state and position without replacing Promise', async () => {
    const promise = view.run('Promise')
    await install({ mode: 'force' })
    expect((await view.query()).state).toBe('granted')
    expect(await view.position()).toEqual({
      coords: { ...POSITION, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: expect.any(Number)
    })
    expect(view.nativeGet).not.toHaveBeenCalled()
    expect(view.run('Promise')).toBe(promise)
  })

  it('keeps prompt native and updates previously returned status on geo fallback', async () => {
    const fallback = jest.fn(() => true)
    await install({ fallbackWhen: fallback })
    const status = await view.query()
    const change = jest.fn()
    status.addEventListener('change', change)
    status.onchange = change
    expect(status.state).toBe('prompt')
    expect(fallback).not.toHaveBeenCalled()
    await view.position()
    expect(status.name).toBe('geolocation')
    expect(status.state).toBe('granted')
    expect(change).toHaveBeenCalledTimes(2)
    expect(Reflect.set(status, 'state', 'denied')).toBe(false)
    expect(Reflect.set(status, 'name', 'camera')).toBe(false)
  })

  it('mirrors native changes before activation and ignores revoke after activation', async () => {
    await install()
    const status = await view.query()
    const change = jest.fn()
    status.addEventListener('change', change)
    view.nativeStatus.change('granted')
    expect(status.state).toBe('granted')
    view.nativeStatus.change('prompt')
    await view.position()
    view.nativeStatus.change('denied')
    expect(status.state).toBe('granted')
    expect(change).toHaveBeenCalledTimes(3)
  })

  it('does not call the provider for a working native position', async () => {
    const provider = jest.fn(() => POSITION)
    view.nativeGet.mockImplementation(success => success(NATIVE_POSITION))
    await install({ getPosition: provider })
    expect(await view.position()).toEqual(NATIVE_POSITION)
    expect(provider).not.toHaveBeenCalled()
  })

  it('retries after rejected fallback and preserves original native errors', async () => {
    const fallback = jest.fn().mockReturnValueOnce(false).mockReturnValue(true)
    await install({ fallbackWhen: fallback })
    await expect(view.position()).rejects.toMatchObject({ code: 1, message: 'User denied Geolocation' })
    expect((await view.position()).coords).toMatchObject(POSITION)
    expect(fallback).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent decisions, not position requests', async () => {
    let accept!: (value: boolean) => void
    const fallback = jest.fn(async () => await new Promise<boolean>(resolve => { accept = resolve }))
    const provider = jest.fn(() => POSITION)
    await install({ fallbackWhen: fallback, getPosition: provider })
    const one = view.position()
    const two = view.position()
    await settle()
    expect(fallback).toHaveBeenCalledTimes(1)
    accept(true)
    await Promise.all([one, two])
    expect(provider).toHaveBeenCalledTimes(2)
  })

  it('passes extended descriptors and unconfigured permissions through', async () => {
    await install({ mode: 'force' })
    expect(await view.query("{ name: 'geolocation', extra: false }")).toBe(view.nativeStatus)
    expect(await view.query("{ name: 'camera', panTiltZoom: true }")).toBe(view.nativeStatus)
    expect(await view.query("{ name: 'microphone' }")).toBe(view.nativeStatus)
    expect(view.nativeQuery).toHaveBeenCalledTimes(3)
  })

  it('supports missing query without assuming geo is broken', async () => {
    view.run('delete navigator.permissions')
    const provider = jest.fn(() => POSITION)
    view.nativeGet.mockImplementation(success => success(NATIVE_POSITION))
    await install({ getPosition: provider, fallbackWhen: () => false })
    await expect(view.query()).rejects.toMatchObject({ name: 'TypeError' })
    await view.position()
    expect(provider).not.toHaveBeenCalled()
    await expect(view.query("{ name: 'camera', panTiltZoom: true }")).rejects.toMatchObject({ name: 'TypeError' })
  })

  it.each([null, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: 0, longitude: 0, accuracy: -1 }])('rejects unavailable/invalid position %p', async value => {
    await install({ mode: 'force', getPosition: () => value })
    await expect(view.position()).rejects.toMatchObject({ code: 2 })
  })

  it('uses cache before timeout zero and passes normalized options', async () => {
    const provider = jest.fn(() => POSITION)
    await install({ mode: 'force', getPosition: provider })
    await expect(view.position('{ timeout: 0 }')).rejects.toMatchObject({ code: 3 })
    expect(provider).not.toHaveBeenCalled()
    await view.position('{ enableHighAccuracy: true }')
    expect(provider).toHaveBeenCalledWith({ origin: ORIGIN, operation: 'getCurrentPosition', options: { enableHighAccuracy: true, maximumAge: 0, timeout: Infinity } })
    await view.position('{ maximumAge: 1000, timeout: 0, enableHighAccuracy: true }')
    expect(provider).toHaveBeenCalledTimes(1)
  })

  it('times out asynchronous providers and never delivers their late result', async () => {
    let complete!: (position: Position) => void
    const provider = jest.fn(async () => await new Promise<Position>(resolve => { complete = resolve }))
    await install({ mode: 'force', getPosition: provider })
    const result = view.position('{ timeout: 25 }')
    const assertion = expect(result).rejects.toMatchObject({ code: 3 })
    await settle()
    jest.advanceTimersByTime(25)
    await assertion
    complete(POSITION)
    await settle()
    expect(provider).toHaveBeenCalledTimes(1)
  })

  it('does not shorten a timeout above the browser timer limit', async () => {
    await install({ mode: 'force', getPosition: async () => await new Promise<Position>(() => {}) })
    view.run('failures = []; navigator.geolocation.getCurrentPosition(() => {}, e => failures.push(e), { timeout: 0xffffffff })')
    await settle()
    jest.advanceTimersByTime(0x7fffffff)
    await settle()
    expect(view.run('failures')).toEqual([])
    jest.advanceTimersByTime(0x80000000)
    await settle()
    expect(view.run<GeolocationPositionError[]>('failures')).toMatchObject([{ code: 3 }])
  })

  it('polls watch without duplicate coordinates and stops after clearWatch', async () => {
    const provider = jest.fn(() => POSITION)
    await install({ mode: 'force', getPosition: provider })
    view.run('positions = []; watch = navigator.geolocation.watchPosition(p => positions.push(p))')
    await settle()
    jest.advanceTimersByTime(1000)
    await settle()
    expect(provider).toHaveBeenCalledTimes(2)
    expect(view.run<unknown[]>('positions')).toHaveLength(1)
    view.run('navigator.geolocation.clearWatch(watch)')
    jest.advanceTimersByTime(5000)
    await settle()
    expect(provider).toHaveBeenCalledTimes(2)
  })

  it('pauses hidden requests and watches until visible', async () => {
    const provider = jest.fn(() => POSITION)
    view.document.visible(false)
    await install({ mode: 'force', getPosition: provider })
    const result = view.position('{ timeout: 10 }')
    jest.advanceTimersByTime(100)
    await settle()
    expect(provider).not.toHaveBeenCalled()
    view.document.visible(true)
    await result
    expect(provider).toHaveBeenCalledTimes(1)
  })

  it.each(['isSecureContext = false', 'document.permissionsPolicy = { allowsFeature: () => false }'])('does not override forbidden contexts: %s', async setup => {
    view.run(setup)
    const provider = jest.fn(() => POSITION)
    await install({ mode: 'force', getPosition: provider })
    expect((await view.query()).state).toBe('prompt')
    await expect(view.position()).rejects.toMatchObject({ code: 1 })
    expect(provider).not.toHaveBeenCalled()
  })

  it('retries native after navigation and restored BFCache documents', async () => {
    await install()
    await view.position()
    await view.navigate()
    expect((await view.query()).state).toBe('prompt')
    await view.position()
    view.run("dispatchEvent(new Event('pagehide')); dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }))")
    expect((await view.query()).state).toBe('prompt')
    expect(view.nativeGet).toHaveBeenCalledTimes(2)
  })

  it('does not install in another origin or a child frame', async () => {
    await install({ mode: 'force' })
    await view.navigate('https://other.test')
    expect((await view.query()).state).toBe('prompt')
    view.page()
    view.run('top = {}')
    for (const item of view.scripts) view.execute(item.script, item.arg)
    expect((await view.query()).state).toBe('prompt')
  })

  it('restores owned wrappers, removes registrations, and permits reinstallation', async () => {
    await install({ mode: 'force' })
    await disposables[0].dispose()
    await disposables[0].dispose()
    expect(view.run('navigator.permissions.query')).toBe(view.nativeQuery)
    expect(view.run('navigator.geolocation.getCurrentPosition')).toBe(view.nativeGet)
    expect(view.bridges.size).toBe(0)
    expect(view.scripts.size).toBe(0)
    expect(view.listeners.size).toBe(0)
    await install({ mode: 'force' })
  })

  it('rolls back failed installation and permits retry', async () => {
    view.failEvaluate = true
    await expect(install()).rejects.toThrow('Page evaluation failed')
    expect(view.bridges.size).toBe(0)
    expect(view.scripts.size).toBe(0)
    expect(view.listeners.size).toBe(0)
    view.failEvaluate = false
    await install()
  })

  it('rejects duplicate installation and incompatible adapter state', async () => {
    await install()
    await expect(install()).rejects.toThrow('already installed')
    const other = new View()
    await expect(installPermissions(other.webView, { origins: [ORIGIN], mode: 'force', permissions: { geolocation: 'prompt' }, adapters: [geoPermission({ getPosition: () => POSITION })] })).rejects.toThrow('prompt')
  })

  it('cancels pending delivery on dispose and automatically cleans up on close', async () => {
    let complete!: (value: Position) => void
    await install({ mode: 'force', getPosition: async () => await new Promise<Position>(resolve => { complete = resolve }) })
    view.run('received = []; navigator.geolocation.getCurrentPosition(p => received.push(p), e => received.push(e))')
    await settle()
    await disposables[0].dispose()
    complete(POSITION)
    await settle()
    expect(view.run('received')).toEqual([])
    await install()
    await view.close()
    expect(view.bridges.size).toBe(0)
    expect(view.scripts.size).toBe(0)
  })

  it('activates denied query and supports query-only permissions independently', async () => {
    view.nativeStatus.change('denied')
    const fallback = jest.fn(() => true)
    await install({ fallbackWhen: fallback, adapter: false })
    expect((await view.query()).state).toBe('granted')
    expect(view.run('navigator.geolocation.getCurrentPosition')).toBe(view.nativeGet)
    expect(fallback).toHaveBeenCalledWith({ origin: ORIGIN, permission: 'geolocation', operation: 'permissions.query', reason: 'denied' })
    await disposables[0].dispose()
    disposables.push(await installPermissions(view.webView, { origins: [ORIGIN], mode: 'force', permissions: { camera: 'granted', microphone: 'prompt' } }))
    expect((await view.query("{ name: 'camera' }")).state).toBe('granted')
    expect((await view.query("{ name: 'microphone' }")).state).toBe('prompt')
  })

  it('falls back when both native APIs are absent, but passes non-basic query through', async () => {
    view.run('delete navigator.permissions; delete navigator.geolocation')
    await install()
    expect((await view.query()).state).toBe('granted')
    expect((await view.position()).coords).toMatchObject(POSITION)
    await expect(view.query("{ name: 'geolocation', extra: false }")).rejects.toMatchObject({ name: 'TypeError' })
    await disposables[0].dispose()
    expect(view.run('navigator.permissions')).toBeUndefined()
    expect(view.run('navigator.geolocation')).toBeUndefined()
  })

  it('reports predicate/source errors and retries a failed decision', async () => {
    const fallback = jest.fn().mockRejectedValueOnce(new Error('Predicate failed')).mockReturnValue(true)
    const provider = jest.fn().mockRejectedValueOnce(new Error('Provider failed')).mockReturnValue(POSITION)
    await install({ fallbackWhen: fallback, getPosition: provider })
    await expect(view.position()).rejects.toMatchObject({ code: 2, message: 'Predicate failed' })
    await expect(view.position()).rejects.toMatchObject({ code: 2, message: 'Provider failed' })
    expect((await view.position()).coords).toMatchObject(POSITION)
    expect(fallback).toHaveBeenCalledTimes(2)
  })

  it('force denied does not call the provider, and validates callback arguments', async () => {
    const provider = jest.fn(() => POSITION)
    await install({ mode: 'force', state: 'denied', getPosition: provider })
    expect((await view.query()).state).toBe('denied')
    await expect(view.position()).rejects.toMatchObject({ code: 1 })
    expect(provider).not.toHaveBeenCalled()
    expect(() => view.run('navigator.geolocation.getCurrentPosition(null)')).toThrow('Invalid geolocation callback')
    view.run('navigator.geolocation.getCurrentPosition(() => {})')
    await settle()
  })

  it('switches native watches to synthetic positions and clears the native ID', async () => {
    const provider = jest.fn(() => POSITION)
    await install({ getPosition: provider })
    view.run('received = []; watch = navigator.geolocation.watchPosition(p => received.push(p))')
    jest.advanceTimersByTime(0)
    await settle()
    expect(provider).toHaveBeenCalledTimes(1)
    expect(view.nativeClear).toHaveBeenCalledWith(7)
    expect(view.run<unknown[]>('received')).toHaveLength(1)
    expect((await view.query()).state).toBe('granted')
    view.run('navigator.geolocation.clearWatch(watch)')
  })

  it('clears a watch while fallback is pending without starting its source', async () => {
    let accept!: (value: boolean) => void
    const provider = jest.fn(() => POSITION)
    await install({ getPosition: provider, fallbackWhen: async () => await new Promise<boolean>(resolve => { accept = resolve }) })
    view.run('received = []; watch = navigator.geolocation.watchPosition(p => received.push(p), e => received.push(e))')
    jest.advanceTimersByTime(0)
    await settle()
    view.run('navigator.geolocation.clearWatch(watch)')
    accept(true)
    await settle()
    expect(provider).not.toHaveBeenCalled()
    expect(view.run('received')).toEqual([])
    expect(view.nativeClear).toHaveBeenCalledWith(7)
  })

  it('does not overlap providers across watch timeout and visibility transitions', async () => {
    const completions: Array<(value: Position) => void> = []
    const provider = jest.fn(async () => await new Promise<Position>(resolve => { completions.push(resolve) }))
    await install({ mode: 'force', getPosition: provider })
    view.run('received = []; failures = []; watch = navigator.geolocation.watchPosition(p => received.push(p), e => failures.push(e), { timeout: 10 })')
    await settle()
    jest.advanceTimersByTime(10)
    await settle()
    expect(view.run<unknown[]>('failures')).toHaveLength(1)
    jest.advanceTimersByTime(1000)
    await settle()
    expect(provider).toHaveBeenCalledTimes(1)
    view.document.visible(false)
    view.document.visible(true)
    await settle()
    expect(provider).toHaveBeenCalledTimes(1)
    completions[0](POSITION)
    await settle()
    expect(provider).toHaveBeenCalledTimes(2)
    expect(view.run('received')).toEqual([])
    completions[1]({ ...POSITION, latitude: 54 })
    await settle()
    expect(view.run<unknown[]>('received')).toHaveLength(1)
  })

  it('drops old-document provider results and handles a first-script request', async () => {
    let complete!: (value: Position) => void
    const provider = jest.fn(async () => await new Promise<Position>(resolve => { complete = resolve }))
    await install({ mode: 'force', getPosition: provider })
    view.run('received = []; navigator.geolocation.getCurrentPosition(p => received.push(p), e => received.push(e))')
    const oldPage = view.context
    await settle()
    await view.navigate()
    complete(POSITION)
    await settle()
    expect(runInContext('received', oldPage)).toEqual([])
    await disposables[0].dispose()
    await install({ mode: 'force' })
    await view.navigate()
    // Model the very first page script, synchronously following init-script execution.
    expect((await view.position()).coords).toMatchObject(POSITION)
  })

  it('rolls back partial page patches when an adapter cannot be installed', async () => {
    view.run("Object.defineProperty(navigator.geolocation, 'watchPosition', { configurable: false, value: navigator.geolocation.watchPosition })")
    await expect(install({ mode: 'force' })).rejects.toThrow()
    expect(view.run('navigator.permissions.query')).toBe(view.nativeQuery)
    expect(view.run('navigator.geolocation.getCurrentPosition')).toBe(view.nativeGet)
    expect(view.bridges.size).toBe(0)
    expect(view.scripts.size).toBe(0)
  })

  it('restores other patches without overwriting a later owner', async () => {
    await install({ mode: 'force' })
    view.run('replacement = () => {}; navigator.geolocation.getCurrentPosition = replacement')
    await disposables[0].dispose()
    expect(view.run('navigator.geolocation.getCurrentPosition === replacement')).toBe(true)
    expect(view.run('navigator.permissions.query')).toBe(view.nativeQuery)
  })

  it('cleans up registrations when close interrupts installation', async () => {
    const register = view.addInitScript.bind(view)
    view.addInitScript = async (script, arg) => {
      const result = await register(script, arg)
      await view.close()
      return result
    }
    await expect(install()).rejects.toThrow('closed during permission installation')
    expect(view.bridges.size).toBe(0)
    expect(view.scripts.size).toBe(0)
    expect(view.listeners.size).toBe(0)
  })

  it('keeps JavaScript and TypeScript page scripts self-contained through the production Webpack pipeline', async () => {
    jest.useRealTimers()
    view = new View()
    const code = await buildProductionScript(resolvePath(__dirname, '../permissions/index.ts'))
    const module = { exports: {} }
    runInContext(code, createContext({ module, exports: module.exports, URL, console }))
    const api = module.exports as typeof import('../permissions')
    const provider = jest.fn(() => POSITION)
    disposables.push(await api.installPermissions(view.webView, {
      mode: 'fallback',
      origins: [ORIGIN],
      permissions: { geolocation: 'granted' },
      fallbackWhen: () => true,
      adapters: [api.geoPermission({ getPosition: provider })]
    }))
    expect((await view.position()).coords).toMatchObject(POSITION)
    expect((await view.query()).state).toBe('granted')
    await view.navigate()
    expect((await view.position()).coords).toMatchObject(POSITION)
  }, 20000)
})
