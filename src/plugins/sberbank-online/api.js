import { MD5 } from 'jshashes'
import _ from 'lodash'
import * as moment from 'moment'
import * as qs from 'querystring'
import * as network from '../../common/network'
import { retry, RetryError, toNodeCallbackArguments } from '../../common/retry'
import { parseOuterAccountData } from '../../common/accounts'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { formatDateSql, parseDate, parseDecimal } from './converters'

const md5 = new MD5()

const API_VERSION = '9.20'
const APP_VERSION = '9.2.0'

const defaultHeaders = {
  'User-Agent': 'Mobile Device',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Host': 'online.sberbank.ru:4477',
  'Connection': 'Keep-Alive',
  'Accept-Encoding': 'gzip'
}

export async function renewSession (session) {
  if (!session || !session.host || !session.cookie) {
    return null
  }
  try {
    const response = await fetchXml(`https://${session.host}:4477/mobile9/private/renewSession.do`, {
      headers: {
        ...defaultHeaders,
        'Accept': 'application/x-www-form-urlencoded',
        'Accept-Charset': 'windows-1251',
        'Host': `${session.host}:4477`,
        'Cookie': `${session.cookie}`
      },
      parse: body => body ? network.parseXml(body) : { response: {} }
    }, null)
    return response.body && response.body.status === '0' ? session : null
  } catch (e) {
    if (e.message && e.message.indexOf('non-successful response') >= 0) {
      return null
    } else {
      throw e
    }
  }
}

