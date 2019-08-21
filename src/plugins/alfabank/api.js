import _ from 'lodash'
import { fetchJson } from '../../common/network'

const appVersion = '10.8.1'
const deviceName = 'Zenmoney'
const osVersion = '7.1.1'
const operationSystem = 'Android'
const operationSystemVersion = '25'
const applicationId = 'ru.alfabank.mobile.android'
const userAgent = 'okhttp/3.8.0'

export function fetchAccessToken ({ sessionId, deviceId, refreshToken }) {
  return fetchJson('https://alfa-mobile.alfabank.ru/ALFAJMB/openid/token?refresh_token=' + refreshToken, {
    method: 'GET',
    headers: {
      'APP-VERSION': appVersion,
      'OS-VERSION': osVersion,
      'OS': operationSystem.toLowerCase(),
      'DEVICE-ID': deviceId,
      'DEVICE-MODEL': deviceName,
      'applicationId': applicationId,
      'appVersion': appVersion,
      'osVersion': osVersion,
      'session_id': sessionId,
      'User-Agent': userAgent
    },
    sanitizeRequestLog: { url: true, headers: { 'DEVICE-ID': true, 'session_id': true } },
    sanitizeResponseLog: { url: true, body: { access_token: true, refresh_token: true } }
  })
}

export function login ({ sessionId, deviceId, accessToken }) {
  return callGate({
    sessionId,
    deviceId,
    accessToken,
    service: 'Authorization',
    body: {
      'operationId': 'Authorization:Login',
      'parameters': {
        'appVersion': appVersion,
        'deviceId': deviceId,
        'deviceName': deviceName,
        'login': '',
        'loginType': 'token',
        'operationSystem': operationSystem,
        'operationSystemVersion': operationSystemVersion,
        'password': ''
      }
    },
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: true, headers: { 'set-cookie': true } }
  })
}

export function isExpiredToken (response) {
  return response.status === 419 && response.body.id === 'TOKEN_EXPIRED'
}

export function isNotFoundToken (response) {
  return response.status === 403 && response.body.id === 'TOKEN_NOT_FOUND'
}

export function isExpiredRefreshToken (response) {
  // also body.type_id: 'EXPIRED', body.class: 'class ru.ratauth.exception.ExpiredException' },
  return response.status === 419 && response.body.id === 'REFRESH_TOKEN_EXPIRED'
}

export function isExpiredSession (response) {
  // also body.type_id: 'EXPIRED', body.class: 'class ru.ratauth.exception.ExpiredException'
  return response.status === 419 && response.body.id === 'SESSION_EXPIRED'
}

export function isBlockedSession (response) {
  return response.status === 403 && response.body.id === 'SESSION_BLOCKED'
}

export function isNotFoundSession (response) {
  return response.status === 403 && response.body.id === 'SESSION_NOT_FOUND'
}

export function assertLoginIsSuccessful (loginResponse) {
  console.assert(loginResponse.status === 200, 'Unexpected login status code', loginResponse)
  if (loginResponse.body.operationId === 'Exception') {
    if (loginResponse.body.header.faultCode === 'WS_CALL_ERROR') {
      throw new TemporaryError(loginResponse.body.header.faultMessage)
    }
    throw new TemporaryError(loginResponse.body.header.faultMessage)
  }
  console.assert(loginResponse.body.operationId === 'Authorization:LoginResult', 'Unexpected login operationId', loginResponse)
  if (loginResponse.body.header.status === 'GENERAL_EXCEPTION') {
    throw new TemporaryError(loginResponse.body.header.description)
  } else if (loginResponse.body.header.status !== 'STATUS_OK') {
    console.assert(false, 'Unexpected login header.status', loginResponse)
  }
}

function assertNotServerError (response) {
  if (response.status === 200) {
    return
  }
  const errors = _.get(response, ['body', 'errors'])
  if (Array.isArray(errors)) {
    const messages = errors.map((x) => x.message).filter(Boolean)
    const allMessagesText = messages.join('\n')
    if (messages.some((x) => x.startsWith('Некорректные данные.'))) {
      throw new Error(allMessagesText)
    }
    if (allMessagesText.includes('Мы обнаружили, что вы поменяли SIM-карту.')) {
      throw new TemporaryError(allMessagesText)
    }
    if (messages.includes('Пароль введён неверно')) {
      throw new TemporaryError(allMessagesText)
    }
    if (messages.includes('Ваша карта закрыта или заблокирована. Для входа используйте другую карту.')) {
      throw new TemporaryError(allMessagesText)
    }
    if (messages.some((x) => x.startsWith('В целях вашей безопасности, вход в мобильное приложение был заблокирован.'))) {
      throw new TemporaryError(allMessagesText)
    }
    if (messages.some((x) => x.startsWith('Пароль устарел.'))) {
      throw new TemporaryError(allMessagesText)
    }
    if (messages.some((x) => x.startsWith('Произошла ошибка.'))) {
      throw new TemporaryError(allMessagesText)
    }
    throw new Error(allMessagesText)
  }
}

