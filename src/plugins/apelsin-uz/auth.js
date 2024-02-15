import { fetchJson } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { InvalidPreferencesError } from '../../errors'

const baseUrl = 'https://id.uzum.uz/api'
const apelsinApiBaseUrl = 'https://mobile.apelsin.uz/api'
const userAgent = 'Uzum/Bank/Android/1.13.7(363); com.android.vending; (samsung; SM-G991B; SDK 33; Android 13)'
const deviceName = 'ZenMoney'
const defaultHeaders = {
  'User-Agent': userAgent,
  'accept-encoding': 'gzip',
  'accept-language': 'ru,ru-RU;q=0.9'
}

export class AuthError {}

export async function coldAuth (preferences) {
  await getAuthApiToken()
  await registerDevice()
  await sendSmsCode(preferences.phone, preferences.password)

  const maxSmsCheckAttempts = 3
  let smsCheckAttemps = 0
  let smsVerified = false
  do {
    smsCheckAttemps++
    try {
      const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения')
      await validateSmsCode(smsCode)
      smsVerified = true
    } catch (e) {
      console.error('SMS code validation failed', e)
    }
  } while (!smsVerified && smsCheckAttemps < maxSmsCheckAttempts)

  await validatePassword(preferences.password)

  console.info('saving tokens after successful auth routine')
  ZenMoney.setData('isFirstRun', false)
  ZenMoney.saveData()
}

async function getAuthApiToken () {
  const endpoint = '/auth/token'
  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: defaultHeaders
  })

  console.assert(response.ok, 'unexpected auth token response', response)

  ZenMoney.setData('authAccessToken', response.headers['x-access-token'])
}

/**
 * Регистрирует идентификатор устройства в интернет-банке
 */
async function registerDevice () {
  const endpoint = '/device/register'
  const deviceId = generateRandomString(16)
  const response = await fetchJson(apelsinApiBaseUrl + endpoint, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + ZenMoney.getData('authAccessToken')
    },
    body: {
      deviceId,
      name: deviceName,
      isEmulator: false,
      isRooted: false
    },
    sanitizeRequestLog: { body: { deviceId: true } }
  })

  console.assert(response.ok, 'unexpected device response', response)

  ZenMoney.setData('deviceId', deviceId)
}

/**
 * Вызвать отправку СМС кода на мобильный телефон
 *
 * @param phone номер телефона
 */
async function sendSmsCode (phone) {
  const endpoint = '/auth/phone'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('authAccessToken') // TODO possible Content-Type
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    body: {
      phone: getPhoneNumber(phone)
    },
    sanitizeRequestLog: { body: { phone: true }, headers: { authorization: true } }
  })

  if (response.body?.errorMessage === 'Пользователь не зарегистрирован' || response.body?.baseError?.message === 'Неправильный номер телефона') {
    throw new InvalidPreferencesError()
  }

  console.assert(response.ok, 'unexpected login response', response)
}

/**
 * Получаем токен
 *
 * @param smsCode код подтверждения из СМС сообщения
 */
async function validateSmsCode (smsCode) {
  const endpoint = '/auth/verify'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('authAccessToken') // TODO possible Content-Type
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    body: {
      code: smsCode
    },
    sanitizeRequestLog: { headers: { authorization: true } },
    sanitizeResponseLog: { headers: { 'x-access-token': true, 'x-refresh-token': true } }
  })

  if (response.body?.baseError?.code === 'otp_challenge_failed') {
    throw new InvalidPreferencesError()
  }

  console.assert(response.ok, 'unexpected registration/verify response', response)

  ZenMoney.setData('authAccessToken', response.headers['x-access-token'])
}

/**
 * Получаем access токен
 *
 * @param password пароль
 */
async function validatePassword (password) {
  const endpoint = '/auth/password'
  const requestHeaders = {
    authorization: 'Bearer ' + ZenMoney.getData('authAccessToken') // TODO possible Content-Type
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    body: {
      password
    },
    sanitizeRequestLog: { headers: { authorization: true } },
    sanitizeResponseLog: { headers: { 'x-access-token': true, 'x-refresh-token': true } }
  })

  if (response.body?.errorMessage === 'Пользователь не зарегистрирован' || response.body?.errorMessage === 'Неверный SMS-код') {
    throw new InvalidPreferencesError()
  }

  console.assert(response.ok, 'unexpected password validate response', response)
  ZenMoney.setData('apiAccessToken', response.headers['x-access-token'])
  ZenMoney.setData('authRefreshToken', response.headers['x-refresh-token'])
}

/**
 * Пробуем обновить access токен
 */
export async function refreshToken (refreshToken) {
  const endpoint = '/auth/token'
  const requestHeaders = {
    'x-refresh-token': refreshToken
  }

  const response = await fetchJson(baseUrl + endpoint, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      ...requestHeaders
    },
    sanitizeRequestLog: { headers: { 'x-refresh-token': true } },
    sanitizeResponseLog: { headers: { 'x-access-token': true, 'x-refresh-token': true } }
  })

  console.assert(response.ok, 'unexpected refresh token response', response)
  ZenMoney.setData('apiAccessToken', response.headers['x-access-token'])
  ZenMoney.setData('authRefreshToken', response.headers['x-refresh-token'])
  ZenMoney.saveData()
}

/**
 * Нормализация номера телефона
 *
 * @param rawPhoneNumber номер телефона, предоставленный пользователем
 * @returns 12-значный номер телефона в формате 998901234567
 */
function getPhoneNumber (rawPhoneNumber) {
  const normalizedPhoneNumber = /^(?:\+?998)(\d{9})$/.exec(rawPhoneNumber.trim())

  if (normalizedPhoneNumber) {
    return '998' + normalizedPhoneNumber[1]
  }

  throw new InvalidPreferencesError()
}
