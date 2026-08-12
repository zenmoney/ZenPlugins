export function installApiCapture ({ transport }) {
  let setResultCalled = false
  const wrap = (name, handler) => {
    if (typeof ZenMoney[name] !== 'function') {
      return null
    }
    const original = ZenMoney[name].bind(ZenMoney)
    ZenMoney[name] = function () {
      return handler(original, Array.from(arguments))
    }
    return original
  }

  wrap('addAccount', (original, args) => {
    const value = args[0]
    transport.enqueue('accounts:add', { items: Array.isArray(value) ? value : [value] })
    return original(...args)
  })

  wrap('addTransaction', (original, args) => {
    const value = args[0]
    transport.enqueue('transactions:add', { items: Array.isArray(value) ? value : [value] })
    return original(...args)
  })

  wrap('getData', (original, args) => {
    const value = original(...args)
    transport.enqueue('state:get', { key: args[0], value })
    return value
  })

  wrap('setData', (original, args) => {
    transport.enqueue('state:set', { key: args[0], value: args[1] })
    return original(...args)
  })

  wrap('clearData', (original, args) => {
    transport.enqueue('state:clear', {})
    return original(...args)
  })

  wrap('saveData', (original, args) => {
    transport.enqueue('state:save', {})
    return original(...args)
  })

  const originalSetResult = wrap('setResult', (original, args) => {
    setResultCalled = true
    const result = args[0]
    if (result?.account) {
      transport.enqueue('accounts:add', { items: Array.isArray(result.account) ? result.account : [result.account] })
    }
    if (result?.transaction) {
      transport.enqueue('transactions:add', { items: Array.isArray(result.transaction) ? result.transaction : [result.transaction] })
    }
    if (result && result.success === false) {
      transport.enqueue('error', {
        name: result.name || 'PluginError',
        message: result.message || 'Plugin returned an unsuccessful result',
        stack: result.stack || null,
        unhandled: false,
        details: result
      })
    }
    transport.enqueue('session:result', result)
    transport.flush().then(
      () => original(...args),
      () => original(...args)
    )
  })

  return {
    originalSetResult,
    hasSetResultBeenCalled: () => setResultCalled
  }
}
