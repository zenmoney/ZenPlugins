import { isDebug } from './common/utils'
import * as consoleAdapter from './consoleAdapter'
import { IncompatibleVersionError } from './errors'

global.Promise = require('promise/lib/es6-extensions.js')
global.Symbol = require('es6-symbol')

delete global.Blob
delete global.FormData
if (ZenMoney.fetch && ZenMoney.Blob) {
  global.Blob = ZenMoney.Blob
} else {
  require('./polyfills/blob')
}
require('./polyfills/formData')
ZenMoney.Blob = global.Blob
ZenMoney.FormData = global.FormData
global.fetch = null
if (ZenMoney.fetch) {
  require('./polyfills/fetch')
} else {
  // eslint-disable-next-line import/no-webpack-loader-syntax
  global.fetch = require('imports-loader?type=commonjs&imports=single|xhrViaZenApi|{default:XMLHttpRequest}=XMLHttpRequest' + '&' +
    'additionalCode=var%20self%20=%20global;%0A' +
    'var%20Blob%20=%20ZenMoney.Blob;%0A' +
    'var%20FormData%20=%20ZenMoney.FormData;' + '!' +
    'exports-loader?type=commonjs&exports=single|self.fetch!whatwg-fetch')
}
global.Blob = null
global.FormData = null
delete global.Blob
delete global.FormData

if (!('self' in global)) {
  global.self = global
}

Object.assign = require('object-assign')
require('./polyfills/array')
require('./polyfills/math')
require('./polyfills/crypto')

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
global.assert = console.assert

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
    const {
      imageUrl = null,
      image = null,
      ...rest
    } = options
    if (image && !ZenMoney.features?.readLineWithImage) {
      throw new IncompatibleVersionError()
    }
    if (image && imageUrl) {
      throw new Error('imageUrl and image cannot be used together')
    }
    return ZenMoney.retrieveCode(message, image || imageUrl, rest)
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

if (!ZenMoney.fetch) {
  const pickDocuments = ZenMoney.pickDocuments
  ZenMoney.pickDocuments = async (mimeTypes, allowMultipleSelection) => {
    return new Promise((resolve, reject) => {
      if (typeof pickDocuments !== 'function') {
        return reject(new IncompatibleVersionError())
      }
      pickDocuments.call(ZenMoney, { mimeTypes, allowMultipleSelection }, (err, blobs) => {
        if (err) {
          reject(err)
        } else {
          resolve(blobs)
        }
      })
    })
  }
} else {
  const pickDocuments = ZenMoney.pickDocuments
  ZenMoney.pickDocuments = async (mimeTypes, allowMultipleSelection) => {
    return pickDocuments.call(ZenMoney, { mimeTypes, allowMultipleSelection })
  }
}

if (!ZenMoney.fetch) {
  const takePicture = ZenMoney.takePicture
  ZenMoney.takePicture = async (format) => {
    return new Promise((resolve, reject) => {
      if (typeof takePicture !== 'function') {
        return reject(new IncompatibleVersionError())
      }
      takePicture.call(ZenMoney, format, (err, blob) => {
        if (err) {
          reject(err)
        } else {
          resolve(blob)
        }
      })
    })
  }
}

if (!ZenMoney.locale) {
  ZenMoney.locale = ZenMoney.user?.locale
    ? ZenMoney.user.locale.replace('_', '-')
    : 'ru'
}

if (!ZenMoney.logEvent) {
  ZenMoney.logEvent = () => {}
}

if (ZenMoney.features?.networkCallbacks && (
  !ZenMoney.application?.platform ||
  (ZenMoney.application?.platform === 'ios' && !(parseInt(ZenMoney.application?.build) >= 489)) ||
  (ZenMoney.application?.platform === 'android' && !(parseInt(ZenMoney.application?.build) >= 875)))) {
  ZenMoney.features.networkCallbacks = false
}
