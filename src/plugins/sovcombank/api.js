import { SHA512 } from 'jshashes'
import * as _ from 'lodash'
import { toAtLeastTwoDigitsString } from '../../common/dates'
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

async function callGate (url, { auth, query, body }) {
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
    parse: JSON.parse
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
      }
    })

    auth.nts = response.body.data.nts
    auth.ibext = response.body.data.ibext
    auth.ibtim = response.body.data.ibtim
    auth.token = response.body.data.token

    return auth
  }

  const phone = await ZenMoney.readLine('Введите номер телефона для входа в Совкомбанк. Формат: +79211234567',
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
    }
  })

  if (!response.body || response.body.result !== 'ok') {
    if (!response.body.message || response.body.message.indexOf('Логин введен неверно') >= 0) {
      throw new TemporaryError('Неверно введен номер телефона. Попробуйте подключить синхронизацию еще раз.')
    }
    throw new TemporaryError(`Во время синхронизации произошла ошибка.\n\nСообщение от банка: ${response.body.message}`)
  }

  const code = await ZenMoney.readLine('Введите код из SMS для входа в Совкобанк', { inputType: 'number' })

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
    }
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
  const responses = await Promise.all([
    callGate('accountsList', { auth, query: { how: 'back' } }),
    callGate('accountsList', { auth, query: { how: 'rbs' } }),
    callGate('accountsList', { auth, query: { how: 'xxi' } })
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
