import { SHA512 } from 'jshashes'
import * as _ from 'lodash'
import { fetch } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateRandomString } from '../../common/utils'

const qs = require('querystring')
const sha512 = new SHA512()

export function generateDevice () {
  return {
    id: generateRandomString(128),
    pushUid: '-37280bc' + generateRandomString(35),
    pushAddress: 'gcm' + generateRandomString(31)
  }
}

async function callGate (url, { auth, query, body, sanitizeRequestLog, sanitizeResponseLog, json = true }) {
  if (url.indexOf('http') !== 0) {
    let search = `?do=${url}`
    if (query || !body) {
      search += `&_nts=${auth.nts}`
      if (query) {
        search += '&' + qs.stringify(query)
      }
    }
    url = `https://online.sovcombank.ru/ib.php${search}`
  }
  return fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Host': 'online.sovcombank.ru',
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip',
      'Connection': 'Keep-Alive',
      'User-Agent': 'CTBBank Sovcombank androidapp Unknown_Android_SDK_built_for_x86|5.0.2 native|2.2.8',
      'Cookie': `ABibStyle=White1; ibtim=${auth.ibtim}; ibext=${auth.ibext}`
    },
    body: body || null,
    stringify: qs.stringify,
    parse: json ? JSON.parse : null,
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

function generateTimestamp () {
  return generateRandomString(12, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') + '_' + Math.round(new Date().getTime())
}

export async function login (device, auth) {
  let response

  if (auth && auth.uid) {
    auth.ibext = ''
    auth.ibtim = generateTimestamp()

    response = await callGate('mobileLogin', {
      auth,
      body: {
        appBuild: '2.2.8',
        deviceModel: 'generic_x86',
        deviceName: 'Android SDK built for x86',
        push_address: device.pushAddress,
        push_uid: device.pushUid,
        systemVersion: '5.0.2',
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

  const ibtim = generateTimestamp()
  auth = {}
  auth.ibext = ''
  auth.ibtim = ibtim

  const keysrc = generateTimestamp()
  await callGate(`https://online.sovcombank.ru/ab/abkey.php?fg=255,255,255&bg=0,144,255&set=num&key=${keysrc}&_nts=`, {
    json: false,
    auth: {
      ibext: '',
      ibtim
    }
  })

  const login = await ZenMoney.readLine('Введите логин, c которым вы зарегистрированы в ЧатБанке.')
  if (!login) {
    throw new TemporaryError('Неверно введен логин. Попробуйте подключить синхронизацию еще раз.')
  }

  response = await callGate('getin', {
    auth,
    body: {
      ibin: login,
      key: '',
      keysrc
    },
    sanitizeRequestLog: { body: { ibin: true } },
    sanitizeResponseLog: { body: { data: { first: true, ptim: true } } }
  })

  if (!response.body || response.body.result !== 'ok') {
    if (!response.body.message) {
      throw new TemporaryError('Логин не зарегистрирован в ЧатБанк. Пройдите регистрацию в ЧатБанк, затем подключите синхронизацию с Совкомбанк в Дзен-мани.')
    } else if (response.body.message.indexOf('Логин введен неверно') >= 0) {
      throw new TemporaryError('Логин введен неверно. Попробуйте подключить синхронизацию еще раз.')
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
      appBuild: '2.2.8',
      deviceId: device.id,
      deviceModel: 'generic_x86',
      deviceName: 'Android SDK built for x86',
      ibin,
      key,
      push_address: device.pushAddress,
      push_uid: device.pushUid,
      systemVersion: '5.0.2'
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
