import { fetchJson } from '../../common/network'
import { generateUUID } from '../../common/utils'
import {
  IncompatibleVersionError,
  InvalidLoginOrPasswordError,
  InvalidOtpCodeError,
  TemporaryError
} from '../../errors'

const appVersion = '3.5.6'
const baseUrl = 'https://b2c-api.kapitalbank.uz/api/v1'
const sensitiveHeaders = {
  Authorization: true,
  DeviceId: true,
  'X-Device-Info': true,
  'X-Trace-Info': true
}

export class AuthenticationError extends Error {}

function normalizePhone (phone) {
  return phone.replace(/\D/g, '')
}

function getDefaultHeaders (auth) {
  const osVersion = ZenMoney.device?.os?.version || '15'
  const manufacturer = ZenMoney.device?.manufacturer || 'Google'
  const model = ZenMoney.device?.model || 'Pixel 8'

  return {
    'Accept-Encoding': 'gzip',
    'Accept-Language': 'ru-RU',
    DeviceId: auth.deviceId,
    'User-Agent': 'okhttp/5.3.2',
    'X-App-Version': appVersion,
    'X-Device-Info': `Android; ${osVersion}; ${manufacturer}; ${model}; ${appVersion}; XXHDPI; ${auth.deviceId}`,
    'X-Device-OS': 'ANDROID',
    'X-Trace-Info': `sessionId=${auth.sessionId} requestId=${generateUUID()}`
  }
}

function getTokenHeaders (auth, token = auth.accessToken) {
  return {
    ...getDefaultHeaders(auth),
    Authorization: 'Bearer ' + token
  }
}

function getResponseErrorMessage (response, fallback) {
  const body = response.body
  if (body && typeof body === 'object') {
    for (const key of ['errorDetail', 'message', 'error']) {
      if (typeof body[key] === 'string' && body[key]) {
        return body[key]
      }
    }
  }
  return `${fallback} (${response.status})`
}

function assertResponse (response, operation, authenticationStatuses = []) {
  if (response.ok) {
    return
  }
  const message = getResponseErrorMessage(response, `Unexpected ${operation} response`)
  if (authenticationStatuses.includes(response.status)) {
    throw new AuthenticationError(message)
  }
  if (response.status === 426) {
    throw new IncompatibleVersionError(message)
  }
  throw new TemporaryError(message)
}

function getArrayResponseBody (response, operation) {
  if (!Array.isArray(response.body)) {
    throw new TemporaryError(`Bank returned malformed ${operation} response`)
  }
  return response.body
}

async function fetchApi (auth, endpoint, options = {}) {
  return fetchJson(baseUrl + endpoint, {
    ...options,
    headers: {
      ...getDefaultHeaders(auth),
      ...options.headers
    }
  })
}

async function fetchAuthorizedApi (auth, endpoint, options = {}) {
  return fetchApi(auth, endpoint, {
    ...options,
    headers: {
      ...getTokenHeaders(auth),
      ...options.headers
    },
    sanitizeRequestLog: { headers: sensitiveHeaders }
  })
}

export async function fetchPhoneExists (auth, phone) {
  const response = await fetchApi(auth, '/auth/phone-number/' + normalizePhone(phone), {
    method: 'GET',
    sanitizeRequestLog: true
  })
  assertResponse(response, 'phone lookup')
  return response.body.exist
}

export async function fetchPasswordVerification (auth, phone, password, otpSendingSource = 'SMS') {
  const response = await fetchApi(auth, '/auth/by-password', {
    method: 'POST',
    body: {
      phoneNumber: normalizePhone(phone),
      password,
      otpSendingSource
    },
    sanitizeRequestLog: { headers: sensitiveHeaders, body: { phoneNumber: true, password: true } },
    sanitizeResponseLog: { body: { verificationCode: true, maskedPhone: true, maskedPhoneNumber: true } }
  })

  if (response.status === 403) {
    const detail = getResponseErrorMessage(response, 'Bank identification is required')
    throw new TemporaryError(`${detail}. Пройдите идентификацию в последней версии приложения Kapitalbank и повторите синхронизацию.`)
  }
  if (response.status === 400) {
    throw new InvalidLoginOrPasswordError(getResponseErrorMessage(response, 'Неверный номер телефона или пароль'))
  }
  assertResponse(response, 'password authentication')
  return response.body
}

export async function fetchPasswordSession (auth, verificationCode, otpCode) {
  const body = { verificationCode }
  if (otpCode !== null && otpCode !== undefined) {
    body.otpCode = otpCode
  }

  const response = await fetchApi(auth, '/auth/verify-by-password', {
    method: 'POST',
    body,
    sanitizeRequestLog: { headers: sensitiveHeaders, body: { verificationCode: true, otpCode: true } },
    sanitizeResponseLog: { body: { guid: true, accessToken: true, refreshToken: true } }
  })

  if (response.status === 400) {
    throw new InvalidOtpCodeError(getResponseErrorMessage(response, 'Неверный код подтверждения'))
  }
  assertResponse(response, 'password verification')
  return response.body
}

export async function fetchRefreshedSession (auth) {
  const response = await fetchApi(auth, '/auth/tokens/re-creation', {
    method: 'POST',
    headers: getTokenHeaders(auth, auth.refreshToken),
    sanitizeRequestLog: { headers: sensitiveHeaders },
    sanitizeResponseLog: { body: { guid: true, accessToken: true, refreshToken: true } }
  })
  assertResponse(response, 'token refresh', [401, 403])
  return response.body
}

export async function fetchCards (auth) {
  const endpoint = '/cards?processing=HUMO%2CUZCARD%2CVISA%2CMASTERCARD&currency=UZS%2CUSD%2CEUR&bankType=ALL&favouriteCardType=ALL&cardType=PHYSICAL%2CCORPORATE%2CRETIREMENT'
  const response = await fetchAuthorizedApi(auth, endpoint, { method: 'GET' })
  assertResponse(response, 'cards', [401])
  return getArrayResponseBody(response, 'cards')
}

export async function fetchCardBalance (auth, cardId) {
  const response = await fetchAuthorizedApi(auth, '/cards/balance/' + cardId, { method: 'GET' })
  assertResponse(response, 'card balance', [401])
  return response.body
}

export async function fetchAccounts (auth) {
  const response = await fetchAuthorizedApi(auth, '/accounts', { method: 'GET' })
  assertResponse(response, 'accounts', [401])
  return getArrayResponseBody(response, 'accounts')
}

export async function fetchDeposits (auth) {
  const response = await fetchAuthorizedApi(auth, '/deposits', { method: 'GET' })
  assertResponse(response, 'deposits', [401])
  return getArrayResponseBody(response, 'deposits')
}

export async function fetchCardOrAccountTransactions (auth, productGuid, fromDate, toDate, page = 0, size = 20) {
  const dateFrom = new Date(fromDate).toISOString().split('T')[0]
  const dateTo = new Date(toDate).toISOString().split('T')[0]
  const endpoint = `/history/transactions?page=${page}&size=${size}&productGuid=${productGuid}&dateFrom=${dateFrom}&dateTo=${dateTo}`
  const response = await fetchAuthorizedApi(auth, endpoint, { method: 'GET' })
  assertResponse(response, 'transaction history', [401])
  return response.body
}

export async function fetchDepositTransactions (auth, depositId, page = 0, size = 15) {
  const response = await fetchAuthorizedApi(auth, `/deposits/history/${depositId}?page=${page}&size=${size}`, { method: 'GET' })
  assertResponse(response, 'deposit transaction history', [401])
  return response.body
}
