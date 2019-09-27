import { fetchJson } from '../../common/network'
import { defaultsDeep, get } from 'lodash'
import { generateRandomString } from '../../common/utils'
import { parseDate } from './converters'

export const baseUrl = 'https://insync2.alfa-bank.by/mBank256/v6/'

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
        'X-Client-App': 'Android/5.6.1',
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'okhttp/3.12.0'
      }
    }
  )
  const response = await fetchJson(baseUrl + url, options)
  if (response.body.message && [
    'Мы заблокировали приложение',
    'Система недоступна',
    'Для входа нужно сменить пароль'
  ].some(str => response.body.message.indexOf(str) >= 0)) {
    throw new TemporaryError('Ответ банка: ' + response.body.message)
  }
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
  const deviceID = DeviceID()
  const token = ZenMoney.getData('token')
  let sessionID = await checkDeviceStatus(deviceID)
  if (sessionID === null || !await loginByToken(sessionID, deviceID, token)) {
    if (isResident) {
      await authWithPassportBY(deviceID)
    } else {
      await authNoResident(deviceID)
    }

    sessionID = await authConfirm(deviceID)
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
  }, response => response.status, message => new Error('bad request')))

  switch (res.body.status) {
    case 'ACTIVE':
      return res.body.sessionId
    case 'LOCKED':
      throw new Error(res.body.message)
    default:
      return null
  }
}

export async function authWithPassportBY (deviceID) {
  let passportID = await ZenMoney.readLine('Введите номер белорусского паспорта (Формат: 3111111A111PB1)', {
    inputType: 'string',
    time: 120000
  })
  if (!passportID) {
    throw new TemporaryError('Не введён номер паспорта. Подключите синхронизацию ещё раз и укажите номер паспорта.')
  }
  if (passportID.toLocaleUpperCase().search(/[0-9]{7}[AА][0-9]{3}[PBРВ][0-9]/i) !== -1) { // латиница и кирилица
    throw new TemporaryError('Иденцификационный номер паспорта введен не верно. Попробуйте еще раз.')
  }
  let body = {
    deviceId: deviceID,
    deviceName: 'ZenMoney Plugin',
    isResident: true,
    login: passportID.toLocaleUpperCase(),
    screenHeight: 1794,
    screenWidth: 1080
  }
  let res = (await fetchApiJson('Authorization?locale=ru', {
    method: 'POST',
    body: body,
    sanitizeRequestLog: { body: { deviceId: true, documentNum: true, issueDate: true } }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.status !== 'OK') {
    throw new TemporaryError('Ответ банка: ' + res.body.message)
  }

  return true
}

export async function authNoResident (deviceID) {
  let passportID = await ZenMoney.readLine('Введите номер паспорта', {
    inputType: 'string',
    time: 120000
  })
  if (!passportID) {
    throw new TemporaryError('Не введён номер паспорта. Подключите синхронизацию ещё раз и укажите номер паспорта.')
  }
  let issueDate = await ZenMoney.readLine('Введите дату выдачи документа (Формат: ГГГГММДД)', {
    inputType: 'string',
    time: 120000
  })
  let body = {
    deviceId: deviceID,
    deviceName: 'ZenMoney Plugin',
    isResident: false,
    documentNum: passportID.toLocaleUpperCase(),
    issueDate: issueDate,
    screenHeight: 1794,
    screenWidth: 1080
  }
  let res = (await fetchApiJson('Authorization?locale=ru', {
    method: 'POST',
    body: body,
    sanitizeRequestLog: { body: { deviceId: true, documentNum: true, issueDate: true } }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.status !== 'OK') {
    throw new TemporaryError('Ответ банка: ' + res.body.message)
  }

  return true
}

export async function authConfirm (deviceID) {
  let sms = await ZenMoney.readLine('Введите код из смс', {
    inputType: 'numberPassword',
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
  }, response => response.status, message => new Error('bad request')))
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
  }, response => response.status, message => new Error('bad request')))
  if (res.body.message) {
    if (![
      'Пароль введен неверно'
    ].some(str => res.body.message.indexOf(str) >= 0)) {
      throw new Error('unexpected response')
    }
  }

  return res.body.status === 'OK'
}

export async function fetchAccounts (deviceID, sessionID) {
  console.log('>>> Загрузка списка счетов...')
  // Сразу делаем обязательный запрос на рабочий стол
  await fetchApiJson('Desktop', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      deviceId: deviceID
    },
    sanitizeRequestLog: { body: { deviceId: true } },
    sanitizeResponseLog: { body: { status: { clientId: true, clientEmail: true, clientName: true, qrCodeErip: true } } }
  }, response => response.status, message => new Error('bad request'))

  let res = (await fetchApiJson('Products', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      type: 'ACCOUNT'
    }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.items && res.body.items.length > 0) {
    return res.body.items
  }
  return []
}

export async function fetchCards (sessionID) {
  console.log('>>> Загрузка списка карточек...')
  let res = (await fetchApiJson('Products', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      type: 'CARD'
    }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.items && res.body.items.length > 0) {
    return res.body.items
  }
  return []
}

export async function fetchCardDetail (sessionID, card) {
  console.log('>>> Загрузка подробностей по карте ' + card.title)
  let res = (await fetchApiJson('Card/Info', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      id: card.previousID !== null ? card.previousID : card.id,
      operationSource: 'PRODUCT'
    }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.accountNumber) {
    return res.body
  }
  return {}
}

export async function fetchLoanDetail (sessionID, card) {
  console.log('>>> Загрузка подробностей по кредиту ' + card.title)
  let res = (await fetchApiJson('Loan/Info', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      id: card.id,
      operationSource: 'PRODUCT'
    }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.accountNumber) {
    return res.body
  }
  return {}
}

export async function fetchDeposits (sessionID) {
  console.log('>>> Загрузка списка депозитов...')
  let res = (await fetchApiJson('Products', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      type: 'DEPOSIT'
    }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.items && res.body.items.length > 0) {
    return res.body.items
  }
  return []
}

export async function fetchCredits (sessionID) {
  console.log('>>> Загрузка списка кредитов...')
  let res = (await fetchApiJson('Products', {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionID
    },
    body: {
      type: 'CREDIT'
    }
  }, response => response.status, message => new Error('bad request')))
  if (res.body.items && res.body.items.length > 0) {
    return res.body.items
  }
  return []
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
      var bodyReq = {
        offset: offset,
        pageSize: limit,
        objectId: account.id,
        type: account.productType
      }
      if (account.productType === 'CARD') {
        bodyReq = {
          cardId: account.id,
          offset: offset,
          pageSize: limit
        }
      }
      let response = await fetchApiJson('History', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionID
        },
        body: bodyReq
      }, response => response.body)
      batch = getArray(get(response, 'body.items'))
      offset += limit
      transactions.push(...batch)
    } while (batch && batch.length === limit && parseDate(batch[batch.length - 1].date) >= fromDate)
    offset = 0
    batch = null
  }

  console.log(`>>> Загружено ${transactions.length} операций.`)
  return transactions
}

function getArray (object) {
  return object === null || object === undefined
    ? []
    : Array.isArray(object) ? object : [object]
}
