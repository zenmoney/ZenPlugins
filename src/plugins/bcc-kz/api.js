import { defaultsDeep, find } from 'lodash'
import { stringify } from 'querystring'
import { dateInTimezone } from '../../common/dateUtils'
import { fetch, ParseError } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateRandomString } from '../../common/utils'
import { InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryError, UserInteractionError } from '../../errors'

const MAIN_URL = 'https://m.bcc.kz/mb/!pkg_w_mb_main.operation'
const AUTH_URL = 'https://m.bcc.kz/auth/realms/bank/protocol/openid-connect/token'
const AUTH_CLIENT_ID = 'dbp-channels-bcc-web'

const COMMON_HEADERS = {
  'User-Agent': 'okhttp/3.14.9',
  'Content-Type': 'application/x-www-form-urlencoded'
}

function getPhoneNumber (input) {
  const result = /^(?:\+?7|8|)(\d{10})$/.exec(input.trim())

  if (result) {
    return result[1]
  }
  return null
}

function appendQueryParams (url, params) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  if (entries.length === 0) {
    return url
  }
  return `${url}?${stringify(Object.fromEntries(entries))}`
}

function decodeJwtPayload (accessToken) {
  if (!accessToken || typeof accessToken !== 'string') {
    return null
  }
  const parts = accessToken.split('.')
  if (parts.length < 2) {
    return null
  }

  const base64Url = parts[1]
  const base64 = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(base64Url.length / 4) * 4, '=')

  try {
    if (typeof atob === 'function') {
      return JSON.parse(atob(base64))
    }
    if (typeof Buffer !== 'undefined') {
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
    }
  } catch (e) {
    return null
  }

  return null
}

function extractSessionCode (responseBody, accessToken) {
  if (responseBody?.provider_response?.session_code) {
    return responseBody.provider_response.session_code
  }
  if (responseBody?.session_code) {
    return responseBody.session_code
  }

  const jwtPayload = decodeJwtPayload(accessToken)
  if (jwtPayload?.provider_response?.session_code) {
    return jwtPayload.provider_response.session_code
  }
  if (jwtPayload?.session_code) {
    return jwtPayload.session_code
  }
  if (jwtPayload?.session_state) {
    return jwtPayload.session_state
  }

  return null
}

function extractMbsessionId (responseBody, accessToken) {
  const jwtPayload = decodeJwtPayload(accessToken)
  return responseBody?.provider_response?.mbsessionid ||
    responseBody?.mbsessionid ||
    jwtPayload?.provider_response?.mbsessionid ||
    jwtPayload?.mbsessionid ||
    null
}

async function fetchAuthApi (options) {
  return await fetch(AUTH_URL, {
    method: 'POST',
    ...options,
    headers: {
      ...COMMON_HEADERS,
      ...options?.headers
    },
    stringify,
    parse: (body) => body === '' ? undefined : JSON.parse(body),
    sanitizeResponseLog: defaultsDeep({}, options?.sanitizeResponseLog, {
      headers: { 'set-cookie': true },
      body: {
        access_token: true,
        refresh_token: true,
        token: true,
        session_code: true,
        session_state: true,
        mbsessionid: true,
        provider_response: { session_code: true, mbsessionid: true }
      }
    })
  })
}

export async function setLanguageCookie () {
  await ZenMoney.setCookie('m.bcc.kz', 'lang', 'ae')
}

export async function setMbsessionCookie (auth) {
  if (!auth?.mbsessionId) {
    return
  }
  await ZenMoney.setCookie('m.bcc.kz', 'mbsessionid', auth.mbsessionId, {
    path: '/',
    secure: true
  })
}

function validatePreferences (rawPreferences) {
  const preferences = { phone: getPhoneNumber(rawPreferences.phone), password: rawPreferences.password }
  if (!preferences.phone) {
    throw new InvalidLoginOrPasswordError('Неверный формат номера телефона')
  }
  return preferences
}

export function generateDevice () {
  return { deviceId: generateRandomString(16, '0123456789abcdef') }
}

function buildWebOsString () {
  return `OS:Android10;BRAND:${ZenMoney.device.brand};MODEL:${ZenMoney.device.model};SCREEN:1080x2043;AppVersion:2.0.13;`
}

async function preAuth (preferences, auth) {
  const response = await fetchAuthApi({
    body: {
      action: 'SIGN',
      authType: 'PASS',
      login: preferences.phone,
      cell1: preferences.password,
      grant_type: 'password',
      client_id: AUTH_CLIENT_ID,
      latitude: '43.23680400217998',
      longitude: '76.9157857858951',
      os: buildWebOsString(),
      device_id: auth.device.deviceId,
      ksid: ''
    },
    sanitizeRequestLog: {
      body: {
        login: true,
        cell1: true,
        device_id: true
      }
    },
    sanitizeResponseLog: {
      body: {
        token: true
      }
    }
  })

  if (!response.body.success && response.body.reason?.match(/Не верный логин или пароль/i)) {
    throw new InvalidLoginOrPasswordError()
  }
  assertSuccessAuthResponse(response)

  return { verified: response.body.verified, token: response.body.token || null }
}

