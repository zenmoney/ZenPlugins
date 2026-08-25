import Base64 from 'crypto-js/enc-base64'
import SHA256 from 'crypto-js/sha256'
import { fetchJson } from '../../common/network'
import { generateUUID } from '../../common/utils'
import {
  InvalidLoginOrPasswordError,
  InvalidOtpCodeError,
  InvalidPreferencesError,
  TemporaryError,
  UserInteractionError
} from '../../errors'

const API_URL = 'https://online.ukrsibbank.com/clientendpoint'
const APP_VERSION = '2.264.0'
const AUTH_SCHEMA_VERSION = 1
const PAGE_SIZE = 50
const INVALID_LOGIN_CODES = new Set(['2071'])
const TOKEN_REJECTION_CODES = new Set(['TOKEN_EXPIRED', 'TOKEN_INVALID', '2003', '2050'])
const OTP_REQUIRED_CODES = new Set(['OTP_REQUIRED', '2020', '2021', '2048'])
const POST_LOGIN_ACTIONS = new Set([
  'MUST_SET_PASSWORD',
  'SHOULD_UPDATE_EMAIL',
  'SHOULD_UPDATE_SECURITY_QUESTIONS',
  'MRS_INVITATION',
  'INSTALMENT_PAYMENT_ENABLE'
])

const COMMON_REQUEST_LOG_MASK = {
  headers: {
    authorization: true,
    RefreshToken: true,
    refreshtoken: true,
    otpId: true,
    otpid: true,
    otpValue: true,
    otpvalue: true
  },
  body: {
    phone: true,
    password: true,
    secretString: true
  }
}

const COMMON_RESPONSE_LOG_MASK = {
  headers: {
    authorization: true,
    refreshtoken: true,
    'set-cookie': true,
    dossierid: true,
    userid: true,
    loginsessionid: true
  },
  body: {
    holderName: true,
    loginSessionId: true,
    userId: true,
    pan: maskCardNumberForLog,
    cardNumber: maskCardNumberForLog
  }
}

export class SessionExpiredError extends Error {
  constructor (code) {
    super(`UKRSIB hot authorization was rejected with code ${code}`)
    this.code = code
  }
}

