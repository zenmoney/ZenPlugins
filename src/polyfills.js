import { isDebug } from './common/utils'
import * as consoleAdapter from './consoleAdapter'

global.Promise = require('promise/lib/es6-extensions.js')
global.Symbol = require('es6-symbol')

global.fetch = null
// eslint-disable-next-line import/no-webpack-loader-syntax
global.fetch = require('imports-loader?self=>global&{default:XMLHttpRequest}=xhrViaZenApi!exports-loader?self.fetch!whatwg-fetch')

Object.assign = require('object-assign')
require('./polyfills/array')
require('./polyfills/math')

if (!('application' in ZenMoney)) {
  ZenMoney.application = {
    platform: 'android',
    version: '4.9.9',
    build: '459'
  }
}
if (!('device' in ZenMoney)) {
  ZenMoney.device = {
    id: 'PKQ1.180917.001',
    manufacturer: 'Xiaomi',
    model: 'Mi A1',
    brand: 'xiaomi',
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
