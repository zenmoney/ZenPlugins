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
    version: '1',
    build: '1'
  }
}
if (!('device' in ZenMoney)) {
  ZenMoney.device = {
    id: 'MASTER',
    manufacturer: 'Sony',
    model: 'Xperia Z2',
    brand: 'Xperia Z2',
    os: {
      platform: 'android',
      version: '6.0'
    }
  }
}

if (ZenMoney.application.platform === 'browser' && consoleAdapter.isNativeConsoleImplemented()) {
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
