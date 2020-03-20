import { MD5 } from 'jshashes'
import * as _ from 'lodash'
import padLeft from 'pad-left'
import { toISODateString } from '../../common/dateUtils'
import { fetch } from '../../common/network'
import { parseResponseBody, stringifyRequestBody } from '../../common/protocols/burlap'
import { randomInt } from '../../common/utils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryUnavailableError } from '../../errors'

const md5 = new MD5()

const PROTOCOL_VERSION = '14.0.0'
const APP_VERSION = '14.35.0.8'
const deviceName = 'Zenmoney'

export function createSdkData (login) {
  const date = new Date()
  const osId = md5.hex(login + 'sdk_data').substring(12, 29)
  const rsaAppKey = md5.hex(login + 'rsa app key').toUpperCase()
  const timestamp = date.getUTCFullYear() + '-' +
    padLeft(date.getUTCMonth() + 1, 2, '0') + '-' +
    padLeft(date.getUTCDate(), 2, '0') + 'T' +
    padLeft(date.getUTCHours(), 2, '0') + ':' +
    padLeft(date.getUTCMinutes(), 2, '0') + ':' +
    padLeft(date.getUTCSeconds(), 2, '0') + 'Z'
  return `{
"TIMESTAMP": "${timestamp}",
"HardwareID": "-1",
"SIM_ID": "-1",
"PhoneNumber": "-1",
"DeviceModel": "${deviceName}",
"MultitaskingSupported": true,
"DeviceName": "generic_x86_64",
"DeviceSystemName": "Android",
"DeviceSystemVersion": "23",
"Languages": "ru",
"WiFiMacAddress": "02:00:00:00:00:00",
"ScreenSize": "480x800",
"RSA_ApplicationKey": "${rsaAppKey}",
"OS_ID": "${osId}",
"SDK_VERSION": "3.6.0",
"Compromised": 1,
"Emulator": 4
}`
}

async function burlapRequest (options) {
  const id = randomInt(-2000000000, 2000000000).toFixed(0)
  let payload = null
  let response
  try {
    response = await fetch('https://mb.vtb24.ru/mobilebanking/burlap/', {
      method: 'POST',
      headers: {
        'mb-protocol-version': PROTOCOL_VERSION,
        'mb-app-version': APP_VERSION,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 6.0; Android SDK built for x86_64 Build/MASTER)',
        'Host': 'mb.vtb24.ru',
        'Connection': 'Keep-Alive',
        'Accept-Encoding': 'gzip'
      },
      body: options.body || null,
      sanitizeRequestLog: { headers: { 'cookie': true }, body: _.get(options, 'sanitizeRequestLog.body') },
      sanitizeResponseLog: { headers: { 'set-cookie': true }, body: _.get(options, 'sanitizeResponseLog.body') },
      stringify: (body) => stringifyRequestBody(PROTOCOL_VERSION, {
        __type: 'com.mobiletransport.messaging.DefaultMessageImpl',
        correlationId: randomInt(-2000000000, 2000000000).toFixed(0),
        id,
        localCacheId: 0,
        theme: options.theme || 'Default theme',
        timeToLive: 30000,
        payload: body,
        properties: {
          __type: 'java.util.Hashtable',
          PROTOVERSION: PROTOCOL_VERSION,
          DEVICE_MODEL: deviceName,
          DEVICE_MANUFACTURER: 'unknown',
          APP_VERSION: APP_VERSION,
          PLATFORM: 'ANDROID',
          DEVICE_PLATFORM: 'ANDROID',
          OS: 'Android OS 6.0',
          APPVERSION: APP_VERSION,
          DEVICE: deviceName,
          DEVICEUSERNAME: 'android-build',
          DEVICE_OS: 'Android OS 6.0',
          ...options.token && { 'CLIENT-TOKEN': options.token },
          ...options.sdkData && {
            AF_MOBILE_DEVICE: options.sdkData,
            AF_DEVICE_PRINT: ''
          }
        }
      }),
      parse: (bodyStr) => {
        payload = parseResponseBody(PROTOCOL_VERSION, bodyStr, id).payload
        if (payload) {
          reduceDuplicatesByTypeAndId(payload)
          return resolveCycles(payload)
        }
        return payload
      }
    })
  } catch (e) {
    if (e.response && (e.response.status === 503 || e.response.status === 570)) {
      throw new TemporaryUnavailableError()
    } else if (e.cause) {
      throw e.cause
    } else {
      throw e
    }
  }
  response.body = payload
  if (response.body &&
    response.body.__type === 'ru.vtb24.mobilebanking.protocol.ErrorResponse' &&
    response.body.message) {
    if ([
      'операцию позже',
      'временно недоступна'
    ].some(str => response.body.message.indexOf(str) >= 0)) {
      throw new TemporaryUnavailableError()
    } else if ([
      'Ошибка обращения'
    ].some(str => response.body.message.indexOf(str) >= 0)) {
      throw new Error(`Во время синхронизации произошла ошибка.\n\nСообщение от банка: ${response.body.message}`)
    } else {
      throw new BankMessageError(response.body.message)
    }
  }
  return response
}

