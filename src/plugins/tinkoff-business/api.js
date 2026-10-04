import { Base64 } from 'jshashes'
import { parse, stringify } from 'querystring'
import { convertHeadersToPlainObject, fetchJson, generateRequestLogId } from '../../common/network'
import { sanitizeUrlContainingObject } from '../../common/sanitize'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateRandomString } from '../../common/utils'
import { TemporaryUnavailableError } from '../../errors'
import { getTrustedCertificates } from './certificates'
import config from './config'

const base64 = new Base64()

export class AuthError {}

async function callGate (url, options = {}, predicate = () => true) {
  let response
  try {
    response = await fetchJson(url, {
      method: 'POST',
      sanitizeRequestLog: { headers: { Authorization: true } },
      sanitizeResponseLog: { headers: { 'set-cookie': true } },
      ...options,
      stringify,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers
      }
    })
  } catch (e) {
    if (e.response && typeof e.response.body === 'string' && e.response.body.indexOf('internal server error') >= 0) {
      throw new TemporaryUnavailableError()
    } else {
      throw e
    }
  }
  if (response.body && response.body.errorMessage && [
    'попробуйте позже',
    'временно не доступен'
  ].some(str => response.body.errorMessage.indexOf(str) >= 0)) {
    throw new TemporaryUnavailableError()
  }
  if (predicate) {
    if (response.body && [
      'ACCESS_DENIED',
      'AUTH_REQUIRED',
      'UNAUTHORIZED'
    ].indexOf(response.body.errorCode) >= 0) {
      throw new AuthError()
    }
    console.assert(predicate(response), 'non-successful response')
  }
  return response
}

function logWebViewNavigation (navigation) {
  console.debug('request', sanitizeUrlContainingObject({
    id: generateRequestLogId(),
    url: navigation.url,
    method: navigation.method || 'GET',
    headers: convertHeadersToPlainObject(navigation.headers)
  }, {
    url: {
      query: {
        state: true,
        client_id: true,
        redirect_uri: true,
        scope_parameters: true,
        code: true,
        session_state: true
      }
    }
  }))
}

