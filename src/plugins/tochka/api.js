import * as network from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'

const qs = require('querystring')

const CLIENT_ID = 'sandbox'
const CLIENT_SECRET = 'sandbox_secret'
const API_REDIRECT_URI = 'https://zenmoney.ru/callback/tochka/'
const SANDBOX_REDIRECT_URI = 'https://localhost:8000/'
const API_URI = 'https://enter.tochka.com/api/v1/'
const SANDBOX_URI = 'https://enter.tochka.com/sandbox/v1/'

export async function login ({ accessToken, refreshToken, expirationDateMs } = {}, preferences) {
  let response
  const clientId = !preferences.server || preferences.server === 'tochka' ? CLIENT_ID : 'sandbox'
  const clientSecret = !preferences.server || preferences.server === 'tochka' ? CLIENT_SECRET : 'sandbox_secret'
  // console.log('>>> Используется сервер: ' + preferences.server)
  console.log(`>>> ClientID: ${clientId.substr(0, 3)}...${clientId.substr(-3)}`)
  if (accessToken) {
    if (expirationDateMs < new Date().getTime() + 24 * 60 * 60 * 1000) {
      console.log('>>> Авторизация: Обновляем токен, взамен протухшего.')
      response = await fetchJson('oauth2/token', {
        sandbox: clientId === 'sandbox',
        ignoreErrors: true,
        body: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        sanitizeRequestLog: { body: { refresh_token: true, client_id: true, client_secret: true } },
        sanitizeResponseLog: { body: { access_token: true, refresh_token: true, sessionId: true } }
      }, null)
      if (response.body && response.body.error) {
        response = null
        accessToken = null
        console.log('>>> Авторизация: Не удалось обновить токен. Требуется повторный вход.')
      }
    } else {
      console.log('>>> Авторизация: Используем действующзий токен.')
      return arguments[0]
    }
  }
  if (accessToken) {
    // nothing
  } else if (ZenMoney.openWebView) {
    // } else if (true) { // DEBUG SANDBOX
    console.log('>>> Авторизация: Входим через интерфейс банка.')

    const { error, code } = await new Promise((resolve) => {
      const redirectUriWithoutProtocol = (clientId === 'sandbox' ? SANDBOX_REDIRECT_URI : API_REDIRECT_URI).replace(/^https?:\/\//i, '')
      const url = clientId === 'sandbox'
        ? 'https://enter.tochka.com/sandbox/login/'
        : `${API_URI}authorize?${qs.stringify({
          client_id: clientId,
          response_type: 'code'
        })}`
      console.log('>>> WebView: ' + (clientId !== 'sandbox' ? url.replace(clientId, '*****') : url))
      ZenMoney.openWebView(url, null, (request, callback) => {
        const i = request.url.indexOf(redirectUriWithoutProtocol)
        if (i < 0) {
          return
        }
        const params = qs.parse(request.url.substring(i + redirectUriWithoutProtocol.length + 1))
        if (params.code) {
          callback(null, params.code)
        } else {
          callback(params)
        }
      }, (error, code) => resolve({ error, code }))
    })
    if (error && (!error.error || error.error === 'access_denied')) {
      throw new TemporaryError('Не удалось пройти авторизацию в банке Точка. Попробуйте еще раз')
    }
    console.assert(code && !error, 'non-successfull authorization', error)

    // DEBUG SANDBOX
    // const code = "lscrSeKFC3etECTdqnP0zs9X2ktfEanm";

    console.log('>>> Авторизация: Запрашиваем токен.')
    response = await fetchJson('oauth2/token', {
      sandbox: clientId === 'sandbox',
      method: 'POST',
      body: {
        client_id: clientId === 'sandbox' ? 'sandbox' : CLIENT_ID,
        client_secret: clientId === 'sandbox' ? 'sandbox_secret' : CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code
      },
      sanitizeRequestLog: { body: { client_id: true, client_secret: true, code: true } },
      sanitizeResponseLog: { body: { access_token: true, refresh_token: true } }
    }, null)
  } else {
    throw new TemporaryError('У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии.')
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

async function fetchJson (url, options = {}, predicate = () => true) {
  if (url.substr(0, 4) !== 'http') { url = (options.sandbox ? SANDBOX_URI : API_URI) + url }

  let response
  try {
    response = await network.fetchJson(url, {
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
    if (e.response && typeof e.response.body === 'string' && e.response.body.indexOf('internal server error') >= 0) {
      throw new TemporaryError('Информация из банка Точка временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите "Отправить лог последней синхронизации разработчикам".')
    } else {
      throw e
    }
  }
  if (!options.ignoreErrors && response.body && response.body.error && response.body.error_description) {
    throw new Error('Ответ банка: ' + response.body.error_description)
  }
  if (predicate) {
    if (response.body && response.body.errorCode === 'AUTH_REQUIRED') {
      throw new Error('AuthError')
    }
    console.assert(predicate(response), 'non-successful response')
  }
  return response
}

export async function fetchAccounts ({ accessToken }, preferences) {
  console.log('>>> Получаем список счетов')

  const response = await fetchJson('account/list', {
    sandbox: preferences.server === 'sandbox',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return response.body
}

function formatDate (date) {
  return date.getUTCFullYear() + '-' +
        toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + '-' +
        toAtLeastTwoDigitsString(date.getUTCDate())
  // return toAtLeastTwoDigitsString(date.getUTCDate()) + "." + toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + "." + date.getUTCFullYear();
}

export async function fetchStatement ({ accessToken }, apiAccount, fromDate, toDate, preferences) {
  console.log('>>> Заказываем выписку по операциям на счету', apiAccount)
  let response = await fetchJson('statement', {
    sandbox: preferences.server === 'sandbox',
    method: 'POST',
    headers: {
      'Host': 'enter.tochka.com',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
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

  const requestId = response.body.request_id
  let status = ''
  const iMax = 5
  for (let i = 1; i <= iMax; i++) {
    console.log(`>>> Проверяем статус выписки (попытка #${i})`, requestId)
    response = await fetchJson('statement/status/' + requestId, {
      sandbox: preferences.server === 'sandbox',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    } /* response => _.get(response, "response.body.status") */)

    status = response.body.status
    if (status === 'ready' || i >= iMax) break
    await delay(3)
  }
  if (response.body.message === 'Bad JSON') {
    console.log('>>> Не удалось получить статус выписки')
    return {}
  }

  console.log('>>> Запрашиваем содержимое выписки', requestId)
  response = await fetchJson('statement/result/' + requestId, {
    sandbox: preferences.server === 'sandbox',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  } /* response => _.get(response, "response.body.payments") */)
  if (status !== 'ready') {
    throw new Error('Не удалось дождаться ответа от сервера. Пожалуйста, попробуйте уменьшить период загрузки данных')
  }
  if (response.body.message === 'Bad JSON') {
    console.log('>>> Не удалось получить выписку')
    return {}
  }

  return response.body
}

async function delay (seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}