async function coldAuth (token) {
  const smsCode = await ZenMoney.readLine('Введите код из SMS', { inputType: 'number' })
  if (!smsCode) {
    throw new InvalidOtpCodeError()
  }

  const response = await fetchAuthApi({
    body: {
      action: 'SIGN',
      authType: 'TOKEN',
      token,
      verify_code: smsCode,
      grant_type: 'password',
      client_id: AUTH_CLIENT_ID
    },
    sanitizeRequestLog: {
      body: {
        token: true,
        verify_code: true
      }
    },
    sanitizeResponseLog: {
      body: {
        email: true,
        firstname: true,
        iin: true,
        lastname: true,
        login: true,
        middlename: true,
        name: true
      }
    }
  })

  if (!response.body.success && /otp|код|время жизни otp истекло/i.test(response.body.reason ?? '')) {
    throw new InvalidOtpCodeError(response.body.reason ?? undefined)
  }
  assertSuccessAuthResponse(response)
  console.assert(response.body.verified, 'unexpected response after sms confirmation', { status: response.status, verified: response.body.verified })

  return {
    verified: response.body.verified,
    token: response.body.token || null
  }
}

async function postAuth (auth) {
  const response = await fetchAuthApi({
    body: {
      action: 'CONNECT',
      device_id: auth.device.deviceId,
      OS: buildWebOsString(),
      grant_type: 'password',
      client_id: AUTH_CLIENT_ID
    },
    sanitizeRequestLog: {
      body: {
        device_id: true
      }
    },
    sanitizeResponseLog: {
      body: {
        access_token: true,
        refresh_token: true
      }
    }
  })

  console.assert(response?.body?.access_token, 'unexpected auth connect response', { status: response.status })

  return {
    accessToken: response.body.access_token,
    sessionCode: extractSessionCode(response.body, response.body.access_token),
    mbsessionId: extractMbsessionId(response.body, response.body.access_token)
  }
}

function assertSuccessAuthResponse (response) {
  console.assert(response?.body?.success, 'unexpected auth response', { status: response.status, success: response.body?.success })
}

export async function login (rawPreferences, auth, isInBackground = false) {
  if (isInBackground) {
    throw new UserInteractionError()
  }
  const preferences = validatePreferences(rawPreferences)

  const { verified, token } = await preAuth(preferences, auth)
  if (!verified) {
    await coldAuth(token)
  }
  const connectResult = await postAuth(auth)
  auth.accessToken = connectResult.accessToken
  auth.sessionCode = connectResult.sessionCode
  auth.mbsessionId = connectResult.mbsessionId
  await setMbsessionCookie(auth)
  if (auth.mbsessionId && typeof ZenMoney.saveCookies === 'function') {
    await ZenMoney.saveCookies()
  }
}

export class SessionExpiredError extends Error {}

export async function withAuthRecovery (preferences, auth, action, { isInBackground = false, onAuth = () => {} } = {}, deps = { login }) {
  const authenticate = async () => {
    if (isInBackground) {
      throw new UserInteractionError()
    }
    await deps.login(preferences, auth)
    onAuth(auth)
  }
  const hadCachedAuth = Boolean(auth?.accessToken)
  if (!hadCachedAuth) {
    await authenticate()
  }
  try {
    return await action()
  } catch (error) {
    if (!(error instanceof SessionExpiredError) || !hadCachedAuth) {
      throw error
    }
    delete auth.accessToken
    delete auth.sessionCode
    await authenticate()
    return await action()
  }
}

function createAuthenticatedMainUrl (auth, params) {
  console.assert(auth?.accessToken, 'auth.accessToken must be defined')
  if (!auth?.sessionCode && auth?.accessToken) {
    auth.sessionCode = extractSessionCode(null, auth.accessToken)
  }
  console.assert(auth?.sessionCode, 'auth.sessionCode must be defined')

  return appendQueryParams(MAIN_URL, {
    ...params,
    session_code: auth.sessionCode,
    timestamp: Date.now()
  })
}

async function fetchMainApi (auth, params) {
  const url = createAuthenticatedMainUrl(auth, params)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: 'application/json, text/plain, */*'
    },
    parse: (body) => body === '' ? undefined : JSON.parse(body),
    sanitizeRequestLog: {
      url: { query: { session_code: true } },
      headers: {
        Authorization: true
      }
    },
    sanitizeResponseLog: {
      url: { query: { session_code: true } },
      headers: { 'set-cookie': true },
      body: { reason: { card: { holder: true }, other_card: { token: true } } }
    }
  })
  if (response.body?.success === false && response.body?.timeout === 'YES') {
    throw new SessionExpiredError('BCC session expired')
  }
  return response
}