export async function login (login, pin, auth, device) {
  const commonBody = {
    'version': API_VERSION,
    'appType': 'android',
    'appVersion': APP_VERSION,
    'deviceName': device.model
  }

  let response
  let guid = auth && auth.guid

  if (guid) {
    response = await fetchXml('https://online.sberbank.ru:4477/CSAMAPI/login.do', {
      body: {
        ...commonBody,
        'operation': 'button.login',
        'mGUID': guid,
        'password': pin,
        'isLightScheme': false,
        'devID': device.id,
        'mobileSdkData': JSON.stringify(createSdkData(login, device))
      },
      sanitizeRequestLog: { body: { mGUID: true, password: true, devID: true, mobileSdkData: true } },
      sanitizeResponseLog: { body: { loginData: { token: true } } }
    }, null)
    if (response.body.status === '7') {
      guid = null
    }
  }

  if (!guid) {
    const loginWithoutSpaces = login.replace(/\s+/g, '').trim()
    const isLoginCardNumber = loginWithoutSpaces.match(/^\d{16}\d*$/)
    response = await fetchXml('https://online.sberbank.ru:4477/CSAMAPI/registerApp.do', {
      body: {
        ...commonBody,
        'operation': 'register',
        ...isLoginCardNumber ? { cardNumber: loginWithoutSpaces } : { login },
        'devID': device.id,
        'devIDOld': device.idOld
      },
      sanitizeRequestLog: { body: { login: true, devID: true, devIDOld: true } },
      sanitizeResponseLog: { body: { confirmRegistrationStage: { mGUID: true } } }
    }, null)
    if (response.body.status === '1' && response.body.error) {
      throw new TemporaryError(response.body.error)
    }
    validateResponse(response, response => response.body.status === '0' &&
      _.get(response, 'body.confirmRegistrationStage.mGUID'))

    guid = response.body.confirmRegistrationStage.mGUID

    if (_.get(response, 'body.confirmInfo.type') === 'smsp') {
      const code = await ZenMoney.readLine('Введите код для входа в Сбербанк Онлайн для Android из SMS или пуш-уведомления', {
        time: 120000,
        inputType: 'number'
      })
      if (!code || !code.trim()) {
        throw new TemporaryError('Получен пустой код авторизации устройства')
      }
      response = await fetchXml('https://online.sberbank.ru:4477/CSAMAPI/registerApp.do', {
        body: {
          'operation': 'confirm',
          'mGUID': guid,
          'smsPassword': code,
          'version': API_VERSION,
          'appType': 'android'
        },
        sanitizeRequestLog: { body: { mGUID: true, smsPassword: true } }
      }, null)
      if (response.body.status === '1') {
        throw new TemporaryError('Вы ввели некорректные реквизиты доступа или код из SMS. Повторите подключение синхронизации.')
      } else {
        validateResponse(response, response => response.body.status === '0')
      }
    }

    response = await fetchXml('https://online.sberbank.ru:4477/CSAMAPI/registerApp.do', {
      body: {
        ...commonBody,
        'operation': 'createPIN',
        'mGUID': guid,
        'password': pin,
        'isLightScheme': false,
        'devID': device.id,
        'devIDOld': device.idOld,
        'mobileSdkData': JSON.stringify(createSdkData(login, device))
      },
      sanitizeRequestLog: { body: { mGUID: true, password: true, devID: true, devIDOld: true, mobileSdkData: true } },
      sanitizeResponseLog: { body: { loginData: { token: true } } }
    }, null)
  }

  if (response.body.status === '1' && response.body.error) {
    throw new InvalidPreferencesError(response.body.error)
  }
  validateResponse(response, response => response.body && response.body.status === '0' &&
    _.get(response, 'body.loginData.token') &&
    _.get(response, 'body.loginData.host'))

  const token = response.body.loginData.token
  const host = response.body.loginData.host

  response = await fetchXml(`https://${host}:4477/mobile9/postCSALogin.do`, {
    headers: {
      ...defaultHeaders,
      'Host': `${host}:4477`
    },
    body: {
      'token': token,
      'appName': '????????',
      'appBuildOSType': 'android',
      'appBuildType': 'RELEASE',
      'appFormat': 'STANDALONE',
      'deviceType': 'Android SDK built for x86_64',
      'deviceOSType': 'android',
      'deviceOSVersion': '6.0',
      'appVersion': APP_VERSION,
      'deviceName': device.model
    },
    sanitizeRequestLog: { body: { token: true } },
    sanitizeResponseLog: { body: { person: true } }
  }, null)
  if (response.body && response.body.status === '3' && !response.body.error) {
    throw new TemporaryError('Информация из Сбербанка временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
  }
  validateResponse(response, response => response.body.status === '0' &&
    _.get(response, 'body.loginCompleted') === 'true')

  return { guid, api: { token, host, cookie: getCookie(response) } }
}

export async function fetchAccounts (auth) {
  await fetchXml(`https://${auth.api.host}:4477/mobile9/private/finances/targets/list.do`, {
    headers: {
      ...defaultHeaders,
      'Host': `${auth.api.host}:4477`,
      'Cookie': auth.api.cookie
    }
  })
  const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/products/list.do`, {
    headers: {
      ...defaultHeaders,
      'Host': `${auth.api.host}:4477`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=windows-1251',
      'Cookie': auth.api.cookie
    },
    body: { showProductType: 'cards,accounts,imaccounts,loans' }
  })
  const types = ['card', 'account', 'loan', 'target', 'ima']
  return (await Promise.all(types.map(type => {
    return Promise.all(getArray(_.get(response.body, type !== 'ima' ? `${type}s.${type}` : 'imaccounts.ima')).map(async account => {
      const params = type === 'target'
        ? account.account && account.account.id
          ? { id: account.account.id, type: 'account' }
          : null
        : account.mainCardId || (type === 'card' && account.type !== 'credit') || type === 'ima'
          ? null
          : { id: account.id, type }
      return {
        account: account,
        details: params ? await fetchAccountDetails(auth, params) : null
      }
    }))
  }))).reduce((accounts, objects, i) => {
    accounts[types[i]] = objects
    return accounts
  }, {})
}

async function fetchAccountDetails (auth, { id, type }) {
  const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/${type !== 'ima' ? type + 's' : 'ima'}/info.do`, {
    headers: {
      ...defaultHeaders,
      'Host': `${auth.api.host}:4477`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=windows-1251',
      'Cookie': auth.api.cookie
    },
    body: { id: id }
  }, null)
  validateResponse(response, response => _.get(response, 'body.detail'))
  return response.body
}

