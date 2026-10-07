import { flatten, uniqBy } from 'lodash'
import qs from 'querystring'
import { dateInTimezone, toISODateString } from '../../common/dateUtils'
import { fetch } from '../../common/network'
import { retry, RetryError } from '../../common/retry'
import { generateRandomString } from '../../common/utils'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryError, UserInteractionError } from '../../errors'

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

function maskCardNumberForLog (value) {
  return typeof value === 'string' && /^\d{12,19}$/.test(value)
    ? `${value.slice(0, 6)}${'*'.repeat(value.length - 10)}${value.slice(-4)}`
    : value
}

async function fetchApi (url, options, auth) {
  const sanitizeRequestLog = {
    ...url === '/auth' && {
      body: {
        client_secret: true,
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
    ...options?.sanitizeRequestLog,
    headers: { ...options?.sanitizeRequestLog?.headers, Authorization: true, authorization: true, Cookie: true, cookie: true }
  }
  const sanitizeResponseLog = {
    headers: {
      ...options?.sanitizeResponseLog?.headers,
      authorization: true,
      Authorization: true,
      'set-cookie': true,
      'Set-Cookie': true
    },
    body: url === '/device/token'
      ? true
      : {
          ...options?.sanitizeResponseLog?.body,
          ...url === '/auth' && { access_token: true, refresh_token: true, firstName: true, photoURI: true },
          payload: options?.sanitizeResponseLog?.body?.payload === true
            ? true
            : {
                ...options?.sanitizeResponseLog?.body?.payload,
                cards: { cardNumber: maskCardNumberForLog }
              }
        }
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

        return response
      },
      predicate: response => typeof response.body !== 'string' || response.status !== 200,
      maxAttempts: 2,
      delayMs: 1000
    })
  } catch (e) {
    if (e instanceof RetryError) {
      console.assert(false, 'Unexpected Sense API response after retry', responseSummary(e.failedResults[e.failedResults.length - 1]))
    }
    throw e
  }
  console.assert(result.body !== null && typeof result.body === 'object', 'Unexpected Sense API response', responseSummary(result))
  if (result.body.error_description === 'oauth.exception.client.blocked') {
    const blockedTill = new Date(parseInt(result.body.blocked_till))
    console.assert(Number.isFinite(blockedTill.getTime()), 'Sense block expiry is invalid')
    throw new TemporaryError(`Підключення заблоковано до ${blockedTill.toISOString()}. Повторіть синхронізацію після цього часу.`)
  }

  return result
}

function validatePreferences (rawPreferences) {
  const preferences = {
    phone: getPhoneNumber(rawPreferences.phone),
    birthDate: rawPreferences.birthDate
  }

  if (!preferences.phone) {
    throw new InvalidPreferencesError('Неправильний формат номера телефону')
  }

  if (!preferences.birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new InvalidPreferencesError('Неправильний формат дати народження')
  }

  return preferences
}

async function askPinCode () {
  let pinCode
  while (!pinCode || !pinCode?.match(/^\d{6}$/)) {
    pinCode = await ZenMoney.readLine('Введіть PIN-код застосунку Sense. ' +
      'Якщо ви його не пам’ятаєте, придумайте новий код із шести цифр. ' +
      'Використовуйте цей новий PIN-код для входу в застосунок банку.', { inputType: 'number' })
    console.assert(pinCode !== null, 'Required PIN input was not provided')
  }
  return pinCode
}

function assertResponseCodeOk (response) {
  console.assert(response.status === 200 && response.body?.code === 'OK', 'Unexpected Sense API response', responseSummary(response))
}

function assertResponseAccessToken (response) {
  console.assert(response.status === 200 && typeof response.body?.access_token === 'string' && response.body.access_token,
    'Unexpected Sense API response during authentication', responseSummary(response))
}

function responseSummary (response) {
  const body = response?.body
  return {
    status: Number.isInteger(response?.status) ? response.status : null,
    contentType: response?.headers?.['content-type'] || response?.headers?.get?.('content-type') || null,
    bodyType: body == null ? String(body) : typeof body,
    responseCode: typeof body?.code === 'string' ? body.code : null,
    responseError: typeof body?.error === 'string' ? body.error : null,
    errorDescription: typeof body?.error_description === 'string' ? body.error_description : null
  }
}

function getPhoneNumber (input) {
  const result = /^\+?(380\d{9})$/.exec(input.trim())

  if (result) {
    return result[1]
  }
  return null
}

export async function getDeviceToken (auth) {
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

async function coldAuth (preferences, auth, isInBackground) {
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
    throw new InvalidPreferencesError('Завантажте застосунок Sense SuperApp і зареєструйтеся в ньому')
  }
  if (response.body.error_description === 'oauth.exception.client.not.found') {
    throw new InvalidLoginOrPasswordError()
  }

  assertResponseAccessToken(response)
  auth.accessToken = response.body.access_token
  if (isInBackground) throw new UserInteractionError()
  response = await fetchApi('/otp/login', {
    method: 'POST',
    body: {
      key: auth.accessToken
    },
    sanitizeRequestLog: { body: { key: true } },
    sanitizeResponseLog: { body: { payload: true } }
  }, auth)
  assertResponseCodeOk(response)

  const smsCode = await ZenMoney.readLine('Введіть код із SMS',
    { inputType: 'number', time: response.body.payload.expiry * 1000 })

  console.assert(typeof smsCode === 'string' && smsCode.trim(), 'Required OTP input was not provided')

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
        cardNumberPart = await ZenMoney.readLine('Введіть останні 4 цифри номера картки')
        console.assert(cardNumberPart !== null, 'Required card input was not provided')
      }
      let cardCvv = ''
      while (!cardCvv?.match(/^\d{3}$/)) {
        cardCvv = await ZenMoney.readLine('Введіть CVV-код')
        console.assert(cardCvv !== null, 'Required card input was not provided')
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
        throw new TemporaryError('Перевірте дані картки та повторіть спробу')
      }
      break
    }
    case 'passport_issue_date': {
      let passportIssueDate = ''
      while (!passportIssueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        passportIssueDate = await ZenMoney.readLine('Введіть дату видачі паспорта у форматі рррр-мм-дд')
        console.assert(passportIssueDate !== null, 'Required identity input was not provided')
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
        throw new TemporaryError('Перевірте дату видачі паспорта та повторіть спробу')
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
  assertResponseAccessToken(response)
  auth.accessToken = response.body.access_token
  auth.refreshToken = response.body.refresh_token // idk, we don't use it
}

async function warmAuth (auth, onAuth) {
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
  await onAuth(auth)

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
      console.assert(false, 'Unexpected Sense authentication response', responseSummary(response))
    },
    maxAttempts: 2,
    delayMs: 0
  })

  auth.accessToken = response.body.access_token
}

export async function login (rawPreferences, auth, isInBackground = false, onAuth = async () => {}) {
  if (auth.accessToken) {
    await warmAuth(auth, onAuth)
  }

  if (!auth.accessToken) {
    const preferences = validatePreferences(rawPreferences)
    auth.deviceToken = await getDeviceToken(auth)
    await coldAuth(preferences, auth, isInBackground)
  }
  await onAuth(auth)
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
