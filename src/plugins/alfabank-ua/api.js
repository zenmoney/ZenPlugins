import { flatten, uniqBy } from 'lodash'
import qs from 'querystring'
import { dateInTimezone, toISODateString } from '../../common/dateUtils'
import { fetch, ParseError } from '../../common/network'
import { retry, RetryError } from '../../common/retry'
import { generateRandomString } from '../../common/utils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryUnavailableError } from '../../errors'

const BASE_URL = 'https://superapp.sensebank.com.ua/mob'
const COMMON_HEADERS = {
  'Accept-Language': 'ru',
  'User-Agent': 'okhttp/4.7.2',
  'Content-Type': 'application/json; charset=UTF-8'
}
const STYLE_HEADERS = {
  'Color-Scheme': 'Light',
  'Tone-Style': 'neutral'
}
const CLIENT_SECRET = 'INSYNCsqESbcw93rwAnierurv23wR'

export function generateDevice () {
  return {
    fingerPrint: generateRandomString(32, '0123456789abcdef')
  }
}

function parseResponseBody (body) {
  if (body === '') {
    return undefined
  }
  try {
    return JSON.parse(body)
  } catch (e) {
    return body
  }
}

async function fetchApi (url, options, auth) {
  const sanitizeRequestLog = {
    ...url === '/auth' && {
      body: {
        deviceToken: true,
        fingerPrint: true,
        access_token: true,
        access_code: true,
        phoneNumber: true,
        dateOfBirth: true,
        otp: true,
        cvv: true,
        number_part: true,
        passport_issue_date: true
      }
    },
    headers: { Authorization: true },
    ...options?.sanitizeRequestLog
  }
  const sanitizeResponseLog = {
    ...url === '/auth' && { body: { access_token: true, refresh_token: true } },
    ...options?.sanitizeResponseLog
  }
  let result
  try {
    result = await retry({ // sometimes they give us html with text "loading" instead of json
      getter: async () => {
        const response = await fetch(BASE_URL + url, {
          ...options,
          headers: {
            ...auth?.accessToken && { Authorization: `Bearer ${auth.accessToken}` },
            ...COMMON_HEADERS,
            ...options?.headers
          },
          parse: parseResponseBody,
          stringify: JSON.stringify,
          sanitizeRequestLog,
          sanitizeResponseLog
        })

        if (['shortcut.error.service.call', 'access.unauthenticated', 'fail.general.error'].some(x => response.body?.code === x) ||
          ['unauthorized'].some(x => response.body?.error === x)) {
          throw new TemporaryUnavailableError()
        }

        return response
      },
      // eslint-disable-next-line camelcase
      predicate: (x) => (typeof x) !== 'string',
      maxAttempts: 2,
      delayMs: 1000
    })
  } catch (e) {
    let lastResponse
    if (e instanceof RetryError) {
      lastResponse = e.failedResults[e.failedResults.length - 1]
    } else if (e instanceof ParseError) {
      lastResponse = e.response
    }
    if ([502, 503, 504].some(x => lastResponse?.status === x)) {
      throw new TemporaryUnavailableError()
    }
    throw e
  }
  if (result.body.error_description === 'oauth.exception.client.blocked') {
    const blockedTill = new Date(parseInt(result.body.blocked_till))
    throw new BankMessageError(`Подключение заблокировано до ${blockedTill.toISOString()}`)
  }

  return result
}

function validatePreferences (rawPreferences) {
  const preferences = {
    phone: getPhoneNumber(rawPreferences.phone),
    birthDate: rawPreferences.birthDate
  }

  if (!preferences.phone) {
    throw new InvalidPreferencesError('Неправильный формат номера телефона')
  }

  if (!preferences.birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new InvalidPreferencesError('Неправильный формат даты рождения')
  }

  return preferences
}

async function askPinCode () {
  let pinCode
  while (!pinCode || !pinCode?.match(/^\d{6}$/)) {
    pinCode = await ZenMoney.readLine('Введите пин-код от приложения Альфа-Банк Sense. ' +
      'Если не помните его, придумайте новый код из шести цифр. ' +
      'Используйте этот новый пин-код для входа в приложение банка.', { inputType: 'number' })
  }
  return pinCode
}

function assertResponseCodeOk (response) {
  console.assert(response.body.code === 'OK', 'unexpected response', response)
}

function assertResponseAccessToken (response) {
  console.assert(response.body.access_token, 'unexpected response', response)
}