export async function fetchPayments (auth, { id, type, instrument }, fromDate, toDate) {
  let transactions = []

  const limit = 50
  let offset = 0
  let batch = null
  const fromDateStr = formatDate(moment(toDate).add(-5, 'year').toDate())
  const toDateStr = formatDate(toDate)
  do {
    const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/payments/list.do`, {
      headers: {
        ...defaultHeaders,
        'Host': `${auth.api.host}:4477`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=windows-1251',
        'Cookie': auth.api.cookie
      },
      body: {
        paginationSize: limit,
        paginationOffset: offset,
        from: fromDateStr,
        to: toDateStr,
        includeUfs: true,
        usedResource: `${type}:${id}`,
        showExternal: true
      }
    })
    batch = getArray(_.get(response, 'body.operations.operation'))
    offset += limit
    transactions.push(...batch)
  } while (batch && batch.length === limit && parseDate(batch[batch.length - 1].date) >= fromDate)

  transactions = filterTransactions(transactions, fromDate)

  await Promise.all(transactions.map(async transaction => {
    const invoiceCurrency = _.get(transaction, 'operationAmount.currency.code')
    if (invoiceCurrency !== instrument ||
      [
        'TakingMeans',
        'ExtCardTransferIn',
        'ExtCardTransferOut',
        'ExtCardCashOut',
        'ExtDepositTransferIn',
        'ExtDepositOtherDebit',
        'RurPayment',
        'RurPayJurSB',
        'InternalPayment',
        'AccountOpeningClaim',
        'AccountClosingPayment',
        'IMAOpeningClaim',
        'IMAPayment'
      ].indexOf(transaction.form) >= 0 ||
      parseOuterAccountData(transaction.to) ||
      transaction.to === 'Автоплатеж') {
      const detailsResponse = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/payments/view.do`, {
        headers: {
          ...defaultHeaders,
          'Host': `${auth.api.host}:4477`,
          'Cookie': auth.api.cookie
        },
        body: {
          id: transaction.id
        }
      })
      const form = _.get(detailsResponse, 'body.document.form')
      if (form) {
        transaction.details = _.get(detailsResponse, `body.document.${form}Document`)
        if (!transaction.details) {
          throw new Error(`unexpected details form ${form}`)
        }
      }
    }
  }))

  return transactions
}

export function filterTransactions (transactions, fromDate) {
  const filtered = []
  transactions.forEach((transaction, i) => {
    if (['DRAFT', 'SAVED', 'REFUSED'].indexOf(transaction.state) >= 0 || (transaction.description && [
      'Создание автоплатежа',
      'Приостановка автоплатежа',
      'Редактирование автоплатежа'
    ].some(pattern => transaction.description.indexOf(pattern) === 0))) {
      return
    }
    const invoiceCurrency = _.get(transaction, 'operationAmount.currency.code')
    if (!invoiceCurrency) {
      return
    }
    const sum = parseDecimal(_.get(transaction, 'operationAmount.amount'))
    if (!sum) {
      return
    }
    const date = parseDate(transaction.date)
    if (fromDate && date < fromDate) {
      return
    }
    if (transaction.state === 'AUTHORIZATION' && i > 0) {
      const data = _.pick(transaction, ['from', 'to', 'description', 'operationAmount', 'form'])
      for (let j = i - 1; j >= 0; j--) {
        const prev = transactions[j]
        const prevDate = parseDate(prev.date)
        if (Math.abs(prevDate.getTime() - date.getTime()) > 14 * 24 * 3600 * 1000) {
          break
        }
        if (prev.state === 'FINANCIAL') {
          const prevData = _.pick(prev, ['from', 'to', 'description', 'operationAmount', 'form'])
          if (_.isEqual(data, prevData)) {
            return
          }
        }
      }
    }
    if ((transaction.state === 'FINANCIAL' || transaction.state === 'AUTHORIZATION') && i < transactions.length - 1) {
      const data = _.pick(transaction, ['from', 'operationAmount'])
      for (let j = i + 1; j < transactions.length; j++) {
        const next = transactions[j]
        const nextDate = parseDate(next.date)
        if (Math.abs(nextDate.getTime() - date.getTime()) > 2 * 60 * 1000) {
          break
        }
        if (next.state === 'EXECUTED') {
          const nextData = _.pick(next, ['from', 'operationAmount'])
          if (_.isEqual(data, nextData)) {
            return
          }
        }
      }
    }
    filtered.push(transaction)
  })
  return filtered
}

