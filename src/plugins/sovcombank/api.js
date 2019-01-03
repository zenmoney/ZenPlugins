import { SHA512 } from 'jshashes'
import * as _ from 'lodash'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { fetch } from '../../common/network'
import { generateRandomString, generateUUID } from '../../common/utils'

const qs = require('querystring')
const sha512 = new SHA512()

export function generateDevice () {
  return {
    id: generateUUID().toUpperCase(),
    pushUid: generateUUID().toUpperCase(),
    pushAddress: 'apn' + generateRandomString(32)
  }
}

async function callGate (url, { auth, query, body, sanitizeRequestLog, sanitizeResponseLog }) {
  const _ts = Math.round(new Date().getTime())
  let search = `?do=${url}`
  if (query || !body) {
    search += `&_nts=${auth.nts}`
    if (query) {
      search += '&' + qs.stringify(query)
    }
    search += `&_ts=${_ts}`
  }
  return fetch(`https://online.sovcombank.ru/ib.php${search}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Host': 'online.sovcombank.ru',
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Language': 'ru-RU;q=1, en-RU;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'User-Agent': 'CTBBank/1.9.2 (iPhone; iOS 10.3.3; Scale/2.00)',
      'Cookie': `ibtim=${auth.ibtim}; ibext=${auth.ibext}`
    },
    body: body ? { ...body, _ts } : null,
    stringify: qs.stringify,
    parse: JSON.parse,
    sanitizeResponseLog,
    sanitizeRequestLog: {
      ...sanitizeRequestLog,
      headers: {
        ...(sanitizeRequestLog && sanitizeRequestLog.headers && sanitizeRequestLog.headers),
        Cookie: true
      }
    }
  })
}

export async function login (device, auth) {
  let response

  if (auth && auth.uid) {
    auth.ibext = ''
    auth.ibtim = generateRandomString(12) + '_' + Math.round(new Date().getTime())

    response = await callGate('mobileLogin', {
      auth,
      body: {
        appBuild: '276',
        deviceModel: 'iPhone10,1',
        deviceName: 'iPhone',
        language: 'ru-RU',
        locale: 'ru_RU',
        push_address: device.pushAddress,
        push_uid: device.pushUid,
        systemVersion: '10.3.3',
        token: auth.token,
        uid: auth.uid,
        wrap: sha512.hex(device.id + '' + auth.token)
      },
      sanitizeRequestLog: { body: { token: true, wrap: true } },
      sanitizeResponseLog: { body: { data: true } }
    })

    if (response.body && response.body.result === 'ok' && response.body.data && response.body.data.nts) {
      auth.nts = response.body.data.nts
      auth.ibext = response.body.data.ibext
      auth.ibtim = response.body.data.ibtim
      auth.token = response.body.data.token
      return auth
    }
  }

  const phone = await ZenMoney.readLine('Введите номер телефона, c которым вы зарегистрированы в ЧатБанке. Формат: +7**********',
    { inputType: 'phone' })
  if (!phone || phone.length !== 12 || phone.charAt(0) !== '+') {
    throw new TemporaryError('Неверно введен номер телефона. Попробуйте подключить синхронизацию еще раз.')
  }

  auth = {}
  auth.ibext = ''
  auth.ibtim = generateRandomString(12) + '_' + Math.round(new Date().getTime())

  response = await callGate('getinphone', {
    auth,
    body: {
      apiname: 'getinphone',
      ibin: phone.substring(2),
      key: ''
    },
    sanitizeRequestLog: { body: { ibin: true } },
    sanitizeResponseLog: { body: { data: { first: true, ptim: true } } }
  })

  if (!response.body || response.body.result !== 'ok') {
    if (!response.body.message) {
      throw new TemporaryError('Номер телефона не зарегистрирован в ЧатБанк. Пройдите регистрацию в ЧатБанк, затем подключите синхронизацию с Совкомбанк в Дзен-мани.')
    } else if (response.body.message.indexOf('Логин введен неверно') >= 0) {
      throw new TemporaryError('Неверно введен номер телефона. Попробуйте подключить синхронизацию еще раз.')
    } else {
      throw new TemporaryError(`Во время синхронизации произошла ошибка.\n\nСообщение от банка: ${response.body.message}`)
    }
  }

  const code = await ZenMoney.readLine('Введите код из SMS для входа в Совкомбанк', { inputType: 'number' })

  const key = response.body.data.first
  const ptim = response.body.data.ptim
  const ibin = sha512.hex(code + ptim)

  response = await callGate('getses', {
    auth,
    body: {
      appBuild: '276',
      deviceId: device.id,
      deviceModel: 'iPhone10,1',
      deviceName: 'iPhone',
      ibin,
      key,
      language: 'ru-RU',
      locale: 'ru_RU',
      push_address: device.pushAddress,
      push_uid: device.pushUid,
      systemVersion: '10.3.3'
    },
    sanitizeRequestLog: { body: { deviceId: true, ibin: true, key: true } },
    sanitizeResponseLog: { body: { data: { nts: true, second: true }, token: true } }
  })

  if (!response.body || response.body.result !== 'ok') {
    if (!response.body.message || response.body.message.indexOf('Неверный одноразовый код') >= 0) {
      throw new TemporaryError('Вы ввели неверный код из SMS. Повторите подключение синхронизации.')
    }
    throw new TemporaryError(`Во время синхронизации произошла ошибка.\n\nСообщение от банка: ${response.body.message}`)
  }

  auth.nts = response.body.data.nts
  auth.ibext = response.body.data.second
  auth.token = response.body.token

  return auth
}

export async function fetchAccounts (auth) {
  const sanitizeResponseLog = {
    body: {
      data: {
        options: true,
        accounts: {
          bank: true,
          ownerName: true,
          ownerNameEng: true,
          ownerAddress: true,
          ownerAddressEng: true,
          abs_i: true,
          abs_o: true,
          abs_f: true
        }
      }
    }
  }
  const responses = await Promise.all([
    // callGate('accountsList', { auth, sanitizeResponseLog, query: { how: 'back' } }),
    callGate('accountsList', { auth, sanitizeResponseLog, query: { how: 'rbs' } }),
    callGate('accountsList', { auth, sanitizeResponseLog, query: { how: 'xxi' } })
  ])
  return _.flatMap(responses, response => {
    if (response.body.data.uid) {
      auth.uid = response.body.data.uid
    }
    return response.body.data.accounts
  })
}

export async function fetchTransactions (auth, accountId, fromDate, toDate) {
  const response = await callGate('trans', {
    auth,
    query: {
      account: accountId,
      begin: formatDate(fromDate),
      end: formatDate(toDate)
    }
  })
  return response.body.data.trans
}

function formatDate (date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join('.')
}
