import { IncompatibleVersionError } from '../errors'
import { proxyMethod } from './proxy'

// [model] Host lookup preserves receivers, arguments, synchronous results, promises and failures.
describe('[model] host method proxies', () => {
  const originalHost = global.ZenMoney

  afterEach(() => { global.ZenMoney = originalHost })

  it('allows imports without a host and checks capabilities when resolving a method', () => {
    Reflect.deleteProperty(global, 'ZenMoney')
    jest.isolateModules(() => {
      expect(() => jest.requireActual('./proxy')).not.toThrow()
    })
    expect(() => proxyMethod('saveData')).toThrow(IncompatibleVersionError)
  })

  it.each([undefined, null, false, 1, {}])('rejects a missing or non-callable capability: %p', saveData => {
    expect(() => proxyMethod('saveData', { saveData })).toThrow(IncompatibleVersionError)
  })

  it('forwards arguments and returns the original synchronous result with the host receiver', () => {
    const input = Object.freeze({ value: 'model input' })
    const result = { value: 'model result' }
    const host = {
      read: jest.fn(function (this: unknown, _input: typeof input, _flag: boolean) {
        expect(this).toBe(host)
        return result
      })
    }
    const read = proxyMethod<(value: typeof input, flag: boolean) => typeof result>('read', host)
    expect(read(input, false)).toBe(result)
    expect(host.read.mock.calls).toEqual([[input, false]])
    expect(host.read.mock.calls[0][0]).toBe(input)
  })

  it('looks up the current host and method while retaining an explicitly captured receiver', () => {
    const first = { value: 1, read () { return this.value } }
    const second = { value: 2, read () { return this.value } }
    global.ZenMoney = first as unknown as typeof ZenMoney
    const captured = proxyMethod<() => number>('read', first)
    expect(proxyMethod<() => number>('read')()).toBe(1)
    global.ZenMoney = second as unknown as typeof ZenMoney
    expect(proxyMethod<() => number>('read')()).toBe(2)
    expect(captured()).toBe(1)
    second.read = function () { return this.value + 10 }
    expect(proxyMethod<() => number>('read')()).toBe(12)
  })

  it('returns the original promise without adding an asynchronous boundary', async () => {
    const result = { value: 'model result' }
    const promise = Promise.resolve(result)
    const read = proxyMethod<() => Promise<typeof result>>('read', { read: jest.fn().mockReturnValue(promise) })
    expect(read()).toBe(promise)
    await expect(promise).resolves.toBe(result)
  })

  it('preserves synchronous exceptions and rejected promises', async () => {
    const failure = new Error('Model host failure')
    const fail = proxyMethod<() => never>('fail', { fail: () => { throw failure } })
    let caught: unknown
    try {
      fail()
    } catch (error) {
      caught = error
    }
    expect(caught).toBe(failure)
    const rejection = Promise.reject(failure)
    const reject = proxyMethod<() => Promise<never>>('fail', { fail: jest.fn().mockReturnValue(rejection) })
    expect(reject()).toBe(rejection)
    await expect(rejection).rejects.toBe(failure)
  })
})
