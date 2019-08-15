import { SHA1 } from 'jshashes'
import { defaultsDeep } from 'lodash'
import { stringify } from 'querystring'
import { changeTimezoneToCurrent, toISODateString } from '../../common/dateUtils'
import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { parseDate } from './converters'

const sha1 = new SHA1()

const DOMAIN = 'api1.open.ru'
const API_VERSION = '2-40'
const BASE_URL = `https://${DOMAIN}/np/${API_VERSION}/`

async function callGate (url, options = {}) {
  let headers = {
    ...options.body && { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    'Host': DOMAIN,
    'Connection': 'Keep-Alive',
    'User-Agent': 'okhttp/3.12.3',
    ...options.headers
  }
  if (!/^https?:\/\//.test(url)) {
    url = `${BASE_URL}${url}`
    headers = {
      ...headers,
      'X-Client-Type': 'mobile',
      'X-Client-Version': 'a2.32.1 (551)'
    }
  }
  return fetchJson(url, {
    method: 'POST',
    stringify,
    parse: JSON.parse,
    ...options,
    headers,
    sanitizeRequestLog: defaultsDeep({ headers: { Cookie: true } }, options && options.sanitizeRequestLog)
  })
}

export async function login (auth, preferences) {
  if (auth) {
    auth = {
      pinCode: auth.pincode || auth.pinCode,
      installId: auth.installid || auth.installId,
      deviceId: auth.deviceid || auth.deviceId
    }
    if (!auth.pinCode || !auth.installId || !auth.deviceId) {
      auth = null
    } else {
      auth = await authWithPin(auth)
    }
  }
  if (!auth) {
    auth = await authDevice(auth, preferences)
    auth = await authWithPin(auth)
  }
  console.assert(auth, 'unexpected auth state')
  return auth
}

async function authDevice (auth, preferences) {
  console.log('>>> Требуется привязка приложения')
  let cardNumber = (preferences.cardNumber || await ZenMoney.readLine('Введите номер карты банка Открытие', { inputType: 'number', time: 180000 }))
  if (cardNumber) {
    cardNumber = cardNumber.replace(/\s+/g, '')
  }
  if (!cardNumber || !/\d{16}/.test(cardNumber)) {
    throw new InvalidPreferencesError('Номер карты должен состоять из 16 цифр')
  }

  const deviceId = generateRandomString(16)
  let response = await callGate(`https://${DOMAIN}/${API_VERSION}/auth/card`, {
    body: {
      'card_no': cardNumber,
      'device_info': deviceInfo(deviceId)
    },
    sanitizeRequestLog: { body: { card_no: true } },
    sanitizeResponseLog: { body: { data: { phone: true } } }
  })
  if (response.body.error && response.body.error.code === 503) {
    throw new InvalidPreferencesError('Неверный номер карты')
  }

  console.assert(response.body.data && response.body.data.phone && !response.body.error, 'Ошибка запроса СМС-кода')

  console.log('>>> Запрашиваем код из СМС...')
  const smsCode = await ZenMoney.readLine('Введите код из SMS, отправленный на номер ' + response.body.data.phone, { inputType: 'number', time: 60000 })
  if (!smsCode || smsCode.length !== 5) {
    throw new TemporaryError('SMS-код должен состоять из 5 цифр')
  }
  response = await callGate(`https://${DOMAIN}/${API_VERSION}/auth/tempcode`, {
    body: {
      'attempt_id': response.body.data.attempt_id,
      'code': smsCode
    },
    sanitizeResponseLog: { body: { data: { access_token: true, install_id: true, user_info: true } } }
  })
  if (response.body.error && response.body.error.code === 400) {
    throw new TemporaryError('Неверный код из SMS. Повторите подключение синхронизации ещё раз.')
  }
  console.assert(response.body.data && response.body.data.access_token && response.body.data.install_id && !response.body.error, 'Ошибка при проверке СМС-кода')

  const { access_token: accessToken, install_id: installId } = response.body.data

  console.log('accessToken', accessToken)

  await ZenMoney.setCookie(DOMAIN, 'access_token', accessToken)

  console.log('>>> Генерируем PIN-код...', 'auth_device')
  const pinCode = sha1.hex(Math.random().toString() + '_' + deviceId)
  response = await callGate(`https://${DOMAIN}/${API_VERSION}/auth/pin`, {
    body: {
      'pin_code': pinCode,
      'device_info': deviceInfo(deviceId)
    },
    sanitizeRequestLog: { body: { pin_code: true } }
  })
  console.assert(response.body.data && response.body.data === 'success' && !response.body.error, 'Ошибка при сохранении PIN-кода')

  return {
    deviceId,
    installId,
    pinCode
  }
}

async function authWithPin (auth) {
  console.log('>>> Авторизация по PIN-коду')

  await ZenMoney.setCookie(DOMAIN, 'access_token', null)
  await ZenMoney.setCookie(DOMAIN, 'at', null)

  let response = await callGate('sso/oauth2/access_token?realm=/customer&service=dispatcher&client_id=mobilebank&form_type=pin&client_secret=password&grant_type=urn:roox:params:oauth:grant-type:m2m')
  console.assert(response.body && response.body.execution, 'unexpected execution response')
  const execution = response.body.execution

  response = await callGate('sso/oauth2/access_token?_eventId=next&realm=/customer&service=dispatcher&client_id=mobilebank&form_type=pin&client_secret=password&grant_type=urn:roox:params:oauth:grant-type:m2m', {
    body: {
      execution,
      install_id: auth.installId,
      pin_code: auth.pinCode,
      device_info: deviceInfo(auth.deviceId)
    },
    sanitizeRequestLog: { body: { install_id: true, pin_code: true } },
    sanitizeResponseLog: { body: { JWTToken: true, access_token: true, refresh_token: true, old_token: true, user_info: true } }
  })

  if (response.body.access_token) {
    await ZenMoney.setCookie(DOMAIN, 'at', response.body.access_token)
    return auth
  }

  return null
}

export async function fetchAccounts () {
  const urls = [
    'api/v1.3/card/product/card/',
    'api/v1.2/credit/product/credit/list/',
    'api/v1.0/deposit/product/deposit/list/',
    'api/v1.0/account/product/account/accumulation/list/',
    'api/v1.0/account/product/account/metal/list/',
    'api/v1.0/account/product/account/current/list/'
  ]
  const accounts = []
  await Promise.all(urls.map(async url => {
    const response = await callGate(url, { method: 'GET' })
    console.assert(response.body && Array.isArray(response.body.data) && response.body.success === true, `unexpected ${url} response`, response)
    accounts.push(...response.body.data)
  }))
  return accounts
}

export async function fetchTransactions ({ id, type }, fromDate, toDate) {
  console.log(`>>> Запрашиваем операции по счёту ${type} #${id}...`)
  console.assert(type === 'card', 'only card transactions supported')

  const transactions = []
  const limit = 20
  const fromDateStr = toISODateString(changeTimezoneToCurrent(fromDate, 180))
  const toDateStr = toISODateString(changeTimezoneToCurrent(toDate, 180))

  let page = 0
  while (true) {
    page++
    const response = await callGate(`api/v1.3/card/transactions/?cardIds=${id}&dts=${fromDateStr}&dtf=${toDateStr}&count=${limit}&pageNum=${page}`, { method: 'GET' })
    console.assert(response.body && response.body.data && Array.isArray(response.body.data.transactions), 'unexpected transactions response', response)
    const batch = response.body.data.transactions.filter(transaction => parseDate(transaction.authDate).getTime() >= fromDate.getTime())
    transactions.push(...batch)
    if (batch.length < limit) {
      break
    }
  }
  return transactions
}

function deviceInfo (imei) {
  return JSON.stringify({
    'device_id': imei,
    'device_locale': 'ru',
    'device_os_version': '8.0.0',
    'device_root': '0',
    'app_version': '551',
    'device_os': '2'
  })
}
