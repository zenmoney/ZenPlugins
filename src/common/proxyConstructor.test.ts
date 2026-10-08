import { Socket } from './network'
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
})
