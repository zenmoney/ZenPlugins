import { defaultsDeep } from 'lodash'
import forge from 'node-forge'
import { stringify } from 'querystring'
import { getByteStringFromString } from '../../common/byteStringUtils'
import { toISODateString } from '../../common/dateUtils'
import { fetch as fetchText, fetchJson } from '../../common/network'
import { generateUUID } from '../../common/utils'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, InvalidPreferencesError, TemporaryUnavailableError } from '../../errors'

const host = 'digital.sber-bank.by'
const apiBaseUrl = `https://${host}/SBOLServer`
const authBaseUrl = `https://${host}/api/sbol-auth/v1`
const internalAuthHost = 'sbol-auth.apps.k8s-prom1.belpsb.by'
const authRedirectUri = `https://${host}/loginsbol`
const appVersion = '4.1.10'
const sbolClientId = 'sbol-client'
const sbolClientSecret = 'BzKFqWMa2T2Y'
const defaultKeyValueSeparator = ':'
const unknownDeviceErrorCodes = [
  'sbol.auth.unknown-device.error',
  'sbol.auth.untrusted-device.error'
]

export class AuthError {}

export function getAuthToken ({ login, password }) {
  return 'Basic ' + forge.util.encode64(getByteStringFromString(login) + defaultKeyValueSeparator + getByteStringFromString(password))
}

function getSbolClientAuthToken () {
  return getAuthToken({
    login: sbolClientId,
    password: sbolClientSecret
  })
}

export function generateDevice (device) {
  if (!device) {
    return {
      androidId: generateUUID().split('-').join('').substring(0, 16),
      udid: generateUUID()
    }
  } else {
    return {
      androidId: device.androidId,
      udid: device.udid
    }
  }
}

function getDeviceModel () {
  return ZenMoney.device?.model || 'Sync'
}

function getDeviceManufacturer () {
  return ZenMoney.device?.manufacturer || ZenMoney.device?.brand || 'ZenMoney'
}

function getDeviceOsVersion () {
  return ZenMoney.device?.osVersion || ZenMoney.device?.androidVersion || '14'
}

function getUserAgent () {
  return `sbol/${appVersion} (android ${getDeviceOsVersion()}) ${getDeviceModel()}`
}

function getSbolHeaders (device, headers = {}) {
  return {
    ...headers,
    Accept: 'application/json; charset=UTF-8',
    'X-Sbol-Os': 'android',
    'X-Sbol-Version': appVersion,
    'X-Sbol-Id': device.androidId,
    'User-Agent': getUserAgent(),
    Host: host,
    Connection: 'Keep-Alive',
    'Accept-Encoding': 'gzip'
  }
}

function generateHex (bytes) {
  return forge.util.bytesToHex(forge.random.getBytesSync(bytes))
}

function getTraceparentHeader () {
  return `00-${generateHex(16)}-${generateHex(8)}-01`
}

async function callGate (url, options = {}) {
  const headers = getSbolHeaders(options.device, {
    ...options.sessionId && { 'X-Sbol-Session-Id': options.sessionId },
    ...options.headers
  })

  const response = await fetchJson(url, {
    stringify,
    ...options,
    headers,
    sanitizeRequestLog: defaultsDeep({ headers: { 'X-Sbol-Id': true } }, options && options.sanitizeRequestLog),
    sanitizeResponseLog: defaultsDeep({ body: { access_token: true, refresh_token: true } }, options && options.sanitizeResponseLog)
  })
  if (response.body && response.body.errorInfo && response.body.errorInfo.errorCode === '1') {
    throw new TemporaryUnavailableError() // Сервис временно недоступен
  }
  return response
}

async function prepareDevice (device) {
  return callGate(`${apiBaseUrl}/rest/registration/prepareDevice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: {
      udId: device.udid
    },
    sanitizeRequestLog: { body: { udId: true } },
    device,
    stringify: JSON.stringify
  })
}

async function trustDevice (smsCode, device) {
  return callGate(`${apiBaseUrl}/rest/registration/trustedDevice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: {
      smsCode,
      udId: device.udid
    },
    sanitizeRequestLog: { body: { smsCode: true, udId: true } },
    device,
    stringify: JSON.stringify
  })
}

