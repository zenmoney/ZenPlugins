import { convertHeadersToPlainObject } from './logging'
import { EventEmitter } from 'events'
import { WebSocket } from './webSocket'
import type { WebSocketInstance, WebSocketResponse } from './webSocket'
import { IncompatibleVersionError } from '../../errors'

// [model] The host emits handshake events independently of the on* properties.
describe('[model] WebSocket handshake logging', () => {
  const originalZenMoney = global.ZenMoney
  const url = 'wss://example.test/socket?token=model-token&requestId=trace-7'
  const response: WebSocketResponse = {
    url,
    status: 101,
    statusText: 'Switching Protocols',
    protocol: 'wss',
    headers: convertHeadersToPlainObject({ 'Set-Cookie': 'sid=model-session', 'X-Request-ID': 'trace-7' }),
    body: { session: 'model-session', diagnostic: 'upgrade-ok' }
  }
  const requestMask = { url: { query: { token: true } }, headers: { authorization: true } }
  const responseMask = { url: { query: { token: true } }, headers: { 'set-cookie': true }, body: { session: true } }
  const construct = jest.fn()
  let debug: jest.SpyInstance

  class NativeWebSocket extends EventEmitter {
    onopen: WebSocketInstance['onopen'] = null
    onerror: WebSocketInstance['onerror'] = null
    constructor (...args: unknown[]) { super(); construct(...args) }
    open (): void {
      const event = { type: 'open' as const, response }
      this.emit('open', event)
      this.onopen?.call(this as unknown as WebSocketInstance, event)
    }

    fail (withResponse = true): void {
      const event = { type: 'error' as const, message: 'Model connection failed', response: withResponse ? { ...response, status: 403 } : null }
      if (this.listenerCount('error') > 0) this.emit('error', event)
      this.onerror?.call(this as unknown as WebSocketInstance, event)
      this.emit('close', { type: 'close', code: 1006, reason: '', wasClean: false })
    }
  }

  beforeEach(() => {
    construct.mockReset()
    global.ZenMoney = { WebSocket: NativeWebSocket } as unknown as typeof ZenMoney
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    global.ZenMoney = originalZenMoney
    jest.restoreAllMocks()
  })

  it.each([true, false])('rejects hosts without once and closes the unused socket (logging: %p)', log => {
    const close = jest.fn()
    class LegacyWebSocket {
      readonly close = close
    }
    global.ZenMoney = { WebSocket: LegacyWebSocket } as unknown as typeof ZenMoney
    expect(() => new WebSocket(url, null, { log, sanitizeRequestLog: requestMask })).toThrow(IncompatibleVersionError)
    expect(close).toHaveBeenCalledTimes(1)
    expect(debug.mock.calls.map(call => call[0])).toEqual(log ? ['request', 'response'] : [])
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-token')
  })

  it('logs one masked request and response without changing native options or user handlers', () => {
    const headers = Object.freeze({ Authorization: 'model-token', AUTHORIZATION: 'other-token', xTraceId: '  trace-7  ', XTraceId: 'trace-8' })
    const tls = Object.freeze({ ca: 'model-ca' })
    const options = Object.freeze({ headers, tls, sanitizeRequestLog: requestMask, sanitizeResponseLog: responseMask })
    const socket = new WebSocket(url, ['model-protocol'], options)
    const oldHandler = jest.fn()
    const handler = jest.fn()
    socket.onopen = oldHandler
    socket.onopen = handler
    const native = socket as unknown as NativeWebSocket
    native.open()
    expect(construct).toHaveBeenCalledWith(url, ['model-protocol'], { headers, tls })
    expect(debug.mock.calls[0][1].headers).toEqual({ Authorization: '<string[11]>', AUTHORIZATION: '<string[11]>', xTraceId: '  trace-7  ', XTraceId: 'trace-8' })
    expect(socket.onopen).toBe(handler)
    expect(oldHandler).not.toHaveBeenCalled()
    expect(handler).toHaveBeenCalledWith({ type: 'open', response })
    expect(handler.mock.instances[0]).toBe(socket)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(debug.mock.calls[1][1]).toMatchObject({ id: debug.mock.calls[0][1].id, status: 101, ms: expect.any(Number) })
    const output = JSON.stringify(debug.mock.calls)
    expect(output).not.toContain('model-token')
    expect(output).not.toContain('model-session')
    expect(output).toContain('trace-7')
    expect(output).toContain('upgrade-ok')
    expect(response.headers.get('set-cookie')).toBe('sid=model-session')
    native.fail()
    expect(debug).toHaveBeenCalledTimes(2)
  })

  it.each([true, false])('logs a failed handshake once, with an HTTP response: %p', withResponse => {
    const socket = new WebSocket(url, null, { sanitizeRequestLog: requestMask, sanitizeResponseLog: responseMask })
    const handler = jest.fn()
    socket.onerror = handler
    ;(socket as unknown as NativeWebSocket).fail(withResponse)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(debug.mock.calls[1][1]).toMatchObject({ id: debug.mock.calls[0][1].id, error: 'Model connection failed' })
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-token')
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-session')
  })

  it('logs a native constructor failure and rethrows the original error', () => {
    const error = new Error('Model constructor failed')
    construct.mockImplementationOnce(() => { throw error })
    expect(() => new WebSocket(url, null, { sanitizeRequestLog: requestMask })).toThrow(error)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-token')
  })

  it('logs a connection closed before the handshake completes', () => {
    const socket = new WebSocket(url, null, { sanitizeRequestLog: requestMask })
    const native = socket as unknown as NativeWebSocket
    native.emit('close', { type: 'close', code: 1000, reason: 'Model cancellation', wasClean: true })
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response'])
    expect(debug.mock.calls[1][1]).toMatchObject({ error: { code: 1000, reason: 'Model cancellation' } })
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-token')
  })

  it('skips logging and masks when disabled', () => {
    const mask = jest.fn()
    const socket = new WebSocket(url, null, { log: false, sanitizeRequestLog: mask, sanitizeResponseLog: mask })
    ;(socket as unknown as NativeWebSocket).open()
    expect(construct).toHaveBeenCalledWith(url, null, {})
    expect(mask).not.toHaveBeenCalled()
    expect(debug).not.toHaveBeenCalled()
  })

  it.each(['open', 'error'] as const)('normalizes native %s response headers even with logging disabled', eventName => {
    const socket = new WebSocket(url, null, { log: false })
    const listener = jest.fn()
    socket.on(eventName, listener)
    const nativeHeaders = new Headers({ 'X-Trace': 'trace-7' })
    const event = { type: eventName, response: { ...response, headers: nativeHeaders }, message: 'Model failure' }
    ;(socket as unknown as NativeWebSocket).emit(eventName, event)
    const delivered = listener.mock.calls[0][0].response as WebSocketResponse
    expect(delivered.headers).toEqual({ 'x-trace': 'trace-7' })
    expect(delivered.headers.get('X-TRACE')).toBe('trace-7')
    expect(nativeHeaders.get('x-trace')).toBe('trace-7')
    expect(debug).not.toHaveBeenCalled()
  })

  it('propagates mask failures without logging the raw payload', () => {
    const error = new Error('Model mask failed')
    const mask = (): never => { throw error }
    expect(() => new WebSocket(url, null, { sanitizeRequestLog: mask })).toThrow(error)
    expect(construct).not.toHaveBeenCalled()
    expect(debug).not.toHaveBeenCalled()
    const socket = new WebSocket(url, null, { sanitizeRequestLog: requestMask, sanitizeResponseLog: mask })
    expect(() => (socket as unknown as NativeWebSocket).open()).toThrow(error)
    expect(debug).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-token')
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-session')
  })

  // [model] Each connection uses the shared TLS defaults unless it supplies its own TLS options.
  describe('TLS defaults', () => {
    let tls: typeof import('./tls')
    let Socket: typeof WebSocket

    beforeEach(() => {
      Reflect.set(global.ZenMoney, 'fetch', jest.fn())
      jest.resetModules()
      tls = jest.requireActual<typeof import('./tls')>('./tls')
      Socket = jest.requireActual<typeof import('./webSocket')>('./webSocket').WebSocket
    })

    it('snapshots shared CA and client certificates when options are omitted', async () => {
      const pfx = new Uint8Array([1, 2, 3])
      await tls.addTrustedCertificates(['model-first-ca'])
      await tls.setClientPfx(pfx, 'example.test')
      void new Socket('wss://example.test/socket')
      await tls.addTrustedCertificates(['model-second-ca'])
      void new Socket('wss://example.test/socket')
      expect(construct.mock.calls).toEqual([
        ['wss://example.test/socket', undefined, { tls: { ca: ['model-first-ca'], pfx: [pfx] } }],
        ['wss://example.test/socket', undefined, { tls: { ca: ['model-first-ca', 'model-second-ca'], pfx: [pfx] } }]
      ])
      expect(debug.mock.calls).toHaveLength(2)
      for (const [, request] of debug.mock.calls) expect(request).not.toHaveProperty('tls')
    })

    it('inherits defaults without mutating options or forwarding logging controls', async () => {
      await tls.addTrustedCertificates(['model-ca'])
      const headers = Object.freeze({ 'X-Request-ID': 'trace-7' })
      const options = Object.freeze({ headers, tls: undefined, log: false })
      void new Socket('wss://example.test/socket', ['model-protocol'], options)
      expect(construct).toHaveBeenCalledWith('wss://example.test/socket', ['model-protocol'], {
        headers, tls: { ca: ['model-ca'], pfx: [] }
      })
      expect(options).toEqual({ headers, tls: undefined, log: false })
      expect(debug).not.toHaveBeenCalled()
    })

    it.each([{}, { ca: ['model-explicit-ca'] }])('keeps explicit TLS options instead of defaults: %p', async explicitTls => {
      await tls.addTrustedCertificates(['model-default-ca'])
      await tls.setClientPfx(new Uint8Array([1, 2, 3]), 'example.test')
      const options = Object.freeze({ tls: Object.freeze(explicitTls), log: false })
      void new Socket('wss://example.test/socket', null, options)
      expect(construct).toHaveBeenCalledWith('wss://example.test/socket', null, { tls: explicitTls })
      expect(construct.mock.calls[0][2].tls).toBe(explicitTls)
    })

    it('preserves constructor arguments when no defaults are registered', () => {
      void new Socket('wss://example.test/socket')
      expect(construct).toHaveBeenCalledWith('wss://example.test/socket')
    })
  })
})
