import { IncompatibleVersionError } from '../errors'
import get from '../types/get'

/** Resolve at the call site; retain the receiver for callbacks tied to one host. */
export function proxyMethod<Method extends (...args: never[]) => unknown> (
  name: string,
  host: unknown = globalThis.ZenMoney
): Method {
  const method = get(host, name)
  if (typeof method !== 'function') throw new IncompatibleVersionError()
  return method.bind(host) as Method
}

/** Resolve host APIs on use so importing shared helpers also works on older hosts. */
export function proxyConstructor<Constructor extends new (...args: never[]) => object> (
  name: string,
  options: {
    construct?: (target: Constructor, args: unknown[], newTarget: Function) => object
    statics?: Record<string, unknown>
  } = {}
): Constructor {
  const resolve = (): Constructor => {
    const constructor = get(globalThis.ZenMoney, name)
    if (typeof constructor !== 'function') throw new IncompatibleVersionError()
    return constructor as Constructor
  }

  return new Proxy(function () {}, {
    construct (_target, args: unknown[], newTarget) {
      const target = resolve()
      return options.construct !== undefined
        ? options.construct(target, args, newTarget)
        : Reflect.construct(target, args, newTarget) as object
    },
    get (_target, property): unknown {
      return options.statics !== undefined && Object.prototype.hasOwnProperty.call(options.statics, property)
        ? Reflect.get(options.statics, property)
        : Reflect.get(resolve(), property)
    },
    has (_target, property) {
      return (options.statics !== undefined && Object.prototype.hasOwnProperty.call(options.statics, property)) || property in resolve()
    }
  }) as unknown as Constructor
}
