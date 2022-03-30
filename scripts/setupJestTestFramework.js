import { formatWithCustomInspectParams } from '../src/consoleAdapter'
import { InvalidPreferencesError, TemporaryError } from '../src/errors'

console.debug = process.env.DEBUG
  ? function () {
    console.log('[console.debug]', ...arguments)
  }
  : function () {
  }

console.assert = function (condition, ...args) {
  if (!condition) {
    throw new Error(formatWithCustomInspectParams(...args))
  }
}
global.assert = console.assert
global.TemporaryError = TemporaryError
global.InvalidPreferencesError = InvalidPreferencesError
