import { convertHeadersToPlainObject } from './logging'
import { EventEmitter } from 'events'
import { WebSocketRequestClient } from './webSocketRequestClient'
import type { WebSocketInstance, WebSocketResponse } from './webSocket'

const response: WebSocketResponse = {
  url: 'wss://example.test',
  protocol: 'wss',
  status: 101,
  statusText: 'Switching Protocols',
  headers: convertHeadersToPlainObject({ 'set-cookie': 'model-session', 'x-request-id': 'upgrade-1' }),
  body: null
}

// [model] The native transport delivers responses independently of request order.
describe('[model] WebSocket request client', () => {
  const originalZenMoney = global.ZenMoney
  const state: { socket?: NativeWebSocket } = {}
  const currentSocket = (): NativeWebSocket => {
    assert(state.socket !== undefined, 'Model WebSocket was not constructed')
    return state.socket
  }
  let debug: jest.SpyInstance

  class NativeWebSocket extends EventEmitter {
    static readonly OPEN = 1
    static readonly CLOSED = 3
    readyState = 0
    onopen: WebSocketInstance['onopen'] = null
    onclose: WebSocketInstance['onclose'] = null
    onerror: WebSocketInstance['onerror'] = null
    onmessage: WebSocketInstance['onmessage'] = null
    readonly send = jest.fn()
    readonly close = jest.fn(() => {
      this.readyState = 3
      this.onclose?.call(this as unknown as WebSocketInstance, { type: 'close', code: 1000, reason: '', wasClean: true })
    })

    constructor () { super(); Object.assign(state, { socket: this }) }

    open (): void {
      this.readyState = 1
      this.emit('open', { type: 'open', response })
      this.onopen?.call(this as unknown as WebSocketInstance, { type: 'open', response })
    }

    receive (body: unknown): void {
      this.onmessage?.call(this as unknown as WebSocketInstance, { type: 'message', data: JSON.stringify(body) })
    }

    fail (): void {
      if (this.listenerCount('error') > 0) this.emit('error', { type: 'error', message: 'Model network failure', response: null })
      this.onerror?.call(this as unknown as WebSocketInstance, { type: 'error', message: 'Model network failure', response: null })
      this.readyState = 3
      this.onclose?.call(this as unknown as WebSocketInstance, { type: 'close', code: 1006, reason: '', wasClean: false })
    }
  }

  beforeEach(() => {
    global.ZenMoney = { WebSocket: NativeWebSocket } as unknown as typeof ZenMoney
    debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    global.ZenMoney = originalZenMoney
    jest.restoreAllMocks()
  })

  it('matches concurrent responses by ID and delivers unsolicited messages', async () => {
    const client = new WebSocketRequestClient()
    const opening = client.open(response.url, { log: false })
    currentSocket().open()
    await expect(opening).resolves.toBe(response)
    client.getResponseId = body => (body as { requestId?: string }).requestId
    client.onUnexpectedMessage = jest.fn()
    const first = client.request('first', { body: { requestId: 'first' }, log: false })
    const second = client.request('second', { body: { requestId: 'second' }, log: false })
    expect(currentSocket().send.mock.calls).toEqual([['{"requestId":"first"}'], ['{"requestId":"second"}']])
    currentSocket().receive({ requestId: 'second', value: 2 })
    currentSocket().receive({ requestId: 'first', value: 1 })
    currentSocket().receive({ notification: 'model-update' })
    await expect(first).resolves.toEqual({ body: { requestId: 'first', value: 1 } })
    await expect(second).resolves.toEqual({ body: { requestId: 'second', value: 2 } })
    expect(client.onUnexpectedMessage).toHaveBeenCalledWith({ notification: 'model-update' })
    expect(debug).not.toHaveBeenCalled()
    await client.close()
    expect(currentSocket().close).toHaveBeenCalledTimes(1)
  })

  it('rejects opening and every pending request when the transport fails', async () => {
    const client = new WebSocketRequestClient()
    const opening = client.open(response.url, { log: false })
    currentSocket().fail()
    await expect(opening).rejects.toEqual(new Error('Model network failure'))
    await client.close()
    const reopened = client.open(response.url, { log: false })
    currentSocket().open()
    await reopened
    const first = client.request('one', { body: { id: 'one' }, log: false })
    const second = client.request('two', { body: { id: 'two' }, log: false })
    currentSocket().fail()
    await expect(first).rejects.toEqual(new Error('Model network failure'))
    await expect(second).rejects.toEqual(new Error('Model network failure'))
  })

  it('matches numeric response IDs to the corresponding request key', async () => {
    const client = new WebSocketRequestClient()
    const opening = client.open(response.url, { log: false })
    currentSocket().open()
    await opening
    const request = client.request('42', { body: { id: 42 }, log: false })
    currentSocket().receive({ id: 42, value: 'complete' })
    await expect(request).resolves.toEqual({ body: { id: 42, value: 'complete' } })
    await client.close()
  })

  it('preserves masks for upgrade, request and response logs and leaves payloads intact', async () => {
    const client = new WebSocketRequestClient()
    const opening = client.open(response.url, {
      headers: { authorization: 'model-token' },
      sanitizeRequestLog: { headers: { authorization: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } }
    })
    currentSocket().open()
    await opening
    const request = client.request('trace-1', {
      body: { id: 'trace-1', token: 'model-token' },
      sanitizeRequestLog: { body: { token: true } },
      sanitizeResponseLog: { body: { session: true } }
    })
    currentSocket().receive({ id: 'trace-1', session: 'model-session', amount: 42 })
    await expect(request).resolves.toEqual({ body: { id: 'trace-1', session: 'model-session', amount: 42 } })
    expect(currentSocket().send).toHaveBeenCalledWith('{"id":"trace-1","token":"model-token"}')
    const output = JSON.stringify(debug.mock.calls)
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response', 'request', 'response'])
    expect(output).not.toContain('model-token')
    expect(output).not.toContain('model-session')
    expect(output).toContain('trace-1')
    expect(output).toContain('upgrade-1')
    expect(output).toContain('42')
    await client.close()
  })
})
