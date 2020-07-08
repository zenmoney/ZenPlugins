import { isDebug } from './common/utils'
import * as consoleAdapter from './consoleAdapter'

global.Promise = require('promise/lib/es6-extensions.js')
global.Symbol = require('es6-symbol')

delete global.Blob
delete global.FormData
require('./polyfills/blob')
require('./polyfills/formData')
ZenMoney.Blob = global.Blob
ZenMoney.FormData = global.FormData
delete global.fetch
// eslint-disable-next-line import/no-webpack-loader-syntax
global.fetch = require('imports-loader?self=>global&{default:XMLHttpRequest}=xhrViaZenApi&Blob=>ZenMoney.Blob&FormData=>ZenMoney.FormData!exports-loader?self.fetch!whatwg-fetch')
delete global.Blob
delete global.FormData

if (!('self' in global)) {
  global.self = global
}

Object.assign = require('object-assign')
require('./polyfills/array')
require('./polyfills/math')

if (!('device' in ZenMoney)) {
  ZenMoney.device = {
    id: 'PKQ1.180917.001',
    manufacturer: 'Zenmoney',
    model: 'Sync',
    brand: 'zenmoney',
    os: {
      name: 'android',
      version: '9'
    }
  }
}

if (isDebug() && consoleAdapter.isNativeConsoleImplemented()) {
  consoleAdapter.shapeNativeConsole()
} else {
  consoleAdapter.install()
}

if (!('isAccountSkipped' in ZenMoney)) {
  ZenMoney.isAccountSkipped = (accountId) => false
}

if (!('features' in ZenMoney)) {
  ZenMoney.features = {}
}

if (!('readLine' in ZenMoney)) {
  ZenMoney.readLine = async (message, options = {}) => {
    if (typeof message !== 'string') {
      throw new Error('message must be string')
    }
    const { imageUrl = null, ...rest } = options
    return ZenMoney.retrieveCode(message, imageUrl, rest)
  }
}
if (!('clearCookies' in ZenMoney)) {
  ZenMoney.clearCookies = async () => {
    const cookies = await ZenMoney.getCookies()
    if (cookies) {
      for (const cookie of cookies) {
        await ZenMoney.setCookie(isDebug() ? 'localhost' : cookie.domain, cookie.name, null)
      }
    }
  }
}
