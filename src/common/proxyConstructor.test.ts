import { Socket, WebSocket } from './network'
import { IncompatibleVersionError } from '../errors'

// [model] Importing HTTP helpers must not require native constructors to exist.
describe('[model] host constructor proxies', () => {
  const originalZenMoney = global.ZenMoney

  afterEach(() => {
    global.ZenMoney = originalZenMoney
  })

  it('checks unavailable capabilities only when constructing', () => {
    global.ZenMoney = {} as unknown as typeof ZenMoney
    expect(() => new Socket()).toThrow(IncompatibleVersionError)
    expect(() => new WebSocket('wss://example.test')).toThrow(IncompatibleVersionError)
  })

  it('forwards Socket options and preserves native identity and subclasses', () => {
    const construct = jest.fn()
    class NativeSocket {
      readonly connecting = false
      constructor (options: unknown) { construct(options) }
    }
    global.ZenMoney = { Socket: NativeSocket } as unknown as typeof ZenMoney
    const options = Object.freeze({ allowHalfOpen: true, keepAlive: true, noDelay: true })
    const socket = new Socket(options)
    expect(construct).toHaveBeenCalledWith(options)
    expect(construct.mock.calls[0][0]).toBe(options)
    expect(socket).toBeInstanceOf(NativeSocket)
    expect(socket).toBeInstanceOf(Socket)
    class PluginSocket extends Socket {}
    expect(new PluginSocket()).toBeInstanceOf(PluginSocket)
    expect(Reflect.get(ZenMoney, 'Socket')).toBe(NativeSocket)
  })

  it('preserves WebSocket protocols, native extensions, constants and failures', () => {
    const construct = jest.fn()
    class NativeWebSocket {
      static readonly OPEN = 1
      readonly readyState = 0
      readonly once = jest.fn(() => this)
      constructor (...args: unknown[]) { construct(...args) }
    }
    global.ZenMoney = { WebSocket: NativeWebSocket } as unknown as typeof ZenMoney
    const options = Object.freeze({ headers: { authorization: 'model-token' } })
    const protocols = ['model-protocol']
    const socket = new WebSocket('wss://example.test', protocols, options)
    expect(construct).toHaveBeenCalledWith('wss://example.test', protocols, options)
    expect(socket).toBeInstanceOf(NativeWebSocket)
    expect(socket).toBeInstanceOf(WebSocket)
    expect(WebSocket.OPEN).toBe(1)
    expect(Reflect.get(ZenMoney, 'WebSocket')).toBe(NativeWebSocket)
    const error = new Error('Model native constructor failure')
    construct.mockImplementationOnce(() => { throw error })
    expect(() => new WebSocket('wss://example.test')).toThrow(error)
  })
})