export async function fetchTransactions (auth, { id, type, instrument }, fromDate, toDate) {
  if (type === 'ima') {
    return []
  }
  const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/${type !== 'ima' ? type + 's' : 'ima'}/abstract.do`, {
    headers: {
      ...defaultHeaders,
      'Host': `${auth.api.host}:4477`,
      'Referer': `Android/6.0/${APP_VERSION}`,
      'Cookie': auth.api.cookie
    },
    body: type === 'card'
      ? { id, count: 10, paginationSize: 10 }
      : { id, from: formatDate(fromDate), to: formatDate(toDate) }
  })
  const fromDateStr = formatDateSql(fromDate)
  const toDateStr = formatDateSql(toDate)
  return (type === 'loan'
    ? getArray(_.get(response, 'body.elements.element'))
    : getArray(_.get(response, 'body.operations.operation'))).filter(transaction => {
    if (type !== 'loan') {
      const sumStr = _.get(transaction, 'sum.amount')
      const sum = sumStr ? parseDecimal(sumStr) : 0
      if (!sum) {
        return false
      }
    }
    const dateStr = formatDateSql(parseDate(transaction.date))
    return dateStr >= fromDateStr && dateStr <= toDateStr
  })
}

export async function makeTransfer (login, auth, device, { fromAccount, toAccount, sum }) {
  const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/payments/payment.do`, {
    headers: {
      ...defaultHeaders,
      'Host': `${auth.api.host}:4477`
    },
    body: {
      fromResource: fromAccount,
      exactAmount: 'destination-field-exact',
      operation: 'save',
      buyAmount: sum,
      transactionToken: auth.api.token,
      form: 'InternalPayment',
      toResource: toAccount
    },
    sanitizeRequestLog: { body: { transactionToken: true } }
  }, response => _.get(response, 'body.transactionToken') && _.get(response, 'body.document.id'))

  const id = response.body.document.id
  const transactionToken = response.body.transactionToken

  await fetchXml(`https://${auth.api.host}:4477/mobile9/private/payments/confirm.do`, {
    headers: {
      ...defaultHeaders,
      'Host': `${auth.api.host}:4477`
    },
    body: {
      mobileSdkData: JSON.stringify(createSdkData(login, device)),
      operation: 'confirm',
      id: id,
      form: 'InternalPayment',
      transactionToken: transactionToken
    }
  }, response => _.get(response, 'body.document.status') === 'EXECUTED')
}