function getPhoneNumber (input) {
  const result = /^\+?(380\d{9})$/.exec(input.trim())

  if (result) {
    return result[1]
  }
  return null
}

async function getDeviceToken (auth) {
  const response = await fetchApi('/device/token', {
    method: 'POST',
    body: {
      fingerPrint: auth.device.fingerPrint,
      model: `${ZenMoney.device.manufacturer} ${ZenMoney.device.model}`,
      os: 'Android: 10'
    },
    sanitizeRequestLog: { body: { fingerPrint: true } },
    sanitizeResponseLog: { body: { payload: true } }
  })
  assertResponseCodeOk(response)

  return response.body.payload.deviceToken
}

async function coldAuth (preferences, auth) {
  let response = await fetchApi('/auth', {
    method: 'POST',
    body: {
      grant_type: 'password',
      factor: 'identification',
      client_id: 'mobile_app',
      client_secret: CLIENT_SECRET,
      accuracy: '0',
      latitude: '0',
      longitude: '0',
      deviceToken: auth.deviceToken,
      fingerPrint: auth.device.fingerPrint,
      phoneNumber: preferences.phone,
      dateOfBirth: preferences.birthDate
    }
  })
  if (response.body.error_description === 'oauth.exception.redirect.onboarding') {
    throw new InvalidPreferencesError('Пожалуйста, скачайте и пройдите регистрацию в новом приложении банка Sense SuperApp')
  }
  if (response.body.error_description === 'oauth.exception.client.not.found') {
    throw new InvalidLoginOrPasswordError()
  }

  assertResponseAccessToken(response)
  auth.accessToken = response.body.access_token
  response = await fetchApi('/otp/login', {
    method: 'POST',
    body: {
      key: auth.accessToken
    },
    sanitizeRequestLog: { body: { key: true } },
    sanitizeResponseLog: { body: { payload: true } }
  }, auth)
  assertResponseCodeOk(response)

  const smsCode = await ZenMoney.readLine('Введите код отправленный вам в SMS-сообщении',
    { inputType: 'number', time: response.body.payload.expiry * 1000 })

  if (!smsCode) {
    throw new InvalidOtpCodeError()
  }

  response = await fetchApi('/auth', {
    method: 'POST',
    body: {
      grant_type: 'password',
      factor: 'login_otp',
      client_id: 'mobile_app',
      client_secret: CLIENT_SECRET,
      otp: smsCode,
      access_token: auth.accessToken
    }
  })
  if (response.body.error_description === 'oauth.exception.otp.incorrect') {
    throw new InvalidOtpCodeError()
  }

  assertResponseAccessToken(response)
  auth.accessToken = response.body.access_token

  switch (response.body.scope) {
    case 'card': {
      let cardNumberPart = ''
      while (!cardNumberPart?.match(/^\d{4}$/)) {
        cardNumberPart = await ZenMoney.readLine('Введите последние 4 цифры номера карты')
      }
      let cardCvv = ''
      while (!cardCvv?.match(/^\d{3}$/)) {
        cardCvv = await ZenMoney.readLine('Введите CVV код')
      }

      response = await fetchApi('/auth', {
        method: 'POST',
        body: {
          grant_type: 'password',
          factor: 'card',
          client_id: 'mobile_app',
          client_secret: CLIENT_SECRET,
          number_part: cardNumberPart,
          cvv: cardCvv,
          access_token: auth.accessToken
        }
      })
      if (response.body.error_description === 'oauth.exception.bad.credentials') {
        throw new TemporaryError('Вы ввели неверные данные карты, проверьте и попробуйте снова')
      }
      break
    }
    case 'passport_issue_date': {
      let passportIssueDate = ''
      while (!passportIssueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        passportIssueDate = await ZenMoney.readLine('Введите дату выдачи паспорта в формате гггг-мм-дд')
      }

      response = await fetchApi('/auth', {
        method: 'POST',
        body: {
          grant_type: 'password',
          factor: 'passport_issue_date',
          client_id: 'mobile_app',
          client_secret: CLIENT_SECRET,
          passport_issue_date: passportIssueDate,
          access_token: auth.accessToken
        }
      })

      if (response.body.error_description === 'oauth.exception.bad.credentials') {
        throw new InvalidOtpCodeError('Неверная дата выдачи паспорта')
      }
      break
    }
    default:
      console.assert(false, 'unknown scope', response.body.scope)
  }

  assertResponseAccessToken(response)
  auth.accessToken = response.body.access_token
  auth.accessPin = await askPinCode()

  response = await fetchApi('/auth', {
    method: 'POST',
    body: {
      grant_type: 'password',
      factor: 'create_access_code',
      client_id: 'mobile_app',
      client_secret: CLIENT_SECRET,
      access_code: auth.accessPin,
      messageId: '',
      access_token: auth.accessToken
    }
  })
  if (response.body?.error === 'server_error') {
    throw new InvalidOtpCodeError('Неверный пин-код')
  }
  assertResponseAccessToken(response)
  auth.accessToken = response.body.access_token
  auth.refreshToken = response.body.refresh_token // idk, we don't use it
}

