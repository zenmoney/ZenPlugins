import { EventEmitter } from 'events'
import { IncompatibleVersionError } from '../errors'
import { ui } from './ui'

type ApplicationState = 'created' | 'started' | 'resumed'

interface ModelHost {
  host: {
    applicationState: ApplicationState
    on: jest.MockedFunction<EventEmitter['on']>
    off: jest.MockedFunction<EventEmitter['off']>
    once: jest.MockedFunction<EventEmitter['once']>
    listenerCount: jest.MockedFunction<EventEmitter['listenerCount']>
    emit: jest.MockedFunction<EventEmitter['emit']>
    alert: jest.Mock<Promise<void>, [message: string]>
    readLine: jest.Mock<Promise<string | null>, [message: string, options?: unknown]>
    pickDocuments: jest.Mock<Promise<Blob[]>, [mimeTypes: string[], multiple: boolean]>
    takePicture: jest.Mock<Promise<Blob | null>, [format: string]>
  }
  events: EventEmitter
  change: (state: ApplicationState) => void
}

function makeHost (applicationState: ApplicationState = 'created'): ModelHost {
  const events = new EventEmitter()
  const host = {
    applicationState,
    on: jest.fn(events.on.bind(events)),
    off: jest.fn(events.off.bind(events)),
    once: jest.fn(events.once.bind(events)),
    listenerCount: jest.fn(events.listenerCount.bind(events)),
    emit: jest.fn(events.emit.bind(events)),
    alert: jest.fn(async (_message: string) => {}),
    readLine: jest.fn(async (_message: string, _options?: unknown): Promise<string | null> => 'model input'),
    pickDocuments: jest.fn(async (_mimeTypes: string[], _multiple: boolean): Promise<Blob[]> => []),
    takePicture: jest.fn(async (_format: string): Promise<Blob | null> => null)
  }
  return {
    host,
    events,
    change (state: ApplicationState) {
      const oldValue = host.applicationState
      host.applicationState = state
      const event = { applicationState: state, oldValue, newValue: state }
      events.emit('applicationState', event)
      events.emit('visibilitychange', event)
    }
  }
}