export async function fetchAccounts (auth) {
  const accountsInfoResponse = await fetchMainApi(auth, {
    action: 'ACCOUNTS_INFO',
    level: '0'
  })
  assertSuccessResponse(accountsInfoResponse)
  const accountsData = accountsInfoResponse.body.reason

  const accountsAdditionalInfoResponse = await fetchMainApi(auth, {
    action: 'ACCOUNTS_ADDITIONAL_INFO',
    level: '0'
  })
  assertSuccessResponse(accountsAdditionalInfoResponse)
  const accountsAdditionalData = accountsAdditionalInfoResponse.body.reason.accounts_info

  const result = [
    ...setStructType(accountsData.card, 'card'),
    ...setStructType(accountsData.current, 'current'),
    ...setStructType(accountsData.dep, 'deposit'),
    ...setStructType(accountsData.loan, 'loan'),
    ...setStructType(accountsData.broker, 'broker'),
    ...setStructType(accountsData.metal, 'metal')
    // ...accountsData.bonus,
    // ...accountsData.cashback,
    // ...accountsData.safe
  ]

  for (const details of accountsAdditionalData) {
    const baseAccount = find(result, x => x.id === details.id)
    if (baseAccount) {
      baseAccount.details = details
    }
  }

  return result
}

export async function fetchTransactions (auth, product, fromDate, toDate) {
  const fromKzTime = dateInTimezone(fromDate, 6 * 60)
  const toKzTime = dateInTimezone(toDate, 6 * 60)

  // A multi-currency card keeps its actual transactions on per-currency sub-accounts
  // (`multiaccs`), each queried by its own account_id. The card's own id holds only the
  // main-currency operations, so we must pull a statement for every sub-account.
  const statementAccountIds = product.statementAccountIds?.length
    ? product.statementAccountIds
    : [product.productId]

  const transactions = []
  for (const accountId of statementAccountIds) {
    transactions.push(...await fetchAccountStatement(auth, product, accountId, fromKzTime, toKzTime))
  }
  return transactions
}

async function fetchAccountStatement (auth, product, accountId, fromKzTime, toKzTime) {
  try {
    return await fetchTransactionsChunk(auth, product, accountId, fromKzTime, toKzTime)
  } catch (error) {
    if (!shouldFallbackToChunkedFetch(error, fromKzTime, toKzTime)) {
      throw error
    }

    const transactions = []
    for (const [intervalFrom, intervalTo] of createDateIntervals(fromKzTime, toKzTime, 31)) {
      try {
        const chunkTransactions = await fetchTransactionsChunk(auth, product, accountId, intervalFrom, intervalTo)
        transactions.push(...chunkTransactions)
      } catch (chunkError) {
        if (isHtmlGatewayError(chunkError)) {
          throw new TemporaryError('Сервер BCC временно недоступен. Попробуйте повторить синхронизацию позже.')
        }
        throw chunkError
      }
    }
    return transactions
  }
}

async function fetchTransactionsChunk (auth, product, accountId, fromDate, toDate) {
  const response = await fetchMainApi(auth, {
    account_id: accountId,
    action: 'GET_EXT_STATEMENT',
    date_begin: formatDate(fromDate),
    date_end: formatDate(toDate),
    ...(product.productType === 'ccard' && { cardacc: '1' })
  })
  if (response.body?.reason === 'Вы не являетесь владельцем счета') {
    return []
  }
  assertSuccessResponse(response)

  return response.body.stmt ?? []
}

function shouldFallbackToChunkedFetch (error, fromDate, toDate) {
  return isHtmlGatewayError(error) && dateDiffInDays(fromDate, toDate) > 31
}

function isHtmlGatewayError (error) {
  return error instanceof ParseError &&
    typeof error.response?.body === 'string' &&
    /<html|<!doctype html|504|gateway/i.test(error.response.body)
}

function createDateIntervals (fromDate, toDate, maxDays) {
  const intervals = []
  let cursor = new Date(fromDate.getTime())
  while (cursor.getTime() <= toDate.getTime()) {
    const intervalEnd = new Date(cursor.getTime())
    intervalEnd.setDate(intervalEnd.getDate() + maxDays - 1)
    if (intervalEnd.getTime() > toDate.getTime()) {
      intervalEnd.setTime(toDate.getTime())
    }
    intervals.push([new Date(cursor.getTime()), new Date(intervalEnd.getTime())])
    cursor = new Date(intervalEnd.getTime())
    cursor.setDate(cursor.getDate() + 1)
  }
  return intervals
}

function dateDiffInDays (fromDate, toDate) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((toDate.getTime() - fromDate.getTime()) / msPerDay)
}

function assertSuccessResponse (response) {
  console.assert(response.body?.success, 'unexpected response', { status: response.status, success: response.body?.success })
}

function setStructType (data, structType) {
  return data.map(acc => {
    acc.structType = structType
    return acc
  })
}

function formatDate (date) {
  // to 01.09.2021
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join('.')
}