function base64UrlEncode (byteString) {
  return forge.util.encode64(byteString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateCodeVerifier () {
  return base64UrlEncode(forge.random.getBytesSync(64))
}

function generateCodeChallenge (verifier) {
  const md = forge.md.sha256.create()
  md.update(verifier, 'utf8')
  return base64UrlEncode(md.digest().getBytes())
}

function parseBody (body) {
  if (typeof body !== 'string' || body.length === 0) {
    return body
  }
  try {
    return JSON.parse(body)
  } catch (e) {
    return body
  }
}

function getHeader (response, name) {
  return response.headers[name.toLowerCase()] || response.headers[name]
}

function addResponseCookies (cookies, response) {
  const setCookie = getHeader(response, 'set-cookie')
  if (!setCookie) {
    return
  }
  const cookieHeaders = Array.isArray(setCookie) ? setCookie : [setCookie]
  for (const cookieHeader of cookieHeaders) {
    for (const cookie of String(cookieHeader).split(/,(?=\s*[^;,]+=)/g)) {
      const pair = cookie.split(';')[0]
      const separatorIndex = pair.indexOf('=')
      if (separatorIndex < 0) {
        continue
      }
      const name = pair.substring(0, separatorIndex).trim()
      const value = pair.substring(separatorIndex + 1).trim()
      if (value) {
        cookies[name] = value
      } else {
        delete cookies[name]
      }
    }
  }
}

function getCookieHeader (cookies) {
  return Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join('; ')
}

function resolveAuthUrl (url) {
  const resolvedUrl = new URL(url, `${authBaseUrl}/`)
  if (resolvedUrl.hostname === internalAuthHost) {
    const publicAuthBasePath = new URL(authBaseUrl).pathname
    resolvedUrl.protocol = 'https:'
    resolvedUrl.hostname = host
    if (!resolvedUrl.pathname.startsWith(`${publicAuthBasePath}/`)) {
      resolvedUrl.pathname = `${publicAuthBasePath}${resolvedUrl.pathname}`
    }
  }
  return resolvedUrl.toString()
}

function getAuthCodeFromLocation (location) {
  if (!location || location.indexOf(authRedirectUri) !== 0) {
    return null
  }
  return new URL(location).searchParams.get('code')
}

function isRedirect (response) {
  return response.status >= 300 && response.status < 400 && Boolean(getHeader(response, 'location'))
}

function isInternalAuthRootLocation (location) {
  if (!location) {
    return false
  }
  const parsedLocation = new URL(location, `${authBaseUrl}/`)
  return parsedLocation.hostname === internalAuthHost && parsedLocation.pathname === '/'
}

function getAuthorizeUrl (codeChallenge, extraParams = {}) {
  return `${authBaseUrl}/oauth2/authorize?${stringify({
    response_type: 'code',
    scope: 'read',
    client_id: sbolClientId,
    redirect_uri: authRedirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    ...extraParams
  })}`
}

function getLoginErrorDescription (response) {
  return response.body?.errorDescription || response.body?.error_description || response.body?.message
}

function isInvalidLoginOrPassword (response) {
  const errorCode = response.body?.errorCode || response.body?.error
  const errorDescription = getLoginErrorDescription(response) || ''
  return errorCode === 'sbol.auth.correct-login-password.error' ||
    errorDescription.indexOf('Неверный логин или пароль') >= 0 ||
    errorDescription.indexOf('Invalid username or password') >= 0
}

function isUnknownDeviceResponse (response) {
  const errorCode = response.body?.errorCode
  const sbolStatus = getHeader(response, 'sbol-status')
  return response.status === 428 ||
    unknownDeviceErrorCodes.includes(errorCode) ||
    ['new_device', 'unknown_device', 'untrusted_device'].includes(sbolStatus)
}

function handleLoginFailureResponse (response) {
  if (isInvalidLoginOrPassword(response)) {
    throw new InvalidLoginOrPasswordError()
  }
  const description = getLoginErrorDescription(response)
  if (description) {
    throw new BankMessageError(description)
  }
  console.assert(false, 'Unknown login error', response)
}

async function fetchOAuth (url, { skipSbolHeaders = false, ...options } = {}) {
  const oauthHeaders = {
    ...options.headers,
    traceparent: getTraceparentHeader()
  }
  const headers = skipSbolHeaders
    ? oauthHeaders
    : getSbolHeaders(options.device, oauthHeaders)
  const response = await fetchText(url, {
    stringify,
    redirect: 'manual',
    ...options,
    headers,
    sanitizeRequestLog: defaultsDeep({ headers: { Authorization: true, Cookie: true, 'X-Sbol-Id': true }, url: { query: { code_challenge: true } } }, options && options.sanitizeRequestLog),
    sanitizeResponseLog: defaultsDeep({ headers: { 'set-cookie': true, location: true }, body: true }, options && options.sanitizeResponseLog)
  })
  response.body = parseBody(response.body)
  return response
}

async function requestOAuthToken (auth, device) {
  const sessionId = generateUUID()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const cookies = {}

  const authorizeResponse = await fetchOAuth(getAuthorizeUrl(codeChallenge), {
    method: 'GET',
    device,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'X-Sbol-Model': getDeviceModel(),
      'X-Sbol-Name': getDeviceManufacturer(),
      'X-Sbol-DevOS': `android ${getDeviceOsVersion()}`
    }
  })
  addResponseCookies(cookies, authorizeResponse)
  if (authorizeResponse.status !== 200) {
    return {
      response: authorizeResponse,
      sessionId
    }
  }

  const loginResponse = await fetchOAuth(`${authBaseUrl}/oauth2/login`, {
    method: 'POST',
    device,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      provider: 'BASIC',
      // The mobile app sends this header through BizoneInterceptor even when the report is unavailable.
      'X-Sbol-Sdk': '',
      'X-Sbol-Session-Id': sessionId,
      'X-Geo-Consent': 'true',
      Cookie: getCookieHeader(cookies)
    },
    body: {
      username: auth.login,
      password: auth.password
    },
    sanitizeRequestLog: { headers: { Cookie: true, 'X-Sbol-Id': true }, body: { username: true, password: true } }
  })
  addResponseCookies(cookies, loginResponse)
  if (!isRedirect(loginResponse)) {
    return {
      response: loginResponse,
      sessionId
    }
  }

  const loginLocation = getHeader(loginResponse, 'location')
  // The app gets an internal root Location here; public ingress needs the original authorize endpoint with continue=true.
  const continueUrl = isInternalAuthRootLocation(loginLocation)
    ? getAuthorizeUrl(codeChallenge, { continue: true })
    : resolveAuthUrl(loginLocation)
  const continueResponse = await fetchOAuth(continueUrl, {
    method: 'GET',
    skipSbolHeaders: true,
    device,
    headers: {
      Cookie: getCookieHeader(cookies)
    }
  })
  addResponseCookies(cookies, continueResponse)
  const authCode = getAuthCodeFromLocation(getHeader(continueResponse, 'location'))
  if (!isRedirect(continueResponse) || !authCode) {
    return {
      response: continueResponse,
      sessionId
    }
  }

  const tokenResponse = await fetchOAuth(`${authBaseUrl}/oauth2/token`, {
    method: 'POST',
    device,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Authorization: getSbolClientAuthToken(),
      'X-Sbol-Session-Id': sessionId
    },
    body: {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: authRedirectUri,
      client_id: sbolClientId,
      code_verifier: codeVerifier
    },
    sanitizeRequestLog: { headers: { Authorization: true, 'X-Sbol-Id': true }, body: { code: true, code_verifier: true } }
  })
  return {
    response: tokenResponse,
    sessionId
  }
}