async function authorizeInWebView (url, state) {
  const webView = new ZenMoney.WebView({
    tls: {
      ca: getTrustedCertificates()
    }
  })
  const redirectUriWithoutProtocol = config.redirectUri.replace(/^https?:\/\//i, '')
  let resolveAuthorized
  let rejectAuthorized
  const authorized = new Promise((resolve, reject) => {
    resolveAuthorized = resolve
    rejectAuthorized = reject
  })
  webView.navigationPolicy = navigation => {
    logWebViewNavigation(navigation)
    const i = navigation.url.indexOf(redirectUriWithoutProtocol)
    if (i < 0) {
      return undefined // LOAD
    }
    const params = parse(navigation.url.substring(i + redirectUriWithoutProtocol.length + 1))
    resolveAuthorized(params.code && params.state === state ? { code: params.code } : { error: params })
    return true // BLOCK
  }
  try {
    await webView.show()
    webView.goto(url, { waitUntil: 'commit' }).catch(rejectAuthorized)
    return await authorized
  } finally {
    setTimeout(async () => {
      await webView.close()
    }, 0)
  }
}

export async function login ({ accessToken, refreshToken, expirationDateMs } = {}, { inn, kpp }, isInBackground) {
  let response
  if (accessToken) {
    if (expirationDateMs < new Date().getTime() + 300000) {
      response = await callGate('https://id.tinkoff.ru/auth/token', {
        headers: {
          Host: 'id.tinkoff.ru',
          Authorization: `Basic ${base64.encode(`${config.clientId}:${config.clientSecret}`)}`
        },
        body: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        sanitizeRequestLog: { headers: { Authorization: true }, body: { refresh_token: true } },
        sanitizeResponseLog: { body: { access_token: true, refresh_token: true, sessionId: true, id_token: true } }
      }, null)
      if (response.body && response.body.error) {
        response = null
      }
    } else {
      return arguments[0]
    }
  }
  if (!response) {
    const state = generateRandomString(16)
    const url = `https://id.tinkoff.ru/auth/authorize?${stringify({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state,
      response_type: 'code',
      scope_parameters: JSON.stringify({
        inn,
        kpp
      })
    })}`
    const { error, code } = await authorizeInWebView(url, state)
    if (error && (!error.error || error.error === 'access_denied')) {
      throw new TemporaryError('Не удалось пройти авторизацию в Тинькофф Бизнес. Попробуйте еще раз')
    }
    console.assert(code && !error, 'non-successfull authorization', error)
    response = await callGate('https://id.tinkoff.ru/auth/token', {
      headers: {
        Host: 'id.tinkoff.ru',
        Authorization: `Basic ${base64.encode(`${config.clientId}:${config.clientSecret}`)}`
      },
      body: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri
      },
      sanitizeRequestLog: { headers: { Authorization: true }, body: { code: true, redirect_uri: true } },
      sanitizeResponseLog: { body: { access_token: true, refresh_token: true, sessionId: true, id_token: true } }
    }, null)
  }
  console.assert(response.body &&
    response.body.access_token &&
    response.body.refresh_token &&
    response.body.expires_in, 'non-successfull authorization', response)
  if (response.body.scope) {
    if ([
      `opensme/inn/[${inn}]/kpp/[${kpp}]/bank-statements/get`,
      `opensme/inn/[${inn}]/kpp/[${kpp}]/bank-accounts/get`
    ].some(scope => response.body.scope.indexOf(scope) < 0)) {
      throw new TemporaryError('Недостаточно прав для просмотра счетов и операций. Попробуйте подключить синхронизацию заново.')
    }
  }
  return {
    accessToken: response.body.access_token,
    refreshToken: response.body.refresh_token,
    expirationDateMs: new Date().getTime() + response.body.expires_in * 1000
  }
}

export async function fetchAccounts ({ accessToken }, { inn }) {
  const response = await callGate('https://business.tinkoff.ru/openapi/api/v4/bank-accounts', {
    method: 'GET',
    headers: {
      Host: 'business.tinkoff.ru',
      Authorization: `Bearer ${accessToken}`
    }
  })
  const errorMessage = response.body.errorText || response.body.errorMessage
  if (response.body.errorCode === 'INVALID_DATA' && errorMessage && [
    'Некорректные символы в ИНН компании'
  ].some(str => errorMessage.indexOf(str) >= 0)) {
    throw new InvalidPreferencesError('Неверный ИНН компании')
  }
  if (response.body.errorCode === 'FORBIDDEN' && errorMessage && [
    'Компания с такими данными не найдена'
  ].some(str => errorMessage.indexOf(str) >= 0)) {
    throw new InvalidPreferencesError('Неверный ИНН или КПП компании')
  }
  if (response.body.errorCode === 'FORBIDDEN' && errorMessage && [
    'Недостаточно прав на совершаемое действие',
    'У вас неподходящие скопы для данной операции'
  ].some(str => errorMessage.indexOf(str) >= 0)) {
    throw new TemporaryError('Недостаточно прав для просмотра счетов и операций. Попробуйте подключить синхронизацию заново.')
  }
  return response.body || []
}

function formatDate (date) {
  return date.getUTCFullYear() + '-' +
    toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + '-' +
    toAtLeastTwoDigitsString(date.getUTCDate())
}

export async function fetchTransactions ({ accessToken }, { inn }, { id }, fromDate, toDate) {
  const response = await callGate('https://business.tinkoff.ru/openapi/api/v1/bank-statement?' +
    `accountNumber=${id}` +
    `&from=${encodeURIComponent(formatDate(fromDate))}` +
    `&till=${encodeURIComponent(formatDate(toDate))}`, {
    method: 'GET',
    headers: {
      Host: 'business.tinkoff.ru',
      Authorization: `Bearer ${accessToken}`
    }
  })
  return response.body.operation
}
