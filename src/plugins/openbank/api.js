import { fetchJson } from '../../common/network'
import { TemporaryError } from '../../errors'
import { imeiGeneration } from './imei_gen'
import { SHA1 } from 'jshashes'
import _ from 'lodash'

const qs = require('querystring')
const sha1 = new SHA1()

const DEFAULT_HEADERS = {
  'User-Agent': 'okhttp/3.4.2',
  'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
}
const DOMAIN = 'api1.open.ru'
const BASE_URL = `https://${DOMAIN}/2-37/`

export async function login (auth, preferences) {
  let newDevice = false
  if (!auth.pincode || !auth.installid || !auth.deviceid) {
    auth = await authDevice(auth, preferences)
    newDevice = true
  }
  auth = await authWithPin(auth, newDevice)
  return auth
}

async function authDevice (auth, preferences) {
  console.log('>>> Требуется привязка приложения')
  let cardNumber = (preferences.cardNumber || await ZenMoney.readLine('Введите номер карты банка Открытие', { inputType: 'number', time: 180000 }))
  if (cardNumber) {
    cardNumber = cardNumber.replace(/\s/g, '')
  }
  if (!cardNumber || !/\d{16}/.test(cardNumber)) {
    throw new InvalidPreferencesError('Номер карты должен состоять из 16 цифр', true, true)
  }
  const deviceid = imeiGeneration()
  let response = await fetchApiJson('auth/card', {
    get: {
      'card_no': cardNumber,
      'device_info': deviceInfo(deviceid)
    },
    sanitizeRequestLog: { url: true }
  })
  if (response.body.error || !response.body.data) {
    throw new Error('Ошибка запроса СМС-кода')
  }

  console.log('>>> Запрашиваем код из СМС...')
  const smsCode = await ZenMoney.readLine('Введите код из СМС, отправленный на номер ' + response.body.data.phone, { inputType: 'number', time: 60000 })
  if (!smsCode || smsCode.length !== 5) {
    throw new TemporaryError('СМС-код должен состоять из 5 цифр')
  }
  response = await fetchApiJson('auth/tempcode', {
    get: {
      'attempt_id': response.body.data.attempt_id,
      'code': smsCode
    }
  })
  if (response.body.error || !response.body.data) {
    throw new Error('Ошибка при проверке СМС-кода')
  }
  const accesstoken = response.body.data.access_token
  const installid = response.body.data.install_id

  await ZenMoney.setCookie(DOMAIN, 'access_token', accesstoken)

  console.log('>>> Генерируем PIN-код...', 'auth_device')
  const pincode = sha1.hex(Math.random().toString() + '_' + deviceid)
  response = await fetchApiJson('auth/pin', {
    get: {
      'pin_code': pincode,
      'device_info': deviceInfo(deviceid)
    },
    sanitizeRequestLog: { headers: { Cookie: true } }
  })
  if (response.body.error || !response.body.data || response.body.data !== 'success') {
    throw new Error('Ошибка при сохранении PIN-кода')
  }

  auth.pincode = pincode
  auth.installid = installid
  auth.deviceid = deviceid

  return auth
}

async function authWithPin (auth, newDevice) {
  console.log('>>> Авторизация по PIN-коду')

  if (newDevice) {
    await ZenMoney.setCookie(DOMAIN, 'access_token', null)
  }

  let response = await fetchApiJson('auth/login', {
    get: {
      'pin_code': auth.pincode,
      'device_info': deviceInfo(auth.deviceid),
      'install_id': auth.installid
    },
    sanitizeRequestLog: { url: true },
    sanitizeResponseLog: { body: { data: { access_token: true, user_info: { full_name: true, phone: true, pseudonym: true } } } }
  })
  if (response.body.error || !response.body.data.access_token) {
    throw new Error('Ошибка при авторизации по PIN-коду')
  }

  await ZenMoney.setCookie(DOMAIN, 'access_token', response.body.data.access_token)

  return auth
}

export async function fetchAccounts () {
  console.log('>>> Запрашиваем информацию по счетам...')
  let response = await fetchApiJson('accounts',
    {
      method: 'GET',
      get: {
        'use_cached_data': 0
      },
      sanitizeRequestLog: { headers: { Cookie: true } }
    },
    response => _.get(response, 'body.data.account_list')
  )
  return response.body.data.account_list
}

export async function fetchTransactions (accountId, fromDate) {
  console.log(`>>> Запрашиваем операции по счёту #${accountId}...`)
  let response = await fetchApiJson(`accounts/${accountId}/transactions`,
    {
      method: 'GET',
      get: {
        'date_start': fromDate.toISOString()
      },
      sanitizeRequestLog: { headers: { Cookie: true } }
    },
    response => _.get(response, 'body.data.transaction_list')
  )
  return response.body.data.transaction_list
}

async function fetchApiJson (url, options, predicate) {
  let getParams = ''
  const headers = {
    ...DEFAULT_HEADERS,
    ...options.headers
  }

  const fetchOptions = {
    method: 'POST',
    headers,
    // sanitizeRequestLog: _.merge(options.sanitizeRequestLog, { headers: { 'Authorization': true, 'X-Device-ID': true, 'X-Sig': true } }),
    ..._.omit(options, [ 'ignoreErrors', 'headers', 'get' ])
  }
  if (options.get) {
    getParams = '?' + qs.stringify(options.get)
  }

  let response
  try {
    response = await fetchJson(BASE_URL + url + getParams, fetchOptions)
  } catch (e) {
    if (e.response && e.response.status >= 500 && e.response.status < 525) {
      throw new TemporaryError(`Информация из банка Открытие временно недоступна. Повторите синхронизацию через некоторое время.

Если ошибка #${e.response.status} будет повторяться несколько дней, откройте Настройки синхронизации и нажмите "Отправить лог синхронизации разработчикам".`)
    } else if (!options.ignoreErrors) {
      throw new Error(`Ошибка #${e.response.status}: ${e.response.description}`)
    } else {
      // throw new Error()
      return response
    }
  }

  if (response.body && response.body.error) {
    const message = response.body.error.error_message || 'Ошибка обращения по адресу: ' + url
    switch (response.body.error.code) {
      case 400: // не правильный СМС-код
      case 401: // сессия устарела
        throw new TemporaryError(message)

      case 405:
        throw new Error(message)
    }
  }

  if (predicate) {
    console.assert(!predicate || predicate(response), `Некорректный ответ запроса по адресу '${url}'`)
  }

  return response
}

function deviceInfo (imei) {
  return JSON.stringify({
    'device_id': imei,
    'device_locale': 'ru',
    'device_os_version': '6.0.1',
    'device_root': '0',
    'app_version': '311',
    'device_os': '2'
  })
}