// [model] UI normalizes visibility once per host and delegates subscriptions to its native emitter.
describe('[model] shared UI adapter', () => {
  const originalHost = global.ZenMoney
  let model: ReturnType<typeof makeHost>

  beforeEach(() => {
    model = makeHost()
    global.ZenMoney = model.host as unknown as typeof ZenMoney
  })

  afterEach(() => {
    model.events.removeAllListeners()
    global.ZenMoney = originalHost
  })

  it.each([
    ['created', 'hidden'],
    ['started', 'visible'],
    ['resumed', 'visible']
  ] as const)('maps %s to %s without subscribing to host events', (state, expected) => {
    model.host.applicationState = state
    expect(ui.visibilityState).toBe(expected)
    expect(model.host.on).not.toHaveBeenCalled()
  })

  it.each(['light', 'dark'] as const)('reads the current host theme: %s', theme => {
    global.ZenMoney = { ...model.host, application: { theme } } as unknown as typeof ZenMoney
    expect(ui.theme).toBe(theme)
    expect(model.host.on).not.toHaveBeenCalled()
  })

  it('does not guess a missing or invalid theme', () => {
    expect(() => ui.theme).toThrow(IncompatibleVersionError)
    global.ZenMoney = { application: { theme: 'system' } } as unknown as typeof ZenMoney
    expect(() => ui.theme).toThrow('Unsupported UI theme')
  })

  it('filters transitions by their old and new visibility, without consuming once prematurely', () => {
    model.change('started')
    const listener = jest.fn()
    ui.once('visibilitychange', listener)
    model.change('resumed')
    model.change('started')
    expect(listener).not.toHaveBeenCalled()
    expect(ui.listenerCount('visibilitychange', listener)).toBe(1)
    expect(model.host.emit).not.toHaveBeenCalled()
    model.change('created')
    expect(listener.mock.calls).toEqual([[{ oldValue: 'visible', newValue: 'hidden' }]])
    expect(ui.listenerCount('visibilitychange', listener)).toBe(0)
    model.change('resumed')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(model.host.once).toHaveBeenCalledTimes(1)
    expect(model.host.off).not.toHaveBeenCalled()
  })

  it('preserves duplicate registrations and off ordering across on and once', () => {
    const listener = jest.fn()
    ui.on('visibilitychange', listener).once('visibilitychange', listener).on('visibilitychange', listener)
    expect(ui.listenerCount('visibilitychange', listener)).toBe(3)
    ui.off('visibilitychange', listener)
    model.change('started')
    expect(listener).toHaveBeenCalledTimes(2)
    expect(ui.listenerCount('visibilitychange', listener)).toBe(1)
    model.change('resumed')
    expect(listener).toHaveBeenCalledTimes(2)
    ui.off('visibilitychange', listener)
    expect(ui.listenerCount('visibilitychange')).toBe(0)
  })

  it('can remove an unfired once listener by its original identity', () => {
    const listener = jest.fn()
    ui.once('visibilitychange', listener)
    const [event, nativeListener] = model.host.once.mock.calls[0]
    expect(typeof event).toBe('symbol')
    ui.off('visibilitychange', listener)
    expect(model.host.off).toHaveBeenCalledWith(event, nativeListener)
    model.change('started')
    expect(listener).not.toHaveBeenCalled()
    expect(ui.listenerCount('visibilitychange')).toBe(0)
  })

  it('keeps raw application events available alongside filtered visibility events', () => {
    const raw = jest.fn()
    const filtered = jest.fn()
    model.host.on('applicationState', raw)
    ui.on('visibilitychange', filtered)
    model.change('started')
    model.change('resumed')
    model.change('created')
    expect(raw).toHaveBeenCalledTimes(3)
    expect(filtered).toHaveBeenCalledTimes(2)
    expect(model.host.applicationState).toBe('created')
    expect(ui.visibilityState).toBe('hidden')
    expect(ui).not.toHaveProperty('applicationState')
    expect(raw.mock.calls).toEqual([
      [{ applicationState: 'started', oldValue: 'created', newValue: 'started' }],
      [{ applicationState: 'resumed', oldValue: 'started', newValue: 'resumed' }],
      [{ applicationState: 'created', oldValue: 'resumed', newValue: 'created' }]
    ])
    expect(filtered.mock.calls).toEqual([
      [{ oldValue: 'hidden', newValue: 'visible' }],
      [{ oldValue: 'visible', newValue: 'hidden' }]
    ])
    expect(filtered.mock.instances).toEqual([model.events, model.events])
  })

  it('normalizes native visibility notifications without mutating the payload or reading a later state', () => {
    const listener = jest.fn()
    ui.on('visibilitychange', listener)
    const payload = Object.freeze({ applicationState: 'resumed', oldValue: 'created', newValue: 'resumed' })
    model.events.emit('visibilitychange', payload)
    expect(listener.mock.calls).toEqual([[{ oldValue: 'hidden', newValue: 'visible' }]])
    expect(payload).toEqual({ applicationState: 'resumed', oldValue: 'created', newValue: 'resumed' })
    expect(ui.visibilityState).toBe('hidden')
    expect(model.host.on.mock.calls[0][0]).toBe('visibilitychange')
    expect(model.events.listenerCount('applicationState')).toBe(0)
  })

  it('uses one native visibility bridge and delegates listener counting without mixing raw listeners', () => {
    const listener = jest.fn()
    model.host.on('visibilitychange', listener)
    ui.on('visibilitychange', listener).once('visibilitychange', listener)
    const [event, onceListener] = model.host.once.mock.calls[0]
    expect(typeof event).toBe('symbol')
    expect(model.host.on.mock.calls.filter(([name]) => name === 'visibilitychange')).toHaveLength(2)
    expect(ui.listenerCount('visibilitychange')).toBe(2)
    expect(model.host.listenerCount).toHaveBeenLastCalledWith(event, undefined)
    ui.off('visibilitychange', listener)
    expect(model.host.off).toHaveBeenLastCalledWith(event, onceListener)
    expect(model.events.listeners('visibilitychange')).toContain(listener)
    model.change('started')
    expect(model.host.emit).toHaveBeenCalledWith(event, { oldValue: 'hidden', newValue: 'visible' })
    for (const method of [model.host.on, model.host.once, model.host.off, model.host.listenerCount, model.host.emit]) {
      const receivers: unknown[] = method.mock.instances
      expect(receivers.every(receiver => receiver === model.host)).toBe(true)
    }
    const unregistered = jest.fn()
    ui.off('visibilitychange', unregistered)
    expect(model.host.off).toHaveBeenLastCalledWith(event, unregistered)
  })

  it('can retry a failed native visibility subscription', () => {
    const listener = jest.fn()
    const error = new Error('Model subscription failure')
    model.host.on.mockImplementationOnce(() => { throw error })
    expect(() => ui.on('visibilitychange', listener)).toThrow(error)
    expect(ui.listenerCount('visibilitychange', listener)).toBe(0)
    ui.on('visibilitychange', listener)
    model.change('started')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('does not wrap or swallow synchronous subscription failures', () => {
    const error = new Error('Model subscription failure')
    model.host.on.mockImplementation(() => { throw error })
    expect(() => ui.on('visibilitychange', jest.fn())).toThrow(error)
  })

  it('forwards interaction arguments, results and host receivers', async () => {
    const image = new Uint8Array([1, 2])
    const file = new Blob(['model document'], { type: 'application/pdf' })
    model.host.pickDocuments.mockResolvedValue([file])
    model.host.takePicture.mockResolvedValue(file)
    await expect(ui.alert('Model message')).resolves.toBeUndefined()
    await expect(ui.readLine('Model input', { image, inputType: 'numberPassword' })).resolves.toBe('model input')
    await expect(ui.pickDocuments({ mimeTypes: ['application/pdf'], allowMultipleSelection: true })).resolves.toEqual([file])
    await expect(ui.takePicture('png')).resolves.toBe(file)
    expect(model.host.alert.mock.calls).toEqual([['Model message']])
    expect(model.host.readLine.mock.calls).toEqual([['Model input', { image, inputType: 'numberPassword' }]])
    expect(model.host.pickDocuments.mock.calls).toEqual([[['application/pdf'], true]])
    expect(model.host.takePicture.mock.calls).toEqual([['png']])
    for (const method of [model.host.alert, model.host.readLine, model.host.pickDocuments, model.host.takePicture]) {
      expect(method.mock.instances).toEqual([model.host])
    }
  })

  it('preserves absent input and uses picker defaults without mutating filters', async () => {
    model.host.readLine.mockResolvedValue(null)
    await expect(ui.readLine('Model input')).resolves.toBeNull()
    await expect(ui.takePicture('jpeg')).resolves.toBeNull()
    await expect(ui.pickDocuments()).resolves.toEqual([])
    const mimeTypes = Object.freeze(['application/pdf'])
    model.host.pickDocuments.mockImplementation(async filters => {
      filters.push('model/type')
      return []
    })
    await ui.pickDocuments({ mimeTypes })
    expect(mimeTypes).toEqual(['application/pdf'])
    expect(model.host.pickDocuments.mock.calls[0]).toEqual([[], false])
  })

  it.each([false, true])('propagates original host errors (asynchronous: %s)', async asynchronous => {
    const error = new Error('Model interaction failure')
    const fail = asynchronous
      ? async (): Promise<never> => { throw error }
      : (): never => { throw error }
    global.ZenMoney = { alert: fail, readLine: fail, pickDocuments: fail, takePicture: fail } as unknown as typeof ZenMoney
    await expect(ui.alert('Model message')).rejects.toBe(error)
    await expect(ui.readLine('Model input')).rejects.toBe(error)
    await expect(ui.pickDocuments()).rejects.toBe(error)
    await expect(ui.takePicture('jpeg')).rejects.toBe(error)
  })

  it('resolves the host lazily and keeps subscriptions separate across hosts', () => {
    Reflect.deleteProperty(global, 'ZenMoney')
    expect(() => jest.requireActual('./ui')).not.toThrow()
    expect(() => ui.visibilityState).toThrow(IncompatibleVersionError)
    global.ZenMoney = model.host as unknown as typeof ZenMoney
    const firstListener = jest.fn()
    ui.on('visibilitychange', firstListener)
    const second = makeHost('resumed')
    global.ZenMoney = second.host as unknown as typeof ZenMoney
    expect(ui.visibilityState).toBe('visible')
    expect(ui.listenerCount('visibilitychange')).toBe(0)
    const secondListener = jest.fn()
    ui.on('visibilitychange', secondListener)
    second.change('created')
    expect(secondListener).toHaveBeenCalledTimes(1)
    expect(firstListener).not.toHaveBeenCalled()
    ui.off('visibilitychange', secondListener)
    global.ZenMoney = model.host as unknown as typeof ZenMoney
    ui.off('visibilitychange', firstListener)
  })

  it('checks only the capability being used and does not guess missing or invalid state', async () => {
    global.ZenMoney = { alert: model.host.alert } as unknown as typeof ZenMoney
    await expect(ui.alert('Model message')).resolves.toBeUndefined()
    expect(() => ui.visibilityState).toThrow(IncompatibleVersionError)
    expect(() => ui.on('visibilitychange', jest.fn())).toThrow(IncompatibleVersionError)
    await expect(ui.readLine('Model input')).rejects.toBeInstanceOf(IncompatibleVersionError)
    await expect(ui.pickDocuments()).rejects.toBeInstanceOf(IncompatibleVersionError)
    await expect(ui.takePicture('jpeg')).rejects.toBeInstanceOf(IncompatibleVersionError)
    global.ZenMoney = { ...model.host, applicationState: 'unexpected' } as unknown as typeof ZenMoney
    expect(() => ui.visibilityState).toThrow('Unsupported application state')
    expect(() => ui.on('visibilitychange', jest.fn())).not.toThrow()
  })
})
