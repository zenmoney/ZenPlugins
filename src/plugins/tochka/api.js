/* eslint-disable no-unused-vars,camelcase */
import { parse, stringify } from 'querystring'
import { fetchJson, openWebViewAndInterceptRequest, RequestInterceptMode } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { delay } from '../../common/utils'
import { BankMessageError, IncompatibleVersionError } from '../../errors'
import * as config from './config'

const CLIENT_ID = config.clientId
const CLIENT_SECRET = config.clientSecret
const API_REDIRECT_URI = config.redirectUri

const SANDBOX_REDIRECT_URI = 'https://localhost:8000/'
const API_URI = 'https://enter.tochka.com/api/v1/'
const SANDBOX_URI = 'https://enter.tochka.com/sandbox/v1/'

export async function login ({ access_token, refresh_token, expirationDateMs } = {}, preferences) {
  let response
  const clientId = !preferences.server || preferences.server === 'tochka' ? CLIENT_ID : 'sandbox'
  const clientSecret = !preferences.server || preferences.server === 'tochka' ? CLIENT_SECRET : 'sandbox_secret'
  const sandboxMode = preferences.server ? preferences.server === 'sandbox' : clientId.indexOf('sandbox') >= 0
  if (!preferences.server) {
    preferences.server = sandboxMode ? 'sandbox' : 'tochka'
  }
  console.log('>>> Используется сервер: ' + preferences.server)
  console.log(`>>> ClientID: ${clientId.substr(0, 3)}...${clientId.substr(-3)}`)
  if (access_token) {
    if (expirationDateMs < new Date().getTime() - 30 * 60 * 60 * 24 * 1000) {
      console.log('>>> Авторизация: refresh_token устарел, получаем заново.')
      access_token = null
      refresh_token = null
    } else {
      if (expirationDateMs < new Date().getTime()) {
        console.log('>>> Авторизация: Обновляем токен взамен устаревшего.')
        response = await callGate('oauth2/token', {
          sandbox: sandboxMode,
          ignoreErrors: true,
          body: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refresh_token
          },
          sanitizeRequestLog: { body: { refresh_token: true, client_id: true, client_secret: true } },
          sanitizeResponseLog: { body: { access_token: true, refresh_token: true, sessionId: true } }
        }, null)

        if (response && response.body && response.body.error) {
          response = null
          access_token = null
          refresh_token = null
          expirationDateMs = 0
          console.log('>>> Авторизация: Не удалось обновить токен. Требуется повторный вход.')
          const result = await login({ access_token, refresh_token, expirationDateMs }, preferences)
          return result
        }

        console.assert(response && response.body &&
          response.body.access_token &&
          response.body.refresh_token &&
          response.body.expires_in, 'non-successfull authorization', response)

        return {
          access_token: response.body.access_token,
          refresh_token: response.body.refresh_token,
          expirationDateMs: new Date().getTime() + response.body.expires_in * 1000
        }
      } else {
        console.log('>>> Авторизация: Используем действующзий токен.')
        return arguments[0]
      }
    }
  }
  if (access_token) {
    // nothing
  } else if (ZenMoney.openWebView) {
    // eslint-disable-next-line no-constant-condition
    // } else if (true) { // DEBUG SANDBOX
    console.log('>>> Авторизация: Входим через интерфейс банка.')

    const redirectUriWithoutProtocol = (sandboxMode ? SANDBOX_REDIRECT_URI : API_REDIRECT_URI).replace(/^https?:\/\//i, '')
    const url = sandboxMode
      ? `${SANDBOX_URI}login/`
      : `${API_URI}authorize?${stringify({
        client_id: clientId,
        response_type: 'code'
      })}`
    const params = await openWebViewAndInterceptRequest({
      url,
      sanitizeRequestLog: { url: { query: { client_id: true } } },
      intercept: function (request) {
        if (ZenMoney.application?.platform === 'android' && request.url === url) {
          this.mode = RequestInterceptMode.OPEN_AS_DEEP_LINK
        }
        const i = request.url.indexOf(redirectUriWithoutProtocol)
        if (i < 0) {
          return null
        }
        return parse(request.url.substring(i + redirectUriWithoutProtocol.length + 1))
      }
    })
    const code = params?.code
    if (!code && (!params?.error || params.error === 'access_denied')) {
      throw new TemporaryError('Не удалось пройти авторизацию в банке Точка. Попробуйте еще раз')
    }
    console.assert(code, 'non-successfull authorization', params)

    // DEBUG SANDBOX
    // const code = 'kBcsiKQhwRdh2a1cggkIDnlAi1eoZAgd'

    console.log('>>> Авторизация: Запрашиваем токен.')
    response = await callGate('oauth2/token', {
      sandbox: sandboxMode,
      method: 'POST',
      body: {
        client_id: sandboxMode ? 'sandbox' : CLIENT_ID,
        client_secret: sandboxMode ? 'sandbox_secret' : CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code
      },
      sanitizeRequestLog: { body: { client_id: true, client_secret: true, code: true } },
      sanitizeResponseLog: { body: { access_token: true, refresh_token: true } }
    }, null)
  } else {
    throw new IncompatibleVersionError()
  }
  console.assert(response.body &&
    response.body.access_token &&
    response.body.refresh_token &&
    response.body.expires_in, 'non-successfull authorization', response)
  return {
    access_token: response.body.access_token,
    refresh_token: response.body.refresh_token,
    expirationDateMs: new Date().getTime() + response.body.expires_in * 1000
  }
}

