import { Base64 } from 'jshashes'
import { parse, stringify } from 'querystring'
import { fetchJson } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { generateRandomString } from '../../common/utils'
import { IncompatibleVersionError } from '../../errors'
import { clientId, clientSecret, redirectUri } from './config'

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
      stringify: stringify,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers
      }
    })
  } catch (e) {
    if (e.response && typeof e.response.body === 'string' && e.response.body.indexOf('internal server error') >= 0) {
      throw new TemporaryError('Информация из Тинькофф Бизнес временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
    } else {
      throw e
    }
  }
  if (response.body && response.body.errorMessage && [
    'попробуйте позже',
    'временно не доступен'
  ].some(str => response.body.errorMessage.indexOf(str) >= 0)) {
    throw new TemporaryError('Информация из Тинькофф Бизнес временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
  }
  if (predicate) {
    if (response.body && (
      response.body.errorCode === 'AUTH_REQUIRED' ||
      response.body.errorCode === 'ACCESS_DENIED')) {
      throw new AuthError()
    }
    console.assert(predicate(response), 'non-successful response')
  }
  return response
}

export async function login ({ accessToken, refreshToken, expirationDateMs } = {}) {
  let response
  if (accessToken) {
    if (expirationDateMs < new Date().getTime() + 300000) {
      response = await callGate('https://sso.tinkoff.ru/secure/token', {
        headers: {
          Host: 'sso.tinkoff.ru'
        },
        body: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          fingerprint: '{}'
        },
        sanitizeRequestLog: { body: { refresh_token: true } },
        sanitizeResponseLog: { body: { access_token: true, refresh_token: true, sessionId: true } }
      }, null)
      if (response.body && response.body.error) {
        response = null
        accessToken = null
      }
    } else {
      return arguments[0]
    }
  }
  if (accessToken) {
    // nothing
  } else if (ZenMoney.openWebView) {
    const { error, code } = await new Promise((resolve) => {
      const state = generateRandomString(16)
      const redirectUriWithoutProtocol = redirectUri.replace(/^https?:\/\//i, '')
      const url = `https://sso.tinkoff.ru/authorize?${stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
        state: state
      })}`
      ZenMoney.openWebView(url, null, (request, callback) => {
        const i = request.url.indexOf(redirectUriWithoutProtocol)
        if (i < 0) {
          return
        }
        const params = parse(request.url.substring(i + redirectUriWithoutProtocol.length + 1))
        if (params.code && params.state === state) {
          callback(null, params.code)
        } else {
          callback(params)
        }
      }, (error, code) => resolve({ error, code }))
    })
    if (error && (!error.error || error.error === 'access_denied')) {
      throw new TemporaryError('Не удалось пройти авторизацию в Тинькофф Бизнес. Попробуйте еще раз')
    }
    console.assert(code && !error, 'non-successfull authorization', error)
    response = await callGate('https://sso.tinkoff.ru/secure/token', {
      headers: {
        Host: 'sso.tinkoff.ru',
        Authorization: `Basic ${base64.encode(`${clientId}:${clientSecret}`)}`
      },
      body: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      },
      sanitizeRequestLog: { body: { code: true } },
      sanitizeResponseLog: { body: { access_token: true, refresh_token: true, sessionId: true, id_token: true } }
    }, null)
  } else {
    throw new IncompatibleVersionError()
  }
  console.assert(response.body &&
    response.body.access_token &&
    response.body.refresh_token &&
    response.body.expires_in, 'non-successfull authorization', response)
  return {
    accessToken: response.body.access_token,
    refreshToken: response.body.refresh_token,
    expirationDateMs: new Date().getTime() + response.body.expires_in * 1000
  }
}

export async function fetchAccounts ({ accessToken }, { inn }) {
  const response = await callGate(`https://sme-partner.tinkoff.ru/api/v1/partner/company/${inn}/accounts`, {
    method: 'GET',
    headers: {
      Host: 'sme-partner.tinkoff.ru',
      Authorization: `Bearer ${accessToken}`
    }
  })
  if (response.body.errorCode === 'INVALID_DATA' && response.body.errorText && [
    'Некорректные символы в ИНН компании'
  ].some(str => response.body.errorText.indexOf(str) >= 0)) {
    throw new InvalidPreferencesError('Неверный ИНН компании')
  }
  return response.body || []
}

function formatDate (date) {
  return date.getUTCFullYear() + '-' +
    toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + '-' +
    toAtLeastTwoDigitsString(date.getUTCDate()) + '+00:00:00'
}

export async function fetchTransactions ({ accessToken }, { inn }, { id }, fromDate, toDate) {
  const response = await callGate(`https://sme-partner.tinkoff.ru/api/v1/partner/company/${inn}/excerpt?` +
    `accountNumber=${id}` +
    `&from=${encodeURIComponent(formatDate(fromDate))}` +
    `&till=${encodeURIComponent(formatDate(toDate))}`, {
    method: 'GET',
    headers: {
      Host: 'sme-partner.tinkoff.ru',
      Authorization: `Bearer ${accessToken}`
    }
  })
  return response.body.operation
}
