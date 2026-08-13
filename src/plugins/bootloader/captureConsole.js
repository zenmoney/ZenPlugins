const knownMethods = ['assert', 'debug', 'dir', 'error', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'table', 'time', 'timeEnd', 'trace', 'warn']

function levelForMethod (method) {
  return ['debug', 'error', 'info', 'warn'].indexOf(method) >= 0 ? method : 'log'
}

export function installConsoleCapture ({ transport, enabled }) {
  if (!enabled) {
    return { refresh () {} }
  }
  let delegating = false
  const originalTrace = typeof ZenMoney.trace === 'function' ? ZenMoney.trace.bind(ZenMoney) : null
  if (originalTrace) {
    ZenMoney.trace = function (message, caller) {
      if (!delegating) {
        transport.enqueue('console', {
          level: levelForMethod(caller),
          method: caller || 'trace',
          args: [message]
        })
      }
      return originalTrace.apply(this, arguments)
    }
  }

  const refresh = () => {
    const original = global.console || {}
    if (original.__bootloaderV2Console) {
      return
    }
    const wrapper = {}
    const methods = Array.from(new Set(knownMethods.concat(Object.keys(original))))
    for (const method of methods) {
      if (typeof original[method] !== 'function') {
        continue
      }
      wrapper[method] = function () {
        const args = Array.from(arguments)
        if (method !== 'assert' || !args[0]) {
          transport.enqueue('console', {
            level: levelForMethod(method),
            method,
            args: method === 'assert' ? args.slice(1) : args
          })
        }
        delegating = true
        try {
          return original[method].apply(original, args)
        } finally {
          delegating = false
        }
      }
    }
    Object.defineProperty(wrapper, '__bootloaderV2Console', { value: true })
    global.console = wrapper
    global.assert = wrapper.assert
  }

  refresh()
  return { refresh }
}