export async function login (login, password) {
  login = login.replace(/\s+/g, '')
  const sdkData = createSdkData(login)
  let response = await burlapRequest({
    sdkData,
    body: {
      __type: 'ru.vtb24.mobilebanking.protocol.security.StartSessionRequest',
      sessionContext: {
        __type: 'ru.vtb24.mobilebanking.protocol.security.SessionContextMto',
        certificateNumber: null,
        clientIp: null,
        outerSessionId: 'VTB_TEST_APP',
        timeoutDuration: null,
        userAgent: null
      }
    },
    sanitizeResponseLog: { body: { sessionId: true, userInfo: true } }
  })

  const token = response.body.sessionId
  response = await burlapRequest({
    sdkData,
    token,
    theme: 'GetLoginModeRequest theme',
    body: {
      __type: 'ru.vtb24.mobilebanking.protocol.security.GetLoginModeRequest',
      login
    },
    sanitizeRequestLog: { body: { login: true } }
  })
  if ([
    'GeneralError',
    'InactiveCard',
    'NoDBO24',
    'ExpirationDateOver',
    'CardNotFound',
    'ThirdPersonCard',
    'CrossLinkFault'
  ].some(mode => response.body.mode === mode) && response.body.description) {
    throw new BankMessageError(response.body.description)
  }
  console.assert(response.body.mode === 'Pass', 'unsupported login mode')
  response = await burlapRequest({
    sdkData,
    token,
    theme: 'LoginRequest theme',
    body: {
      __type: 'ru.vtb24.mobilebanking.protocol.security.LoginRequest',
      login,
      password
    },
    sanitizeRequestLog: { body: { login: true, password: true } },
    sanitizeResponseLog: {
      body: {
        sessionId: true,
        userInfo: true,
        lastLogonInChannel: true,
        authorization: {
          id: true
        }
      }
    }
  })
  if (response.body.type === 'invalid-credentials') {
    throw new InvalidLoginOrPasswordError()
  }
  console.assert(response.body.authorization.methods.find(method => method.id === 'SMS'), 'unsupported authorization method')
  await burlapRequest({
    token,
    theme: 'SelectAuthorizationTypeRequest theme',
    body: {
      __type: 'ru.vtb24.mobilebanking.protocol.security.SelectAuthorizationTypeRequest',
      authorizationType: {
        __type: 'ru.vtb24.mobilebanking.protocol.security.AuthorizationTypeMto',
        id: 'SMS',
        value: 'SMS'
      }
    },
    sanitizeResponseLog: {
      body: {
        sessionId: true,
        userInfo: true,
        lastLogonInChannel: true,
        authorization: {
          id: true
        }
      }
    }
  })
  response = await burlapRequest({
    sdkData,
    token,
    theme: 'GetChallengeRequest theme',
    body: {
      __type: 'ru.vtb24.mobilebanking.protocol.security.GetChallengeRequest'
    },
    sanitizeResponseLog: {
      body: {
        sessionId: true,
        userInfo: true,
        lastLogonInChannel: true,
        authorization: {
          id: true
        }
      }
    }
  })
  console.assert(response.body.authorization.methods.find(method => method.id === 'SMS'), 'unsupported authorization method')
  const code = await ZenMoney.readLine('Введите код из SMS или push-уведомления', {
    time: 120000,
    inputType: 'number'
  })
  if (!code || !code.trim()) {
    throw new InvalidOtpCodeError()
  }
  response = await burlapRequest({
    sdkData,
    token,
    theme: 'ConfirmLoginRequest theme',
    body: {
      __type: 'ru.vtb24.mobilebanking.protocol.security.ConfirmLoginRequest',
      inChallengeResponse: code
    },
    sanitizeResponseLog: {
      body: {
        sessionId: true,
        userInfo: true,
        lastLogonInChannel: true,
        authorization: {
          id: true
        }
      }
    }
  })
  if (response.body.type === 'invalid-sms-code') {
    throw new InvalidOtpCodeError()
  }
  console.assert(response.body.authorization.id === '00000000-0000-0000-0000-000000000000', 'invalid response')
  return {
    login,
    token
  }
}