export async function callGate ({ sessionId, deviceId, service, body, accessToken = null, sanitizeRequestLog = {}, sanitizeResponseLog = {} }) {
  const headers = {
    'jmb-protocol-version': '1.0',
    'jmb-protocol-service': service,
    'APP-VERSION': appVersion,
    'OS-VERSION': osVersion,
    'OS': operationSystem.toLowerCase(),
    'DEVICE-ID': deviceId,
    'DEVICE-MODEL': deviceName,
    'applicationId': applicationId,
    'appVersion': appVersion,
    'osVersion': osVersion,
    'session_id': sessionId,
    'User-Agent': userAgent
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetchJson('https://alfa-mobile.alfabank.ru/ALFAJMB/gate', {
    method: 'POST',
    headers,
    body,
    sanitizeRequestLog: _.merge({}, { headers: { Authorization: true, 'DEVICE-ID': true, 'session_id': true } }, sanitizeRequestLog),
    sanitizeResponseLog: sanitizeResponseLog
  })
  assertNotServerError(response)
  return response
}

async function getOidReference ({ queryRedirectParams, previousMultiFactorResponseParams }) {
  const response = await fetchJson('https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/reference', {
    method: 'POST',
    body: {
      queryRedirectParams,
      previousMultiFactorResponseParams,
      type: 'CARD'
    },
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: true }
  })
  assertNotServerError(response)
  console.assert(response.status === 200, 'getOidReference failed', response)
  const { reference: { reference } } = response.body
  return reference
}

async function registerCustomer ({ queryRedirectParams, cardExpirationDate, cardNumber, phoneNumber }) {
  const response = await fetchJson('https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/registerCustomer', {
    method: 'POST',
    body: {
      'credentials': {
        'card': {
          'expirationDate': cardExpirationDate,
          'number': cardNumber
        },
        'phoneNumber': phoneNumber,
        'queryRedirectParams': queryRedirectParams,
        'type': 'CARD'
      }
    },
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: { params: true } }
  })
  assertNotServerError(response)
  console.assert(response.status === 200, 'registerCustomer failed', response)

  const { params: previousMultiFactorResponseParams } = response.body
  previousMultiFactorResponseParams.reference = await getOidReference({ queryRedirectParams, previousMultiFactorResponseParams })
  return { previousMultiFactorResponseParams }
}

export async function register ({ deviceId, cardNumber, cardExpirationDate, phoneNumber }) {
  const queryRedirectParams = {
    'acr_values': 'card_account:sms',
    'client_id': 'mobile-app',
    'device_id': deviceId,
    'is_webview': 'true',
    'non_authorized_user': 'true',
    'scope': 'openid mobile-bank'
  }

  const { previousMultiFactorResponseParams } = await registerCustomer({ queryRedirectParams, cardExpirationDate, cardNumber, phoneNumber })
  const confirmationCode = await ZenMoney.readLine('Введите код из SMS или push-уведомления', { inputType: 'number' })
  const { redirectUrl } = await finishCustomerRegistration({ confirmationCode, queryRedirectParams, previousMultiFactorResponseParams })
  const redirectedResponse = await fetchJson(redirectUrl, {
    sanitizeRequestLog: { url: true },
    sanitizeResponseLog: { url: true }
  })
  const accessTokenMatch = redirectedResponse.url.match(/access_token=(.+?)&/)
  if (!accessTokenMatch) {
    throw new Error(`redirect url does not contain access_token param: ` + redirectedResponse.url)
  }
  const refreshTokenMatch = redirectedResponse.url.match(/refresh_token=(.+?)&/)
  if (!refreshTokenMatch) {
    throw new Error(`redirect url does not contain refresh_token param: ` + redirectedResponse.url)
  }
  const [, accessToken] = accessTokenMatch
  const [, refreshToken] = refreshTokenMatch
  return { accessToken, refreshToken }
}

