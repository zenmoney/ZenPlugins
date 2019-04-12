import { fetchJson } from '../../common/network'
import { defaultsDeep, flatMap } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { getDate } from './converters'

const baseUrl = 'https://insync2.alfa-bank.by/mBank256/v5/'

/**
 * @return {string}
 */
function DeviceID () {
  let deviceID = ZenMoney.getData('deviceID', generateRandomString(8) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(12))
  ZenMoney.setData('deviceID', deviceID)
  return deviceID
}

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      headers: {
        'X-Client-App': 'Android/5.4.1',
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'okhttp/3.12.0'
      }
    }
  )
  const response = await fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

/* function cookies (response) {
  if (response.headers) {
    const cookies = response.headers['set-cookie']
    if (cookies) {
      const requiredValues = /(JSESSIONID=[^;]*;).*(TS[^=]*=[^;]*;)/
      return requiredValues.exec(cookies).slice(1).join(';')
    } else {
      return cookies
    }
  } else {
    return '' // tests not mocking headers, ignoring
  }
} */

export async function login () {
  let deviceID = DeviceID()
  let token = ZenMoney.getData('token')
  let sessionID = await checkDeviceStatus(deviceID)
  if (sessionID === null) {
    await authWithPassportID(deviceID)
    let auth = authConfirm(deviceID)
    token = auth.token
    sessionID = auth.sessionID
  } else if (!await loginByToken(sessionID, deviceID, token)) {
    console.log('something went wrong')
  }
  return {
    deviceID: deviceID,
    sessionID: sessionID
  }
}

export async function checkDeviceStatus (deviceID) {
  let res = (await fetchApiJson('CheckDeviceStatus?locale=ru', {
    method: 'POST',
    body: {
      deviceId: deviceID,
      locale: 'ru'
    },
    sanitizeRequestLog: { body: { deviceId: true } }
  }, response => response.status, message => new InvalidPreferencesError('bad request')))

  if (res.body.status === 'ACTIVE') {
    return res.body.sessionId
  }
  return null
}

export async function authWithPassportID (deviceID) {
  let passportID = await ZenMoney.readLine('Введите идентификационный номер паспорта (3111111A111PB1)', {
    inputType: 'string',
    time: 120000
  })
  if (passportID === '') {
    throw new TemporaryError('Не введен идентификационный номер пасспорта, синхронизация прервана')
  }
  let res = (await fetchApiJson('Authorization?locale=ru', {
    method: 'POST',
    body: {
      deviceId: deviceID,
      locale: 'ru',
      deviceName: 'ZenMoney Plugin',
      isResident: true,
      login: passportID,
      screenHeight: 1794,
      screenWidth: 1080
    },
    sanitizeRequestLog: { body: { deviceId: true, login: login } }
  }, response => response.status, message => new InvalidPreferencesError('bad request')))
  if (res.body.status !== 'OK' && res.body.message) {
    throw new TemporaryError('Ответ банка:' + res.body.message)
  }

  return true
}

export async function authConfirm (deviceID) {
  let sms = await ZenMoney.readLine('Код из смс', {
    inputType: 'number',
    time: 120000
  })
  if (sms === '') {
    throw new TemporaryError('Не введен код из смс, синхронизация прервана')
  }
  let res = (await fetchApiJson('AuthorizationConfirm?locale=ru', {
    method: 'POST',
    body: {
      deviceId: deviceID,
      otp: sms,
      tokenType: 'PIN'
    },
    sanitizeRequestLog: { body: { deviceId: true } }
  }, response => response.status, message => new InvalidPreferencesError('bad request')))
  if (res.body.status !== 'OK' && res.body.message) {
    throw new TemporaryError('Ответ банка:' + res.body.message)
  }
  ZenMoney.setData('token', deviceID)

  return {
    sessionID: res.body.sessionId,
    token: res.body.token
  }
}

export async function loginByToken (sessionID, deviceID, token) {
  let res = (await fetchApiJson('LoginByToken', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID,
      'Cookie': 'JSESSIONID=' + sessionID + '.node_mb3'
    },
    body: {
      deviceId: deviceID,
      token: token,
      tokenType: 'PIN'
    },
    sanitizeRequestLog: { body: { deviceId: true, token: true } }
  }, response => response.status, message => new InvalidPreferencesError('bad request')))
  if (res.body.message) {
    throw new Error('Ответ банка:' + res.body.message)
  }

  return res.body.status === 'OK'
}

export async function fetchAccounts (deviceID, sessionID) {
  console.log('>>> Загрузка списка счетов...')
  let res = (await fetchApiJson('Desktop', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      deviceId: deviceID
    },
    sanitizeRequestLog: { body: { deviceId: true } }
  }, response => response.status, message => new InvalidPreferencesError('bad request')))
  if (res.body.shortcuts && res.body.shortcuts.length > 0) {
    return res.body.shortcuts
  }
  return []
}

export async function fetchAccountInfo (sessionID, accountId) {
  console.log('>>> Загрузка списка счета ' + accountId)
  let res = (await fetchApiJson('Account/Info', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      id: accountId,
      operationSource: 'DESKTOP'
    }
  }, response => response.status, message => new InvalidPreferencesError('bad request')))
  if (res.body.iban) {
    return res.body
  }
  throw new Error('Ответ банка:' + res.body.message)
}

function formatDate (date) {
  return date.toISOString().replace('T', ' ').split('.')[0]
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
      return fetchApiJson('product/loadOperationStatements', {
        method: 'POST',
        headers: { 'Cookie': sessionCookies },
        body: {
          contractCode: account.id,
          accountIdenType: account.productType,
          startDate: formatDate(dates[0]),
          endDate: formatDate(dates[1]),
          halva: false
        }
      }, response => response.body && response.body.data)
    })
  }))

  const operations = flatMap(responses, response => {
    return flatMap(response.body.data, d => {
      return d.operations.map(op => {
        op.accountId = d.accountId
        return op
      })
    })
  })

  const filteredOperations = operations.filter(function (op) {
    return op.status !== 'E' && getDate(op.transDate) > fromDate && !op.description.includes('Гашение кредита в виде "овердрафт" по договору')
  })

  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
  return filteredOperations
}
