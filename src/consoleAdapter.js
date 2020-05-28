const util = require('util')

export const formatWithCustomInspectParams = function (...args) {
  const transformedArgs = args.map(value => {
    if (typeof value !== 'object') {
      return value
    }
    return {
      [util.inspect.custom || 'inspect'] (recurseTimes, ctx) {
        return util.inspect(value, {
          ...ctx,
          showHidden: true,
          depth: null,
          maxArrayLength: null
        })
      }
    }
  })
  return util.format(...transformedArgs)
}

const consoleAdapter = {
  assert (condition, ...args) {
    if (!condition) {
      const details = formatWithCustomInspectParams(...args) || 'console.assert'
      throw new Error('Assertion failed: ' + details)
    }
  },

  dir (obj, options) {
    ZenMoney.trace(util.inspect(obj, { customInspect: false, ...options }), 'dir')
  }
}

for (const methodName of ['log', 'warn', 'info', 'error', 'debug']) {
  consoleAdapter[methodName] = function () {
    ZenMoney.trace(formatWithCustomInspectParams(...arguments), methodName)
  }
}

const labelTimes = {}

consoleAdapter.time = function (label) {
  labelTimes[label] = Date.now()
}

consoleAdapter.timeEnd = function (label) {
  const labelTime = labelTimes[label]
  if (labelTime === undefined) {
    consoleAdapter.warn(`No such label '${label}' for console.timeEnd()`)
  } else {
    delete labelTimes[label]
    ZenMoney.trace(`${label}: ${((Date.now() - labelTime) / 1000).toFixed(3)}ms`, 'time')
  }
}

export const nativeConsole = global.console

export const isNativeConsoleImplemented = () => {
  const adapterKeys = Object.keys(consoleAdapter)
  return nativeConsole && adapterKeys.every((key) => typeof nativeConsole[key] === 'function')
}

export const install = () => {
  global.console = consoleAdapter
}

export const shapeNativeConsole = () => {
  for (const key of Object.keys(nativeConsole).filter(key => !(key in consoleAdapter))) {
    delete nativeConsole[key]
  }
  nativeConsole.assert = consoleAdapter.assert
}