export async function fetchAccounts ({ access_token } = {}, preferences) {
  console.log('>>> Получаем список счетов')
  const response = await callGate('account/list', {
    sandbox: preferences.server === 'sandbox',
    method: 'GET',
    headers: {
      Host: 'enter.tochka.com',
      Accept: 'application/json',
      Authorization: `Bearer ${access_token}`
    }
  })
  console.assert(response.body, 'unexpected account response')
  return response.body
}

export async function fetchStatement ({ access_token } = {}, apiAccount, fromDate, toDate, preferences) {
  console.log('>>> Заказываем выписку по операциям на счету', apiAccount)
  let response = await callGate('statement', {
    sandbox: preferences.server === 'sandbox',
    method: 'POST',
    headers: {
      Host: 'enter.tochka.com',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`
    },
    body: {
      account_code: apiAccount.code,
      bank_code: apiAccount.bank_code,
      date_start: formatDate(fromDate),
      date_end: formatDate(toDate)
    }
  } /* response => _.get(response, "response.body.request_id") */)

  if (response.body.message === 'Bad JSON') {
    console.log(`>>> Не удалось создать выписку операций '${apiAccount.code}'`)
    return {}
  }

  // проверим возможность получения выписки
  if (!response.body.request_id) {
    console.log(`>>> Не удалось получить выписку операций '${apiAccount.code}':`, response.body)
    return {}
  }

  const requestId = response.body.request_id
  let status = ''
  const iMax = 5
  for (let i = 1; i <= iMax; i++) {
    console.log(`>>> Проверяем статус выписки (попытка #${i})`, requestId)
    response = await callGate('statement/status/' + requestId, {
      sandbox: preferences.server === 'sandbox',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`
      }
    } /* response => _.get(response, "response.body.status") */)

    status = response.body.status
    if (status === 'ready' || i >= iMax) {
      break
    }
    await delay(3000)
  }
  if (response.body.message === 'Bad JSON') {
    console.log('>>> Не удалось получить статус выписки')
    return {}
  }

  console.log('>>> Запрашиваем содержимое выписки', requestId)
  response = await callGate('statement/result/' + requestId, {
    sandbox: preferences.server === 'sandbox',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${access_token}`
    }
  } /* response => _.get(response, "response.body.payments") */)
  // if (status !== 'ready') {
  //   throw new Error('Не удалось дождаться ответа от сервера. Пожалуйста, попробуйте уменьшить период загрузки данных')
  // }
  if (response.body.message === 'Bad JSON') {
    console.log('>>> Не удалось получить выписку')
    return {}
  }

  return response.body
}

async function callGate (url, options = {}, predicate = () => true) {
  if (url.substr(0, 4) !== 'http') { url = (options.sandbox ? SANDBOX_URI : API_URI) + url }

  let response
  try {
    response = await fetchJson(url, {
      method: 'POST',
      ...options,
      sanitizeRequestLog: {
        headers: { Authorization: true },
        ...options.sanitizeRequestLog
      },
      sanitizeResponseLog: {
        headers: { 'set-cookie': true },
        ...options.sanitizeResponseLog
      }
    })
  } catch (e) {
    if (!options.ignoreErrors) {
      if (e.response && typeof e.response.body === 'string' && e.response.body.indexOf('internal server error') >= 0) {
        throw new TemporaryError('Информация из банка Точка временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
      } else {
        throw e
      }
    } else {
      return response
    }
  }
  /*
  if (response.status !== 200) {
    const message = response.body && response.body.message
    throw new Error(response.statusText + (message ? ': ' + message : ''))
  }
  */
  if (!options.ignoreErrors && response.body && response.body.error && response.body.error_description) {
    throw new BankMessageError(response.body.error_description)
  }
  if (predicate) {
    if (response.body && response.body.errorCode === 'AUTH_REQUIRED') {
      throw new Error('AuthError')
    }
    console.assert(predicate(response), 'non-successful response')
  }
  return response
}

function formatDate (date) {
  return date.getUTCFullYear() + '-' +
    toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + '-' +
    toAtLeastTwoDigitsString(date.getUTCDate())
}