function normalizeText (value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function maskCardNumberForLog (value) {
  if (typeof value !== 'string' && typeof value !== 'number') return value
  const digits = String(value).replace(/\s/g, '')
  return /^\d{12,19}$/.test(digits)
    ? `${digits.slice(0, 6)}${'*'.repeat(digits.length - 10)}${digits.slice(-4)}`
    : value
}

export function normalizePhone (value) {
  const phone = normalizeText(value)?.replace(/[\s()-]/g, '')
  const match = /^(?:\+?380|0)?(\d{9})$/.exec(phone || '')
  if (!match) {
    throw new InvalidPreferencesError('Вкажіть номер телефону у форматі +380XXXXXXXXX')
  }
  return `+380${match[1]}`
}

export function validatePreferences (preferences) {
  const password = normalizeText(preferences?.password)
  if (!password) {
    throw new InvalidPreferencesError('Вкажіть пароль від UKRSIB online')
  }
  return {
    login: normalizePhone(preferences?.login),
    password
  }
}

function getRuntimeDevice () {
  return typeof ZenMoney === 'object' && ZenMoney?.device
    ? ZenMoney.device
    : {}
}

function isUuid (value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function normalizeDevice (storedDevice = {}) {
  const runtimeDevice = getRuntimeDevice()
  const legacyFingerprint = storedDevice.fingerprint
  return {
    deviceId: isUuid(storedDevice.deviceId)
      ? storedDevice.deviceId
      : isUuid(legacyFingerprint) ? legacyFingerprint : generateUUID(),
    screenResolution: normalizeText(storedDevice.screenResolution) || '1080x2400',
    model: normalizeText(storedDevice.model) || normalizeText(runtimeDevice.model) || 'ZenMoney Phone',
    manufacturer: normalizeText(storedDevice.manufacturer) || normalizeText(runtimeDevice.brand) || 'ZenMoney',
    os: normalizeText(storedDevice.os) || 'Android 15'
  }
}

function hashLogin (login) {
  return SHA256(login).toString()
}

function createAuthState (login, storedState = {}) {
  const storedAuth = storedState.auth || storedState
  const storedDevice = storedAuth.device || storedState.device || {}
  const compatible = storedAuth.schemaVersion === AUTH_SCHEMA_VERSION &&
    storedAuth.loginHash === hashLogin(login)
  return {
    schemaVersion: AUTH_SCHEMA_VERSION,
    loginHash: hashLogin(login),
    device: normalizeDevice(storedDevice),
    authorization: compatible ? normalizeText(storedAuth.authorization) : null,
    refreshToken: compatible ? normalizeText(storedAuth.refreshToken) : null,
    tokenValidUntil: compatible && Number.isFinite(storedAuth.tokenValidUntil)
      ? storedAuth.tokenValidUntil
      : null,
    dossierId: compatible ? normalizeText(storedAuth.dossierId) : null
  }
}

function hasHotAuth (authState) {
  return Boolean(authState.authorization && authState.refreshToken)
}

function createCommonHeaders (authState) {
  const device = authState.device
  return {
    screenResolution: device.screenResolution,
    deviceId: device.deviceId,
    language: 'UK',
    channel: 'MOBILE',
    deviceModel: device.model,
    deviceManufacturer: device.manufacturer,
    clientVersion: APP_VERSION,
    clientPlatform: 'Android',
    os: device.os,
    requestId: generateUUID().replace(/-/g, ''),
    ...authState.authorization && { authorization: authState.authorization }
  }
}

function updateAuthState (authState, response) {
  const authorization = normalizeText(response.headers.authorization)
  const refreshToken = normalizeText(response.headers.refreshtoken)
  const tokenValidFor = Number(response.headers.tokenvalidfor)
  const dossierId = normalizeText(response.headers.dossierid)
  if (authorization) authState.authorization = authorization
  if (refreshToken) authState.refreshToken = refreshToken
  if (Number.isFinite(tokenValidFor) && tokenValidFor > 0) {
    authState.tokenValidUntil = Date.now() + tokenValidFor
  }
  if (dossierId) authState.dossierId = dossierId
}

function getErrorCode (body) {
  return normalizeText(body?.errorCode)
}

function getOtpData (body) {
  const data = body?.errorData
  if (!data || typeof data !== 'object') return null
  return {
    otpId: normalizeText(data.otpId),
    expiredTimeout: Number(data.expiredTimeout),
    otpLength: Number(data.otpLength)
  }
}

function assertSuccessfulResponse (response, method, path) {
  const errorCode = getErrorCode(response.body)
  console.assert(response.ok, 'UKRSIB API request failed', {
    method,
    path,
    status: response.status,
    errorCode,
    errorKey: normalizeText(response.body?.key),
    hasErrorData: Boolean(response.body?.errorData)
  })
}

async function request (authState, path, options = {}) {
  const method = options.method || 'GET'
  const headers = {
    ...createCommonHeaders(authState),
    ...options.refreshToken && { RefreshToken: options.refreshToken },
    ...options.otpId && { otpId: options.otpId },
    ...options.otpValue && { otpValue: options.otpValue }
  }
  const response = await fetchJson(`${API_URL}${path}`, {
    method,
    headers,
    ...options.body !== undefined && { body: options.body },
    sanitizeRequestLog: COMMON_REQUEST_LOG_MASK,
    sanitizeResponseLog: {
      ...COMMON_RESPONSE_LOG_MASK,
      body: {
        ...COMMON_RESPONSE_LOG_MASK.body,
        ...options.sanitizeResponseBody
      }
    }
  })
  updateAuthState(authState, response)

  if (response.ok) return response.body

  const errorCode = getErrorCode(response.body)
  if (path === '/auth/login' && INVALID_LOGIN_CODES.has(errorCode)) {
    throw new InvalidLoginOrPasswordError('Неправильний номер телефону або пароль')
  }
  if (options.allowSessionExpiry && TOKEN_REJECTION_CODES.has(errorCode)) {
    throw new SessionExpiredError(errorCode)
  }

  if (OTP_REQUIRED_CODES.has(errorCode)) {
    const otpData = getOtpData(response.body)
    console.assert(otpData?.otpId, 'UKRSIB OTP response is missing otpId', {
      path,
      status: response.status,
      errorCode
    })
    if (options.otpValue) {
      throw new InvalidOtpCodeError()
    }
    if (options.isInBackground) {
      throw new UserInteractionError()
    }
    const timeoutSeconds = Number.isFinite(otpData.expiredTimeout) && otpData.expiredTimeout > 0
      ? otpData.expiredTimeout
      : 120
    const code = await ZenMoney.readLine('Введіть код із SMS або push-повідомлення від UKRSIBBANK', {
      inputType: 'number',
      time: timeoutSeconds * 1000
    })
    if (!normalizeText(code)) throw new InvalidOtpCodeError()
    return request(authState, path, {
      ...options,
      otpId: otpData.otpId,
      otpValue: String(code)
    })
  }

  assertSuccessfulResponse(response, method, path)
  return undefined
}

function createVerifyAppSecret (device) {
  return Base64.stringify(SHA256([
    device.deviceId,
    device.model,
    device.screenResolution,
    device.os
  ].join('.')))
}

async function verifyApp (authState, isInBackground) {
  authState.authorization = null
  authState.refreshToken = null
  await request(authState, '/auth/verify-app', {
    method: 'POST',
    isInBackground,
    body: { secretString: createVerifyAppSecret(authState.device) }
  })
  console.assert(authState.authorization, 'UKRSIB verify-app response is missing authorization header', {
    clientVersion: APP_VERSION
  })
}

async function coldAuth (credentials, authState, isInBackground) {
  await verifyApp(authState, isInBackground)
  if (isInBackground) throw new UserInteractionError()
  await request(authState, '/auth/login', {
    method: 'POST',
    isInBackground,
    body: {
      phone: credentials.login,
      password: credentials.password
    }
  })
  console.assert(authState.authorization && authState.refreshToken, 'UKRSIB login response is missing authorization state', {
    hasAuthorization: Boolean(authState.authorization),
    hasRefreshToken: Boolean(authState.refreshToken)
  })
}

async function refreshAuth (authState, isInBackground) {
  await request(authState, '/auth/refreshtoken', {
    method: 'GET',
    refreshToken: authState.refreshToken,
    isInBackground,
    allowSessionExpiry: true
  })
  console.assert(authState.authorization && authState.refreshToken, 'UKRSIB refresh response is missing authorization state', {
    hasAuthorization: Boolean(authState.authorization),
    hasRefreshToken: Boolean(authState.refreshToken)
  })
}

async function validatePostLoginActions (authState, isInBackground) {
  const response = await request(authState, '/profile/postlogin-actions/mandatory', {
    isInBackground,
    allowSessionExpiry: true
  })
  console.assert(response && Array.isArray(response.actions), 'UKRSIB post-login actions response is malformed', {
    hasResponse: Boolean(response),
    actionsType: response?.actions === null ? 'null' : typeof response?.actions
  })
  const actions = response.actions.map(action => typeof action === 'string' ? action : null)
  console.assert(actions.every(action => POST_LOGIN_ACTIONS.has(action)), 'UKRSIB post-login action is unsupported', {
    actionCount: actions.length,
    actions
  })
  if (actions.includes('MUST_SET_PASSWORD')) {
    throw new TemporaryError('Відкрийте застосунок UKRSIB online 2.0 та встановіть новий пароль, потім повторіть синхронізацію.')
  }
  if (actions.includes('SHOULD_UPDATE_EMAIL')) {
    throw new TemporaryError('Відкрийте застосунок UKRSIB online 2.0 та додайте або оновіть email, потім повторіть синхронізацію.')
  }
}

export async function login (preferences, isInBackground, storedState = {}) {
  const credentials = validatePreferences(preferences)
  const authState = createAuthState(credentials.login, storedState)
  if (hasHotAuth(authState)) {
    try {
      await refreshAuth(authState, isInBackground)
      await validatePostLoginActions(authState, isInBackground)
      return { authState, isInBackground: Boolean(isInBackground) }
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) throw error
      console.info('UKRSIB hot authorization was rejected; starting cold authorization', {
        code: error.code
      })
      authState.authorization = null
      authState.refreshToken = null
      authState.tokenValidUntil = null
    }
  }
  await coldAuth(credentials, authState, isInBackground)
  await validatePostLoginActions(authState, isInBackground)
  return { authState, isInBackground: Boolean(isInBackground) }
}

async function authorizedRequest (session, path, options = {}, canRefresh = true) {
  try {
    return await request(session.authState, path, {
      ...options,
      isInBackground: session.isInBackground,
      allowSessionExpiry: true
    })
  } catch (error) {
    if (!(error instanceof SessionExpiredError) || !canRefresh) throw error
    await refreshAuth(session.authState, session.isInBackground)
    return authorizedRequest(session, path, options, false)
  }
}

export async function fetchProducts (session) {
  const [accounts, deposits, loanResponse] = await Promise.all([
    authorizedRequest(session, '/product/accountlite'),
    authorizedRequest(session, '/product/deposit'),
    authorizedRequest(session, '/product/v2/loan')
  ])
  console.assert(Array.isArray(accounts), 'UKRSIB accounts response is not an array', {
    actualType: accounts === null ? 'null' : typeof accounts
  })
  console.assert(Array.isArray(deposits), 'UKRSIB deposits response is not an array', {
    actualType: deposits === null ? 'null' : typeof deposits
  })
  console.assert(loanResponse && (loanResponse.loans == null || Array.isArray(loanResponse.loans)), 'UKRSIB loans response is malformed', {
    hasResponse: Boolean(loanResponse),
    loansType: loanResponse?.loans === null ? 'null' : typeof loanResponse?.loans
  })
  const cardsByAccount = await Promise.all(accounts.map(async account => {
    const cards = await authorizedRequest(session, `/product/cardlite?accountId=${encodeURIComponent(String(account.id))}`, {
      sanitizeResponseBody: {
        holderName: true,
        pan: maskCardNumberForLog,
        cardNumber: maskCardNumberForLog,
        number: maskCardNumberForLog
      }
    })
    console.assert(Array.isArray(cards), 'UKRSIB cards response is not an array', {
      accountId: String(account.id),
      actualType: cards === null ? 'null' : typeof cards
    })
    return cards
  }))
  return {
    accounts,
    cards: cardsByAccount.flat(),
    deposits,
    loans: loanResponse.loans || []
  }
}

function dateToTimestamp (value, fieldName) {
  if (value == null) return null
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime()
  console.assert(Number.isFinite(timestamp), 'UKRSIB transaction interval date is invalid', {
    fieldName,
    actualType: typeof value
  })
  return timestamp
}

export async function fetchTransactions (session, fromDate, toDate) {
  const transactions = []
  const seenPages = new Set()
  let offset = 0
  const dateFrom = dateToTimestamp(fromDate, 'fromDate')
  const dateTo = dateToTimestamp(toDate, 'toDate')
  while (true) {
    const page = await authorizedRequest(session, '/product/transactions', {
      method: 'POST',
      body: {
        ...dateFrom != null && { dateFrom },
        ...dateTo != null && { dateTo },
        offset,
        count: PAGE_SIZE
      }
    })
    console.assert(Array.isArray(page), 'UKRSIB transactions response is not an array', {
      offset,
      actualType: page === null ? 'null' : typeof page
    })
    const signature = page.map(transaction => String(transaction?.id)).join('|')
    console.assert(page.length < PAGE_SIZE || !seenPages.has(signature), 'UKRSIB transaction pagination repeated a full page', {
      offset,
      count: page.length
    })
    seenPages.add(signature)
    transactions.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += page.length
  }
  return transactions
}
