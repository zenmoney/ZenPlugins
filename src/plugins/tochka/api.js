import { omit } from 'lodash'
import { fetch, fetchJson, openWebViewAndInterceptRequest, RequestInterceptMode } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { delay } from '../../common/utils'
import { parse, stringify } from 'querystring'
import { BankMessageError, IncompatibleVersionError } from '../../errors'
import config from './config'

const API_REDIRECT_URI = config.redirectUri

const BASE_URI = 'https://enter.tochka.com'
const API_URI = `${BASE_URI}/uapi/open-banking/v1.0/`
const SANDBOX_URI = `${BASE_URI}/sandbox/v2/open-banking/v1.0/`
function getApiUri (sandbox = false) {
  return sandbox ? SANDBOX_URI : API_URI
}

export async function login (auth = {}, preferences) {
  let accessToken = auth.accessToken || auth.access_token
  let refreshToken = auth.refreshToken || auth.refresh_token
  let expirationDateMs = auth.expirationDateMs

  let response
  if (config.clientId.indexOf('sandbox') >= 0) {
    throw new Error('Unexpected sandbox token in release')
    /* return {
      accessToken: 'working_token',
      refreshToken: null,
      expirationDateMs: null
    } */
  }

  if (accessToken) {
    if (expirationDateMs < new Date().getTime() - 30 * 60 * 60 * 24 * 1000) {
      console.log('>>> Авторизация: refresh_token устарел, получаем заново.')
      accessToken = null
      refreshToken = null
    } else {
      if (expirationDateMs < new Date().getTime()) {
        console.log('>>> Авторизация: Обновляем токен взамен устаревшего.')
        response = await fetch(`${BASE_URI}/connect/token`, {
          method: 'POST',
          headers: {
            Host: 'enter.tochka.com',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          },
          stringify,
          parse: JSON.parse,
          sanitizeRequestLog: { body: { client_id: true, client_secret: true, refresh_token: true } },
          sanitizeResponseLog: { body: { access_token: true, refresh_token: true } }
        }, null)
        if (response.body?.error) {
          response = null
          accessToken = null
          refreshToken = null
          expirationDateMs = 0
          console.log('>>> Авторизация: Не удалось обновить токен. Требуется повторный вход.')
          return await login({
            accessToken,
            refreshToken,
            expirationDateMs
          }, preferences)
        }

        console.assert(response && response.body &&
          response.body.access_token &&
          response.body.refresh_token &&
          response.body.expires_in, 'non-successfull authorization', response)
        return {
          accessToken: response.body.access_token,
          refreshToken: response.body.refresh_token,
          expirationDateMs: new Date().getTime() + response.body.expires_in * 1000
        }
      } else {
        console.log('>>> Авторизация: Используем действующий токен.')
        return {
          accessToken,
          refreshToken,
          expirationDateMs
        }
      }
    }
  }

  if (!accessToken && ZenMoney.openWebView) {
    console.log('>>> Авторизация: Входим через интерфейс банка.')

    response = await fetch(`${BASE_URI}/connect/token`, {
      method: 'POST',
      headers: {
        Host: 'enter.tochka.com',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'client_credentials',
        scope: 'accounts',
        state: 'qwe'
      },
      stringify,
      parse: JSON.parse,
      sanitizeRequestLog: { body: { client_id: true, client_secret: true } },
      sanitizeResponseLog: { body: { access_token: true, refresh_token: true } }
    })
    const token = response.body?.access_token
    console.assert(token, 'non-successfull authorization access_token', response)

    const needPermissions = [
      'ReadAccountsBasic',
      'ReadAccountsDetail',
      'ReadBalances',
      'ReadTransactionsBasic',
      'ReadTransactionsDetail',
      'ReadTransactionsCredits',
      'ReadTransactionsDebits',
      'ReadStatements'
    ]
    response = await callGate('consents', null, {
      ignoreErrors: true,
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: {
        Data: {
          permissions: needPermissions
        }
      },
      sanitizeRequestLog: { headers: { Authorization: true } },
      sanitizeResponseLog: { body: { Data: { clientId: true, consumerId: true, consentId: true } } }
    })
    const consentId = response.body?.Data?.consentId
    const permissions = response.body?.Data?.permissions
    console.assert(consentId && Array.isArray(permissions), 'non-successfull authorization consent', response)
    console.assert(needPermissions.findIndex(permission => permissions.indexOf(permission) < 0) < 0, 'non-successfull permissions granted', response)

    const redirectUriWithoutProtocol = API_REDIRECT_URI.replace(/^https?:\/\//i, '')
    const url = `${BASE_URI}/connect/authorize?${stringify({
      client_id: config.clientId,
      response_type: 'code',
      state: 'zenmoney',
      redirect_uri: config.redirectUri,
      scope: 'accounts',
      consent_id: consentId
    })}`
    const params = await openWebViewAndInterceptRequest({
      url,
      sanitizeRequestLog: { url: { query: { client_id: true, consent_id: true } } },
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
    console.assert(code, 'non-successfull authorization code', params)

    console.log('>>> Авторизация: Запрашиваем токен.')
    response = await fetch(`${BASE_URI}/connect/token`, {
      method: 'POST',
      headers: {
        Host: 'enter.tochka.com',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        scope: 'accounts',
        code,
        redirect_uri: config.redirectUri
      },
      stringify,
      parse: JSON.parse,
      sanitizeRequestLog: { body: { client_id: true, client_secret: true, code: true } },
      sanitizeResponseLog: { body: { access_token: true, refresh_token: true } }
    })

    console.assert(response.body &&
      response.body.access_token &&
      response.body.refresh_token &&
      response.body.expires_in, 'non-successfull authorization', response)
    accessToken = response.body.access_token
    refreshToken = response.body.refresh_token
    expirationDateMs = new Date().getTime() + response.body.expires_in * 1000
  } else {
    throw new IncompatibleVersionError()
  }

  return {
    accessToken,
    refreshToken,
    expirationDateMs
  }
}

export async function fetchAccounts ({ accessToken } = {}) {
  console.log('>>> Получаем список счетов')
  const response = await callGate('accounts', accessToken, {
    ignoreErrors: true,
    method: 'GET'
  })
  if (response.status === 403) {
    // message: 'Forbidden by consent'
    console.log('>>> !!! Нет прав получить список счетов')
    return null
  }
  const accounts = response.body?.Data?.Account
  console.assert(accounts, 'unexpected accounts list response')
  return accounts
}

export async function fetchBalance ({ accessToken } = {}, accountId) {
  console.log('>>> Получаем остатки по счёту ', accountId)
  const response = await callGate(`accounts/${accountId}/balances`, accessToken, {
    method: 'GET'
  })
  const balances = response.body?.Data?.Balance
  console.assert(balances, 'unexpected account balances response')
  return balances
}

export async function fetchTransactions ({ accessToken } = {}, apiAccount, fromDate, toDate) {
  console.log('>>> Заказываем выписку по операциям на счету', apiAccount.accountId)
  let response = await callGate('statements', accessToken, {
    method: 'POST',
    body: {
      Data: {
        Statement: {
          accountId: apiAccount.accountId,
          startDateTime: formatDate(fromDate),
          endDateTime: formatDate(toDate)
        }
      }
    }
  })
  let statement = {}
  const statementId = response.body.Data?.Statement?.statementId
  const status = response.body.Data?.Statement?.status
  console.assert(statementId && status, 'unexpected statement response')

  const iMax = 5
  for (let i = 1; i <= iMax; i++) {
    console.log(`>>> Проверяем статус выписки (#${i}) по счёту`, apiAccount.accountId)
    response = await callGate(`accounts/${apiAccount.accountId}/statements/${statementId}`, accessToken, {
      ignoreErrors: true,
      method: 'GET'
    })
    if (!response.body.Errors) {
      statement = response.body.Data?.Statement?.[0]
      console.assert(statement, 'unexpected statement data')
      if (statement.status === 'Ready') {
        break
      }
    }
    await delay(3000)
  }
  // console.assert(statement.status === 'Ready', 'unexpected nor ready statement status')
  if (statement.status !== 'Ready') {
    console.log('>>> Не удалось получить выписку по счёту ', apiAccount.accountId)
    return []
  }
  return statement.Transaction
}

async function callGate (url, accessToken, options = {}) {
  if (url.substr(0, 4) !== 'http') { url = getApiUri(options.sandbox || accessToken === 'working_token') + url }
  let response
  const headers = {
    Host: 'enter.tochka.com',
    ...options.headers
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  try {
    response = await fetchJson(url, {
      method: 'POST',
      headers,
      ...omit(options, ['headers', 'sanitizeRequestLog', 'sanitizeResponseLog']),
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
  if (!options.ignoreErrors && response.body?.Errors) {
    const message = response.body?.Errors.message || response.body?.Errors[0]?.message
    if (message) { throw new BankMessageError(message) }
  }
  return response
}

function formatDate (date) {
  return date.getUTCFullYear() + '-' +
    toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + '-' +
    toAtLeastTwoDigitsString(date.getUTCDate())
}
