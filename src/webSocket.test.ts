import { WebSocket } from './common/network/webSocket'
import type { WebSocketConstructor, WebSocketInstance, WebSocketMessageEvent } from './common/network/webSocket'

const BrowserWebSocket = jest.requireActual<{ default: WebSocketConstructor }>('./webSocket').default

// [model] The browser harness bridges DOM events while preserving the shared emitter contract.
describe('[model] browser WebSocket handshake logging', () => {
  const originals = new Map(['WebSocket', 'XMLHttpRequest', 'location', 'ZenMoney'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  let debug: jest.SpyInstance
  const state: { transport?: BrowserTransport } = {}
  let upgradeStatus: number
  let proxyOptions: unknown
  const construct = jest.fn()

  class BrowserTransport extends EventTarget {
    binaryType = ''
    readyState = 0
    bufferedAmount = 0
    protocol = 'model-protocol'
    extensions = ''
    readonly send = jest.fn()
    readonly close = jest.fn()
    constructor (...args: unknown[]) { super(); construct(...args); Object.assign(state, { transport: this }) }
  }

  function dispatch (name: string, fields: object = {}): void {
    if (state.transport !== undefined) {
      if (name === 'open') state.transport.readyState = 1
      if (name === 'close') state.transport.readyState = 3
    }
    state.transport?.dispatchEvent(Object.assign(new Event(name), fields))
  }

  class ProxyRequest {
    status = 200
    responseText = ''
    private method = ''
    open (method: string): void { this.method = method }
    setRequestHeader (): void {}
    getAllResponseHeaders (): string { return '' }
    send (body?: string): void {
      if (this.method === 'POST' && body !== undefined) proxyOptions = JSON.parse(body)
      this.status = this.method === 'POST' ? 200 : upgradeStatus
      this.responseText = JSON.stringify(this.method === 'POST'
        ? { id: 'model-socket' }
        : upgradeStatus === 200
          ? { url: 'wss://example.test', status: 101, statusText: 'Switching Protocols', protocol: 'HTTP/1.1', headers: { 'set-cookie': 'model-secret' }, body: null }
          : { message: 'Model proxy failure' })
    }
  }

  beforeEach(() => {
    state.transport = undefined
    upgradeStatus = 200
    proxyOptions = undefined
    construct.mockClear()
    Reflect.set(globalThis, 'WebSocket', BrowserTransport)
    Reflect.set(globalThis, 'XMLHttpRequest', ProxyRequest)
    Reflect.set(globalThis, 'location', { host: 'localhost' })
    Reflect.set(globalThis, 'ZenMoney', { WebSocket: BrowserWebSocket })
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor !== undefined) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
    jest.restoreAllMocks()
  })

  it('logs the proxy response once and preserves property callbacks', () => {
    const socket = new WebSocket('wss://example.test', null, { sanitizeResponseLog: { headers: { 'set-cookie': true } } })
    expect(construct).toHaveBeenCalledWith(expect.stringContaining('ws://localhost/'), [])
    const once = jest.fn()
    const handler = jest.fn()
    expect(socket.once('open', once)).toBe(socket)
    socket.onopen = handler
    dispatch('open')
    dispatch('open')
    expect(once).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.instances[0]).toBe(socket)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-secret')
  })

  it('logs a proxy failure and delivers it to the caller', () => {
    upgradeStatus = 502
    const socket = new WebSocket('wss://example.test')
    const handler = jest.fn()
    socket.onerror = handler
    dispatch('error', { message: 'Model transport failure' })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(debug.mock.calls[1][1]).toMatchObject({ error: 'Model transport failure' })
  })

  it.each(['open', 'message', 'error', 'close'] as const)('registers on%s in the same listener queue as subscriptions', eventName => {
    const socket = new BrowserWebSocket('wss://example.test')
    const calls: string[] = []
    const property = `on${eventName}` as const
    expect(socket[property]).toBeNull()
    const first = jest.fn(function (this: unknown) {
      expect(this).toBe(socket)
      calls.push('property')
    })
    socket[property] = first
    socket.on(eventName, () => { calls.push('listener') })
    expect(socket.listenerCount(eventName)).toBe(2)
    expect(Reflect.apply(socket.emit, socket, [eventName, { type: eventName }])).toBe(true)
    expect(calls).toEqual(['property', 'listener'])
    calls.length = 0
    socket[property] = () => { calls.push('replacement') }
    Reflect.apply(socket.emit, socket, [eventName, { type: eventName }])
    expect(calls).toEqual(['listener', 'replacement'])
    expect(first).toHaveBeenCalledTimes(1)
    // Native on* setters remove the previous handler even for invalid assignments.
    Reflect.set(socket, property, 'not a callback')
    expect(socket[property]).toBeNull()
    expect(socket.listenerCount(eventName)).toBe(1)
  })

  it('uses the registered handler snapshot when an earlier listener changes onmessage', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const original = jest.fn()
    const replacement = jest.fn()
    socket.once('message', () => { socket.onmessage = replacement })
    socket.onmessage = original
    dispatch('message', { data: 'first' })
    expect(original).toHaveBeenCalledTimes(1)
    expect(replacement).not.toHaveBeenCalled()
    dispatch('message', { data: 'second' })
    expect(replacement).toHaveBeenCalledTimes(1)
  })

  it('supports native legacy subscription aliases and their deduplication', () => {
    const socket = new BrowserWebSocket('wss://example.test') as WebSocketInstance & {
      addEventListener: WebSocketInstance['on']
      removeEventListener: WebSocketInstance['off']
    }
    const listener = jest.fn()
    expect(socket.addEventListener('message', listener)).toBe(socket)
    socket.addEventListener('message', listener)
    expect(socket.listenerCount('message')).toBe(1)
    socket.on('message', listener)
    expect(socket.listenerCount('message')).toBe(2)
    expect(socket.removeEventListener('message', listener)).toBe(socket)
    socket.emit('message', { type: 'message', data: 'model' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('exposes native binary payloads and immutable binaryType without bufferedAmount', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const listener = jest.fn()
    socket.onmessage = listener
    dispatch('message', { data: new Uint8Array([1, 2]).buffer })
    expect(listener.mock.calls[0][0].data).toEqual(new Uint8Array([1, 2]))
    expect(socket.binaryType).toBe('uint8array')
    expect(Reflect.set(socket, 'binaryType', 'arraybuffer')).toBe(false)
    expect('bufferedAmount' in socket).toBe(false)
  })

  it('exposes Headers on raw host handshake events before the shared logging wrapper', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const listener = jest.fn()
    socket.onopen = listener
    dispatch('open')
    expect(listener.mock.calls[0][0].response.headers).toBeInstanceOf(Headers)
    expect(listener.mock.calls[0][0].response.headers.get('SET-COOKIE')).toBe('model-secret')
  })

  it('enforces native send states and payload types', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    expect(() => socket.send('before opening')).toThrow(expect.objectContaining({ name: 'InvalidStateError' }))
    dispatch('open')
    const bytes = new Uint8Array([1, 2])
    socket.send(bytes)
    expect(state.transport?.send).toHaveBeenCalledWith(bytes)
    expect(() => Reflect.apply(socket.send, socket, [bytes.buffer])).toThrow()
    dispatch('close')
    socket.send('after closure')
    expect(state.transport?.send).toHaveBeenCalledTimes(1)
  })

  it('normalizes native URL aliases and validates protocols before opening the proxy connection', () => {
    const socket = new BrowserWebSocket('https://example.test/socket', 'model-protocol')
    expect(socket.url).toBe('wss://example.test/socket')
    expect(construct).toHaveBeenCalledWith(expect.any(String), ['model-protocol'])
    construct.mockClear()
    for (const url of ['relative', 'ftp://example.test', 'wss://example.test/#fragment']) {
      expect(() => new BrowserWebSocket(url)).toThrow(expect.objectContaining({ name: 'SyntaxError' }))
    }
    for (const protocols of [['duplicate', 'duplicate'], ['invalid protocol']]) {
      expect(() => new BrowserWebSocket('wss://example.test', protocols)).toThrow(expect.objectContaining({ name: 'SyntaxError' }))
    }
    expect(construct).not.toHaveBeenCalled()
  })

  it.each([
    { Authorization: 'model-token', 'X-Trace': 'trace-7' },
    [['Authorization', 'model-token'], ['X-Trace', 'trace-7']],
    new Headers({ Authorization: 'model-token', 'X-Trace': 'trace-7' })
  ] as HeadersInit[])('forwards header initialization %p to the browser proxy', headers => {
    void new BrowserWebSocket('wss://example.test', null, { headers })
    expect(proxyOptions).toEqual({ url: 'wss://example.test', headers: { authorization: 'model-token', 'x-trace': 'trace-7' } })
  })
  it('keeps repeated listeners, removes the most recent match and counts registrations', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const calls: string[] = []
    const first = jest.fn(function (this: unknown, value: unknown) {
      expect(this).toBe(globalThis)
      expect(value).toBe('model-data')
      calls.push('first')
    })
    const second = jest.fn(() => { calls.push('second') })
    expect(socket.on('custom', first)).toBe(socket)
    socket.on('custom', second).on('custom', first)
    expect(socket.listenerCount('custom')).toBe(3)
    expect(socket.listenerCount('custom', first)).toBe(2)
    expect(socket.off('custom', first)).toBe(socket)
    expect(socket.listenerCount('custom', first)).toBe(1)
    expect(socket.emit('custom', 'model-data')).toBe(true)
    expect(calls).toEqual(['first', 'second'])
    socket.off('custom', second).off('custom', first)
    expect(socket.listenerCount('custom')).toBe(0)
    expect(socket.emit('custom', 'model-data')).toBe(false)
    expect(socket.off('missing', first)).toBe(socket)
  })

  it('removes once listeners by their original function and mixes on with once in order', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const calls: string[] = []
    const listener = (): void => { calls.push('listener') }
    socket.on('custom', listener).once('custom', listener)
    expect(socket.listenerCount('custom', listener)).toBe(2)
    socket.off('custom', listener)
    socket.once('custom', () => { calls.push('once') })
    socket.on('custom', () => { calls.push('last') })
    socket.emit('custom')
    socket.emit('custom')
    expect(calls).toEqual(['listener', 'once', 'last', 'listener', 'last'])
    expect(socket.listenerCount('custom')).toBe(2)
  })

  it('removes once listeners before calling them and does not repeat them during nested dispatch', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    let nested = false
    socket.on('custom', () => {
      if (!nested) { nested = true; socket.emit('custom') }
    })
    const once = jest.fn(() => {
      expect(socket.listenerCount('custom', once)).toBe(0)
      socket.emit('custom')
    })
    socket.once('custom', once)
    socket.emit('custom')
    expect(once).toHaveBeenCalledTimes(1)
  })

  it('uses a listener snapshot and applies additions and removals to later dispatches', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const calls: string[] = []
    const later = (): void => { calls.push('later') }
    const removed = (): void => { calls.push('removed') }
    socket.once('custom', () => {
      calls.push('first')
      socket.off('custom', removed).on('custom', later)
    })
    socket.on('custom', removed)
    socket.emit('custom')
    socket.emit('custom')
    expect(calls).toEqual(['first', 'removed', 'later'])
  })

  it('propagates listener errors, removes a throwing once listener and ignores unhandled error events', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const error = new Error('Model listener failed')
    const later = jest.fn()
    socket.once('custom', () => { throw error }).on('custom', later)
    expect(() => socket.emit('custom')).toThrow(error)
    expect(later).not.toHaveBeenCalled()
    expect(socket.listenerCount('custom')).toBe(1)
    expect(socket.emit('custom')).toBe(true)
    expect(later).toHaveBeenCalledTimes(1)
    expect(socket.emit('error', { type: 'error', message: 'Model error', response: null })).toBe(false)
  })

  it.each(['on', 'once', 'off'] as const)('rejects non-function listeners in %s', method => {
    const socket = new BrowserWebSocket('wss://example.test')
    expect(() => socket[method]('custom', null as unknown as () => void)).toThrow(TypeError)
  })

  it('bridges message and close events to subscriptions and property handlers', () => {
    const socket = new WebSocket('wss://example.test', null, { log: false })
    const order: string[] = []
    const listener = jest.fn(function (this: unknown, event: WebSocketMessageEvent) {
      expect(this).toBe(globalThis)
      expect(event.type).toBe('message')
      order.push('on')
    })
    const once = jest.fn(() => { order.push('once') })
    const handler = jest.fn(function (this: unknown) {
      expect(this).toBe(socket)
      order.push('property')
    })
    const close = jest.fn()
    socket.on('message', listener).once('message', once).on('close', close)
    socket.onmessage = handler
    const binary = new Uint8Array([1, 2]).buffer
    dispatch('message', { data: binary })
    dispatch('message', { data: 'model-text' })
    expect(order).toEqual(['on', 'once', 'property', 'on', 'property'])
    expect(listener.mock.calls[0][0].data).toEqual(new Uint8Array(binary))
    expect(listener.mock.calls[1][0].data).toBe('model-text')
    socket.off('message', listener)
    socket.onmessage = null
    dispatch('message', { data: 'after removal' })
    expect(listener).toHaveBeenCalledTimes(2)
    expect(socket.binaryType).toBe('uint8array')
    dispatch('open')
    socket.send('model-payload')
    socket.close(1000, 'Model close')
    dispatch('close', { code: 1000, reason: 'Model close', wasClean: true })
    expect(close).toHaveBeenCalledWith({ target: socket, type: 'close', code: 1000, reason: 'Model close', wasClean: true })
    expect(state.transport?.send).toHaveBeenCalledWith('model-payload')
    expect(state.transport?.close).toHaveBeenCalledWith(1000, 'Model close')
  })

  it('does not await listener promises', () => {
    const socket = new BrowserWebSocket('wss://example.test')
    const pending = new Promise<void>(() => {})
    const later = jest.fn()
    socket.on('custom', jest.fn().mockReturnValue(pending)).on('custom', later)
    expect(socket.emit('custom')).toBe(true)
    expect(later).toHaveBeenCalledTimes(1)
  })
})