export async function fetchAccounts ({ login, token }) {
  const sdkData = createSdkData(login)
  const response = await burlapRequest({
    sdkData,
    token,
    body: {
      __type: 'ru.vtb24.mobilebanking.protocol.product.PortfolioRequest',
      refreshImmediately: false
    }
  })
  console.assert(response.body.executionPercent && response.body.status, 'unexpected response')
  // console.assert(response.body.executionPercent === 100 &&
  //   response.body.status === 'Complete', 'missing some accounts data')
  if (response.body.executionPercent < 75) {
  // if (response.body.executionPercent !== 100 || response.body.status !== 'Complete') {
    throw new TemporaryUnavailableError()
  }
  return response.body.portfolios
}

function toMoscowDate (date) {
  return new Date(date.getTime() + (date.getTimezoneOffset() + 180) * 60000)
}

export async function fetchTransactions ({ login, token }, { id, type }, fromDate, toDate) {
  let transactions = null
  try {
    const sdkData = createSdkData(login)
    const response = await burlapRequest({
      sdkData,
      token,
      body: {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.StatementRequest',
        startDate: new Date(toISODateString(toMoscowDate(fromDate)) + 'T00:00:00+03:00'),
        endDate: new Date(toISODateString(toMoscowDate(toDate)) + 'T23:59:59+03:00'),
        products: [
          {
            __type: 'ru.vtb24.mobilebanking.protocol.ObjectIdentityMto',
            id,
            type
          }
        ]
      }
    })
    transactions = response.body.transactions || null
  } catch (e) {
    if (!e.message || !['временно', 'Ошибка обращения', '[NER]', '[NCE]'].some(pattern => e.message.indexOf(pattern) >= 0)) {
      throw e
    }
  }
  return transactions
}

function getCachedObject (object, cache) {
  if (!object || !object.__type || typeof object.id !== 'string' ||
    object.id.length < 24 ||
    object.__type.indexOf('StatusMto') >= 0 ||
    object.__type.indexOf('PortfolioMto') >= 0 ||
    object.__type === 'ru.vtb24.mobilebanking.protocol.item.ItemMto') {
    return null
  }
  const id = `${object.__type}_${object.id}`
  const cachedObject = cache[id]
  if (cachedObject === object) {
    return null
  }
  if (cachedObject === undefined) {
    cache[id] = object
    return null
  }
  return cachedObject
}

export function resolveCycles (object, cache = {}) {
  if (object && object.__id !== undefined) {
    const copy = cache[object.__id]
    if (copy && copy.__id === undefined) {
      copy.__id = object.__id
    }
    return `<ref[${object.__id}]>`
  }
  if (_.isArray(object)) {
    Object.defineProperty(object, '__id', { enumerable: false, value: cache.count || 0 })
    cache.count = object.__id + 1
    return object.map(value => resolveCycles(value, cache))
  } else if (_.isObject(object) && !(object instanceof Date)) {
    const copy = {}
    Object.defineProperty(object, '__id', { enumerable: false, value: cache.count || 0 })
    cache.count = object.__id + 1
    cache[object.__id] = copy
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        copy[key] = resolveCycles(object[key], cache)
      }
    }
    return copy
  } else {
    return object
  }
}

export function reduceDuplicatesByTypeAndId (object, cache = {}, onlyCopyValueToCachedObject) {
  if (object && object.__reduceDuplicates) {
    return
  }
  let forEach
  let cachedObject = null
  if (_.isArray(object)) {
    forEach = (fn) => object.forEach(fn)
  } else if (_.isObject(object) && !(object instanceof Date)) {
    cachedObject = getCachedObject(object, cache)
    forEach = (fn) => {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          fn(object[key], key)
        }
      }
    }
  } else {
    return
  }
  Object.defineProperty(object, '__reduceDuplicates', { enumerable: false, value: true })
  forEach((value, key) => {
    const cachedValue = getCachedObject(value, cache)
    if (cachedObject) {
      const _value = cachedObject[key]
      if (_value === null || _value === undefined) {
        cachedObject[key] = cachedValue || value
      }
    }
  })
  forEach((value, key) => {
    const cachedValue = onlyCopyValueToCachedObject ? null : getCachedObject(value, cache)
    reduceDuplicatesByTypeAndId(value, cache, cachedValue !== null)
    if (cachedValue) {
      object[key] = cachedValue
    }
  })
}
