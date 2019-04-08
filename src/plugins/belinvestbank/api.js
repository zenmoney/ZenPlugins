import { fetchJson } from '../../common/network'
import { defaultsDeep, flatMap } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { Base64 } from 'jshashes'

const base64 = new Base64()
var querystring = require('querystring')
const loginUrl = 'https://login.belinvestbank.by/app_api'
const dataUrl = 'https://ibank.belinvestbank.by/app_api'

export function getDevice () {
  let deviceID = ZenMoney.getData('deviceId', generateRandomString(16))
  ZenMoney.setData('deviceId', deviceID)
  let deviceToken = ZenMoney.getData('deviceToken', base64.encode(generateRandomString(203)))
  ZenMoney.setData('deviceToken', deviceToken)
  return {
    deviceID: deviceID,
    deviceToken: deviceToken
  }
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Android',
        'DEVICE_TOKEN': 123456,
        'Connection': 'Keep-Alive',
        'Accept-Encoding': 'gzip'
      },
      sanitizeRequestLog: { headers: { Cookie: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } },
      stringify: querystring.stringify
    }
  )

  const response = await fetchJson(url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body.status && (response.body.status === 'ER' || response.body.status === 'SE') && response.body.message && !response.body.isNeedConfirmSessionKey) {
    const errorDescription = response.body.message
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('введены неверно') >= 0) { throw new InvalidPreferencesError(errorMessage) }
    throw new TemporaryError(errorMessage)
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

function cookies (response) {
  if (response.headers) {
    const cookies = response.headers['set-cookie']
    if (cookies) {
      const requiredValues = /(PHPSESSID=[^;]*;)/g
      return cookies.match(requiredValues)[cookies.match(requiredValues).length - 1]
    } else {
      return cookies
    }
  } else {
    return '' // tests not mocking headers, ignoring
  }
}

export async function login (login, password) {
  const device = getDevice()
  let res = (await fetchApiJson(loginUrl, {
    method: 'POST',
    body: {
      section: 'account',
      method: 'signin',
      login: login,
      password: password,
      deviceId: device.deviceID,
      versionApp: '2.1.7',
      os: 'Android',
      device_token: device.deviceToken,
      device_token_type: 'ANDROID'
    },
    sanitizeRequestLog: { body: { login: true, password: true } }
  }, response => response.success, message => new InvalidPreferencesError('Неверный логин или пароль')))
  let sessionCookies = cookies(res)

  if (res.body.isNeedConfirmSessionKey) {
    res = (await fetchApiJson(loginUrl, {
      method: 'POST',
      body: {
        section: 'account',
        method: 'confirmationCloseSession'
      }
    }, response => response.success, message => new InvalidPreferencesError('bad request')))
  }
  console.log(sessionCookies)

  const code = await ZenMoney.readLine('Введите код из СМС', {
    time: 120000,
    inputType: 'number'
  })
  if (!code || !code.trim()) {
    throw new TemporaryError('Вы не ввели код. Повторите запуск синхронизации.')
  }

  res = (await fetchApiJson(loginUrl, {
    method: 'POST',
    headers: { 'Cookie': sessionCookies },
    body: {
      section: 'account',
      method: 'signin2',
      action: 1,
      key: code,
      device_token: device.deviceToken,
      device_token_type: 'ANDROID'
    }
  }, response => response.success && response.body.status && response.body.status === 'OK', message => new InvalidPreferencesError('bad request')))

  res = (await fetchApiJson(dataUrl, {
    method: 'POST',
    body: {
      section: 'account',
      method: 'authCallback',
      auth_code: res.body.values.authCode
    }
  }, response => response.success && response.body.status && response.body.status === 'OK', message => new InvalidPreferencesError('bad request')))
  sessionCookies = cookies(res)

  return sessionCookies
}

export async function fetchAccounts (sessionCookies) {
  console.log('>>> Загрузка списка счетов...')
  let accounts = (await fetchApiJson(dataUrl, {
    method: 'POST',
    headers: { 'Cookie': sessionCookies },
    body: {
      'section': 'payments',
      'method': 'index'
    }
  }, response => response.success && response.body.status && response.body.status === 'OK',
  message => new InvalidPreferencesError('bad request')))
  return accounts.body.values.cards
}

function formatDate (date) {
  return ('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear()
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 10 * 24 * 60 * 60 * 1000 // 10 days interval for fetching data
  const dates = []

  let time = fromDate.getTime()
  let prevTime = null
  while (time < toDate.getTime()) {
    if (prevTime !== null) {
      dates.push([new Date(prevTime), new Date(time - 1)])
    }

    prevTime = time
    time = time + interval
  }
  dates.push([new Date(prevTime), toDate])

  return dates
}

export async function fetchTransactions (sessionCookies, accounts, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return dates.map(dates => {
      return fetchApiJson(dataUrl, {
        method: 'POST',
        headers: { 'Cookie': sessionCookies },
        body: {
          section: 'cards',
          method: 'history',
          cardId: account.id,
          dateFrom: formatDate(dates[0]),
          dateTo: formatDate(dates[1])
        }
      }, response => response.body && response.body.values && response.body.values.history && response.body.values.history.length > 0,
      message => new InvalidPreferencesError('bad request'))
    })
  }))
  console.log(responses)

  const operations = flatMap(responses, response => {
    return flatMap(response.body.values.history, op => {
      return op
    })
  })

  console.log(`>>> Загружено ${operations.length} операций.`)
  return operations
}