export async function finishCustomerRegistration ({ confirmationCode, queryRedirectParams, previousMultiFactorResponseParams }) {
  const response = await fetchJson('https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/finishCustomerRegistration', {
    method: 'POST',
    body: {
      'credentials': {
        code: confirmationCode,
        queryRedirectParams,
        previousMultiFactorResponseParams,
        type: 'CARD'
      }
    },
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { url: true, body: true, headers: { 'set-cookie': true } }
  })
  assertNotServerError(response)
  console.assert(response.status === 200, 'finishCustomerRegistration failed', response)
  const { params: { code }, redirectUrl } = response.body
  return { code, redirectUrl }
}

export async function getCommonAccounts ({ sessionId, deviceId }) {
  const response = await callGate({
    sessionId,
    deviceId,
    service: 'Budget',
    body: { 'operationId': 'Budget:GetCommonAccounts', 'parameters': { 'operation': 'mainPage' } }
  })

  console.assert(response.status === 200, 'Unexpected response status code', response)
  console.assert(response.body.operationId === 'Budget:GetCommonAccountsResult', 'Unexpected response body.operationId', response)

  return response.body.accounts
}

export async function getAccountsWithAccountDetailsCreditInfo ({ sessionId, deviceId }) {
  const apiAccounts = await getCommonAccounts({ sessionId, deviceId })
  return Promise.all(apiAccounts.map(async (apiAccount) => {
    if (!apiAccount.creditInfo) {
      return apiAccount
    }
    const accountDetails = await getAccountDetails({ sessionId, deviceId, accountNumber: apiAccount.number })
    return { ...apiAccount, accountDetailsCreditInfo: accountDetails.creditInfo }
  }))
}

// note: API filters movements by date and respects time+timezone only for determining specific day
export const formatApiDate = (date) => date ? date.toISOString().replace(/Z$/, '+0000') : null

async function getCommonMovements ({ sessionId, deviceId, startDate = null, endDate = null, offset, count }) {
  const response = await callGate({
    sessionId,
    deviceId,
    service: 'Budget',
    body: {
      'operationId': 'Budget:GetCommonMovements',
      'operation': 'commonStatement',
      'filters': [],
      'tagsCloud': [],

      // e.g. "2018-03-01T00:00:00.000+0300", null
      'startDate': formatApiDate(startDate),
      // e.g. "2018-03-08T23:59:59.999+0300", null
      'endDate': formatApiDate(endDate),

      'offset': offset,
      'count': count,
      'forceCache': false
    }
  })
  console.assert(response.status === 200, 'Unexpected response status code', response)
  return response
}

const initialRequestedCount = 1024
const minRequestedCount = 1

export async function getAllCommonMovements ({ sessionId, deviceId, startDate = null, endDate = null }) {
  // We receive WS_CALL_ERROR somewhere at the end of the list
  // I found no ways to figure out where logical end is, so we stop when querying minRequestedCount items gives us "WS_CALL_ERROR"
  // Maybe we should limit ourselves by account creation date?
  let pagesOfMovements = []
  let offset = 0
  let count = initialRequestedCount
  const haveReceivedIncompletePage = () => pagesOfMovements.length > 0 && _.last(pagesOfMovements).length < count
  do {
    const response = await getCommonMovements({ sessionId, deviceId, startDate, endDate, offset, count })
    console.assert(response.status === 200, 'Unexpected response status code', response)
    if (response.body.header && response.body.header.faultCode === 'WS_CALL_ERROR') {
      console.error(`get failed`, { offset, count })
      count /= 2
    } else {
      console.warn(`get passed`, { offset, count })
      const { operationId, movements } = response.body
      console.assert(operationId === 'Budget:GetCommonMovementsResult', 'Unexpected response body.operationId', response)
      pagesOfMovements.push(movements)
      offset += movements.length
    }
  } while (!haveReceivedIncompletePage() && count >= minRequestedCount)
  return _.flatten(pagesOfMovements)
}

export const parseApiAmount = (apiAmount) => {
  const number = Number(apiAmount.replace(/\s/g, ''))
  console.assert(!isNaN(number), 'Cannot parse amount', apiAmount)
  return number
}

export async function getAccountDetails ({ sessionId, deviceId, accountNumber }) {
  const response = await callGate({
    sessionId,
    deviceId,
    service: 'Budget',
    body: { 'operationId': 'Budget:GetAccountDetails', 'parameters': { 'account': accountNumber } },
    sanitizeResponseLog: { body: { accountInfo: true } }
  })

  console.assert(response.status === 200, 'Unexpected response status code', response)

  const { account, operationId, ...rest } = response.body
  console.assert(operationId === 'Budget:GetAccountDetailsResult', 'Unexpected response body.operationId', response)

  return rest
}
