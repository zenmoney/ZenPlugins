import { fetchJson } from '../../common/network'
import { defaultsDeep, get } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { parseDate } from './converters'

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

export async function login (isResident) {
  let deviceID = DeviceID()
  let token = ZenMoney.getData('token')
  var sessionID = await checkDeviceStatus(deviceID)
  if (sessionID === null) {
    await authWithPassportID(deviceID, isResident)
    sessionID = await authConfirm(deviceID)
  } else if (!await loginByToken(sessionID, deviceID, token)) {
    throw new TemporaryError('Синхронизация не подключена. Попробуйте подключить ещё раз.')
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

  switch (res.body.status) {
    case 'ACTIVE':
      return res.body.sessionId
    case 'LOCKED':
      throw new InvalidPreferencesError(res.body.message)
    default:
      return null
  }
}

export async function authWithPassportID (deviceID, isResident) {
  let passportID = await ZenMoney.readLine('Введите номер паспорта (Формат: 3111111A111PB1)', {
    inputType: 'string',
    time: 120000
  })
  if (passportID === '') {
    throw new TemporaryError('Не введён номер паспорта. Подключите синхронизацию ещё раз и укажите номер паспорта.')
  }
  var body = {
    deviceId: deviceID,
    deviceName: 'ZenMoney Plugin',
    isResident: isResident,
    login: passportID.toLocaleUpperCase(),
    screenHeight: 1794,
    screenWidth: 1080
  }
  if (passportID.toLocaleUpperCase().search(/[0-9]{7}[AА][0-9]{3}[PBРВ][0-9]/i) === -1 && // латиница и кирилица
      !isResident) {
    let issueDate = await ZenMoney.readLine('Введите дату выдачи документа (Формат: ГГГГММДД)', {
      inputType: 'string',
      time: 120000
    })
    body = {
      deviceId: deviceID,
      deviceName: 'ZenMoney Plugin',
      isResident: isResident,
      documentNum: passportID.toLocaleUpperCase(),
      issueDate: issueDate,
      screenHeight: 1794,
      screenWidth: 1080
    }
  }
  let res = (await fetchApiJson('Authorization?locale=ru', {
    method: 'POST',
    body: body,
    sanitizeRequestLog: { body: { deviceId: true, login: true } }
  }, response => response.status, message => new InvalidPreferencesError('bad request')))
  if (res.body.status !== 'OK' && res.body.message) {
    var errText = 'Ответ банка: ' + res.body.message
    if (res.body.message === 'Личный номер введен неверно') {
      throw new InvalidPreferencesError(errText)
    }
    throw new Error(errText)
  }

  return true
}

export async function authConfirm (deviceID) {
  let sms = await ZenMoney.readLine('Введите код из смс', {
    inputType: 'number',
    time: 120000
  })
  if (sms === '') {
    throw new TemporaryError('Не введён код из смс. Подключите синхронизацию ещё раз.')
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
    throw new TemporaryError('Ответ банка: ' + res.body.message)
  }
  ZenMoney.setData('token', res.body.token)

  return res.body.sessionId
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
    const bankMessage = 'Ответ банка: ' + res.body.message
    if (res.body.message === 'Пароль введен неверно') {
      throw new InvalidPreferencesError(bankMessage)
    }
    throw new Error(bankMessage)
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
  throw new Error('Ответ банка: ' + res.body.message)
}

export async function fetchTransactions (sessionID, accounts, fromDate) {
  console.log('>>> Загрузка списка транзакций...')
  let transactions = []

  const limit = 10
  let offset = 0
  let batch = null

  for (let i = 0; i < accounts.length; i++) {
    let account = accounts[i]
    do {
      let response = await fetchApiJson('History', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionID
        },
        body: {
          offset: offset,
          pageSize: limit,
          shortcutId: account.id
        }
      }, response => response.body)
      batch = getArray(get(response, 'body.items'))
      offset += limit
      transactions.push(...batch)
    } while (batch && batch.length === limit && parseDate(batch[batch.length - 1].date) >= fromDate)
  }

  console.log(`>>> Загружено ${transactions.length} операций.`)
  return transactions
}

function getArray (object) {
  return object === null || object === undefined
    ? []
    : Array.isArray(object) ? object : [object]
}