async function warmAuth (auth) {
  let response = await fetchApi('/auth', {
    method: 'POST',
    body: {
      grant_type: 'password',
      factor: 'device',
      client_id: 'mobile_app',
      client_secret: CLIENT_SECRET,
      accuracy: '0',
      latitude: '0',
      longitude: '0',
      deviceToken: auth.deviceToken,
      fingerPrint: auth.device.fingerPrint,
      NFC: false
    }
  })

  assertResponseAccessToken(response)
  auth.accessToken = response.body.access_token

  response = await retry({
    getter: async () => {
      const response = await fetchApi('/auth', {
        method: 'POST',
        body: {
          grant_type: 'password',
          factor: 'access_code',
          client_id: 'mobile_app',
          client_secret: CLIENT_SECRET,
          access_code: auth.accessPin,
          access_token: auth.accessToken
        }
      })
      if (response.body.error_description?.match(/oauth.exception.bad.credentials/i)) {
        auth.accessPin = await askPinCode()
      }
      return response
    },
    predicate: response => {
      if (response.body.access_token) {
        return true
      }
      if (response.body.error_description?.match(/oauth.exception.bad.credentials/i)) {
        return false
      }
      console.assert(false, 'unexpected response', response)
    },
    maxAttempts: 2,
    delayMs: 0
  })

  auth.accessToken = response.body.access_token
}

export async function login (rawPreferences, auth) {
  const preferences = validatePreferences(rawPreferences)

  if (auth.accessToken) {
    await warmAuth(auth)
  }

  if (!auth.accessToken) {
    auth.deviceToken = await getDeviceToken(auth)
    await coldAuth(preferences, auth)
  }
  return auth
}

async function fetchAccountTypeWithDetails (auth, productType) {
  const generalResponse = await fetchApi(`/shortcuts/${productType}`, {
    method: 'GET',
    headers: STYLE_HEADERS
  }, auth)
  assertResponseCodeOk(generalResponse)
  const result = uniqBy(generalResponse.body.payload.shortcuts, 'product.productId')
  return await Promise.all(result.map(async shortcut => {
    const detailsResponse = await fetchApi(`/${productType}/product/details?${qs.stringify({ productId: shortcut.product.productId })}`, {
      method: 'GET',
      headers: STYLE_HEADERS
    }, auth)
    assertResponseCodeOk(detailsResponse)
    return detailsResponse.body.payload
  }))
}

export async function fetchAccounts (auth) {
  return flatten(await Promise.all(['deposit', 'card', 'cardSME', 'credit', 'account'].map(async typeName => {
    return await fetchAccountTypeWithDetails(auth, typeName)
  })))
}

async function fetchAccountTypeTransactions (auth, productType, productId, fromDate, toDate) {
  // mob yyyy-MM-dd
  if (productType === 'card_sme') {
    const query = {
      productId,
      dateFrom: formatDate(fromDate),
      dateTo: formatDate(toDate),
      transactionType: 'all'
    }
    const response = await fetchApi(`/historySME/getall?${qs.stringify(query)}`, {
      method: 'GET',
      headers: STYLE_HEADERS
    }, auth)
    return response.body.payload
  }
  const response = await fetchApi(`/history/${productType}/getall?${qs.stringify({ productId })}`, {
    method: 'GET',
    headers: STYLE_HEADERS
  }, auth)
  assertResponseCodeOk(response)
  return response.body.payload.generalInfo
}

export async function fetchTransactions (auth, product, fromDate, toDate) {
  if (!product) {
    return []
  }
  return await fetchAccountTypeTransactions(auth, product.productType.toLowerCase(), product.productId, fromDate, toDate)
}

function formatDate (date) {
  // yyyy-MM-dd
  return toISODateString(dateInTimezone(date, 3 * 60))
}