async function fetchXml (url, options = {}, predicate = () => true) {
  options = {
    method: 'POST',
    headers: defaultHeaders,
    stringify: qs.stringify,
    parse: network.parseXml,
    ...options
  }

  _.set(options, 'sanitizeRequestLog.headers.cookie', true)
  _.set(options, 'sanitizeRequestLog.headers.Cookie', true)
  _.set(options, 'sanitizeResponseLog.headers.set-cookie', true)

  if (typeof _.get(options, 'sanitizeResponseLog.body') === 'object') {
    options.sanitizeResponseLog.body = { response: options.sanitizeResponseLog.body }
  }

  let response
  try {
    response = (await retry({
      getter: toNodeCallbackArguments(() => network.fetch(url, options)),
      predicate: ([error]) => !error,
      maxAttempts: 5
    }))[1]
  } catch (e) {
    if (e instanceof RetryError) {
      throw e.failedResults[0][0]
    } else if (e.response && typeof e.response.body === 'string') {
      throw new TemporaryError('Информация из Сбербанка временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
    } else {
      throw e
    }
  }

  validateResponse(response, response => response && response.body && response.body.response)
  response.body = response.body.response
  response.body.error = getErrorMessage(response.body)
  response.body.status = _.get(response, 'body.status.code')

  if (isTemporaryError(response.body.error) || (predicate && response.body.status === '3')) {
    throw new TemporaryError('Информация из Сбербанка временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
  }
  if (response.body.status !== '0' &&
    response.body.error &&
    response.body.error.indexOf('личный кабинет заблокирован') >= 0) {
    throw new InvalidPreferencesError(response.body.error)
  }

  if (predicate) {
    validateResponse(response, response => response.body.status === '0' && predicate(response))
  }

  return response
}

export function getErrorMessage (xmlObject, maxDepth = 3) {
  if (!xmlObject || maxDepth <= 0) {
    return null
  }
  if (xmlObject.errors &&
    xmlObject.errors.error &&
    xmlObject.errors.error.text) {
    return xmlObject.errors.error.text
  }
  if (maxDepth > 1) {
    for (const key in xmlObject) {
      if (xmlObject.hasOwnProperty(key)) {
        const error = getErrorMessage(xmlObject[key], maxDepth - 1)
        if (error) {
          return error
        }
      }
    }
  }
  return null
}

function isTemporaryError (message) {
  return message && [
    'временно недоступна',
    'АБС временно',
    'АБС не доступна',
    'Во время выполнения операции произошла ошибка',
    'По техническим причинам Вы не можете выполнить данную операцию'
  ].some(str => message.indexOf(str) >= 0)
}

function validateResponse (response, predicate) {
  console.assert(!predicate || predicate(response), 'non-successful response')
}

function getCookie (response) {
  let cookie
  if (response.headers &&
    response.headers['set-cookie'] &&
    response.headers['set-cookie'].indexOf('JSESSIONID') === 0) {
    cookie = response.headers['set-cookie'].split(';')[0]
  } else {
    cookie = ZenMoney.getCookie('JSESSIONID')
    if (cookie) {
      cookie = 'JSESSIONID=' + cookie
    }
  }
  console.assert(cookie, 'could not get cookie from response', response.url)
  return cookie
}

function getArray (object) {
  return object === null || object === undefined
    ? []
    : Array.isArray(object) ? object : [object]
}

function formatDate (date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join('.')
}

function generateHex (mask, digits) {
  let i = 0
  return mask.replace(/x/ig, () => {
    return digits[i++]
  })
}

function createSdkData (login, device) {
  const dt = new Date()
  const hex = md5.hex(login + 'sdk_data')
  const rsaAppKey = md5.hex(login + 'rsa app key').toUpperCase()

  const obj = {
    'TIMESTAMP': dt.getUTCFullYear() + '-' +
      toAtLeastTwoDigitsString(dt.getUTCMonth() + 1) + '-' +
      toAtLeastTwoDigitsString(dt.getUTCDate()) + 'T' +
      dt.getUTCHours() + ':' + dt.getUTCMinutes() + ':' + dt.getUTCSeconds() + 'Z',
    'HardwareID': generateImei(login, '35472406******L'),
    'SIM_ID': generateSimSN(login, '2500266********L'),
    'PhoneNumber': '',
    'GeoLocationInfo': [
      {
        'Longitude': (37.0 + Math.random()).toString(10),
        'Latitude': (55.0 + Math.random()).toString(10),
        'HorizontalAccuracy': '5',
        'Altitude': (150 + Math.floor(Math.random() * 20)).toString(10),
        'AltitudeAccuracy': '5',
        'Timestamp': (dt.getTime() - Math.floor(Math.random() * 1000000)).toString(10),
        'Heading': (Math.random() * 90).toString(10),
        'Speed': '3',
        'Status': '3'
      }
    ],
    'DeviceModel': device.model,
    'MultitaskingSupported': true,
    'deviceName': device.model,
    'DeviceSystemName': 'Android',
    'DeviceSystemVersion': '22',
    'Languages': 'ru',
    'WiFiMacAddress': generateHex('44:d4:e0:xx:xx:xx', hex.substr(0, 6)),
    'WiFiNetworksData': {
      'BBSID': generateHex('5c:f4:ab:xx:xx:xx', hex.substr(6, 12)),
      'SignalStrength': Math.floor(-30 - Math.random() * 20).toString(10),
      'Channel': 'null',
      'SSID': 'TPLink'
    },
    'CellTowerId': (12875 + Math.floor(Math.random() * 10000)).toString(10),
    'LocationAreaCode': '9722',
    'ScreenSize': '1080x1776',
    'RSA_ApplicationKey': rsaAppKey,
    'MCC': '250',
    'MNC': '02',
    'OS_ID': hex.substring(12, 16),
    'SDK_VERSION': '2.0.1',
    'Compromised': 0,
    'Emulator': 0
  }

  return obj
}

function generateImei (val, mask) {
  const defaultImeiMask = '35374906******L' // Samsung
  const serial = String(Math.abs(crc32(val) % 1000000))

  if (!mask) {
    mask = defaultImeiMask
  }

  mask = mask.replace(/\*{6}/, serial)
  mask = mask.replace(/L/, luhnGet(mask.replace(/L/, '')))

  return mask
}

function generateSimSN (val, mask) {
  const defaultSimSN = '897010266********L' // билайн
  const serial = (Math.abs(crc32(val + 'simSN') % 100000000)).toString(10)

  if (!mask) {
    mask = defaultSimSN
  }

  mask = mask.replace(/\*{8}/, serial)
  mask = mask.replace(/L/, luhnGet(mask.replace(/L/, '')))

  return mask
}

function crc32 (str) {
  function makeCRCTable () {
    let c
    const crcTable = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
      }
      crcTable[n] = c
    }
    return crcTable
  }

  const crcTable = makeCRCTable()
  let crc = 0 ^ (-1)

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
  }

  return (crc ^ (-1)) >>> 0
}

function luhnGet (num) {
  const arr = []
  num = num.toString()
  for (let i = 0; i < num.length; i++) {
    if (i % 2 === 0) {
      const m = parseInt(num[i], 10) * 2
      if (m > 9) {
        arr.push(m - 9)
      } else {
        arr.push(m)
      }
    } else {
      const n = parseInt(num[i], 10)
      arr.push(n)
    }
  }

  const summ = arr.reduce((a, b) => {
    return a + b
  })
  return (summ % 10)
}