async function initiateLoginSequence (auth, device) {
  const newDevice = generateDevice(device)
  let loginResult = await requestOAuthToken(auth, newDevice)
  if (isUnknownDeviceResponse(loginResult.response)) {
    const sbolUdid = getHeader(loginResult.response, 'sbol-udid')
    if (sbolUdid) {
      newDevice.udid = sbolUdid
    }
    let response = await prepareDevice(newDevice)
    console.assert(response.body.errorInfo.errorCode === '0', 'Error while registering device.', response)

    const code = await ZenMoney.readLine('Введите код из SMS')
    response = await trustDevice(code, newDevice)
    if (response.body.errorInfo.errorCode === '1') {
      throw new InvalidOtpCodeError()
    } else {
      console.assert(response.body.errorInfo.errorCode === '0', 'Error while registering device.', response)
    }

    loginResult = await requestOAuthToken(auth, newDevice)
  }
  const response = loginResult.response
  if (!response.body?.access_token) {
    handleLoginFailureResponse(response)
  }
  return {
    response,
    device: newDevice,
    sessionId: loginResult.sessionId
  }
}

export async function updateToken (auth) {
  if (!auth.refreshToken || !auth.sessionId) {
    return login(auth, auth.device)
  }
  const response = await fetchOAuth(`${authBaseUrl}/oauth2/token`, {
    method: 'POST',
    device: auth.device,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Authorization: getSbolClientAuthToken(),
      'X-Sbol-Session-Id': auth.sessionId
    },
    body: {
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
      client_id: sbolClientId
    },
    sanitizeRequestLog: { headers: { Authorization: true, 'X-Sbol-Id': true }, body: { refresh_token: true } }
  })
  if (!response.body?.access_token) {
    return login(auth, auth.device)
  }
  return {
    ...auth,
    token: response.body.access_token,
    refreshToken: response.body.refresh_token || auth.refreshToken
  }
}

async function fetchListMoneyBox (auth) {
  const response = await callGate(`${apiBaseUrl}/rest/client/getListMoneybox`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + auth.token
    },
    sanitizeRequestLog: { headers: { Authorization: true } },
    device: auth.device,
    sessionId: auth.sessionId
  })
  if (response.body.error === 'invalid_token') {
    throw new AuthError()
  }
  console.assert(response.body.moneyboxs, 'Error fetching MoneyBoxs List.', response)
  return response.body.moneyboxs
}

export async function login ({ login, password }, device) {
  if (password === login) {
    throw new InvalidPreferencesError('Логин и пароль не могут быть одинаковыми')
  }
  if (password.length < 8) {
    throw new InvalidPreferencesError('Пароль должен быть не менее 8 символов')
  }
  const loginResult = await initiateLoginSequence({
    login,
    password
  }, device)
  const accessToken = loginResult.response.body.access_token
  return {
    login,
    password,
    token: accessToken,
    refreshToken: loginResult.response.body.refresh_token,
    sessionId: loginResult.sessionId,
    device: loginResult.device
  }
}

export async function fetchAccounts (auth) {
  const response = await callGate(`${apiBaseUrl}/rest/client/contracts`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + auth.token
    },
    sanitizeRequestLog: { headers: { Authorization: true } },
    device: auth.device,
    sessionId: auth.sessionId
  })
  if (response.body.error === 'invalid_token') {
    throw new AuthError()
  }
  if (response.body.contracts) {
    const moneyBoxes = await fetchListMoneyBox(auth)
    const accounts = response.body.contracts
    await updateBalances(auth, accounts)
    return {
      accounts,
      moneyBoxes
    }
  }
  console.assert(false, 'Error fetching accounts.', response)
}

export async function updateBalances (auth, accounts) {
  await Promise.all(accounts.map(async (account) => {
    if (account.cardList && account.cardList.length > 0) {
      const card = account.cardList[0]
      const response = await callGate(`${apiBaseUrl}/rest/client/balance`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + auth.token,
          'Content-Type': 'application/json;charset=UTF-8'
        },
        body: {
          cardExpire: card.yearEnd + '-' + card.monthEnd + '-15',
          cardId: card.cardId,
          currency: +account.currencyCode
        },
        sanitizeRequestLog: { headers: { Authorization: true } }, // , body: { cardExpire: true, cardId: true, currency: true } },
        device: auth.device,
        sessionId: auth.sessionId,
        stringify: JSON.stringify
      })
      console.assert(response.body.errorInfo && response.body.errorInfo.errorCode === '0', 'Error while getting actual balance for account', account)
      updateAccountBalance(account, response)
    }
  })
  )
}

export function updateAccountBalance (account, response) {
  account.amount = response.body.amount
  account.overdraftLimit = response.body.overdraft
}

export async function fetchTransactions (auth, products, fromDate, toDate, contractNumber = []) {
  const transactions = []
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: 'Bearer ' + auth.token
    },
    sanitizeRequestLog: { headers: { Authorization: true } },
    device: auth.device,
    sessionId: auth.sessionId,
    stringify: JSON.stringify
  }
  const response = await callGate(`${apiBaseUrl}/rest/client/events`, {
    ...options,
    body: {
      contractNumber,
      endDate: toISODateString(toDate),
      startDate: toISODateString(fromDate)
    }
  })
  if (response.body.error === 'invalid_token') {
    throw new AuthError()
  }
  if (response.body.event) {
    transactions.push(...response.body.event)
    return transactions
  }
  console.assert(false, 'Error fetching transactions,', response)
}
