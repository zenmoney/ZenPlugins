import { parse, stringify } from 'querystring'
import { fetchJson } from '../../common/network'
import { retry, RetryError } from '../../common/retry'
import { IncompatibleVersionError, TemporaryUnavailableError } from '../../errors'
import config from './config'

export class AuthError {}

export async function login () {
  if (!ZenMoney.openWebView) {
    throw new IncompatibleVersionError()
  }
  const { error, code } = await new Promise((resolve) => {
    const redirectUriWithoutProtocol = config.redirectUri.replace(/^https?:\/\//i, '')
    const url = `https://oauth.modulbank.ru/?${stringify({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scope: 'account-info operation-history'
    })}`
    ZenMoney.openWebView(url, null, (request, callback) => {
      const i = request.url.indexOf(redirectUriWithoutProtocol)
      if (i < 0) {
        return
      }
      const params = parse(request.url.substring(i + redirectUriWithoutProtocol.length + 1))
      if (params.code) {
        callback(null, params.code)
      } else {
        callback(params)
      }
    }, (error, code) => resolve({ error, code }))
  })
  if (error && (!error.error || error.error === 'access_denied')) {
    throw new TemporaryError('Не удалось пройти авторизацию в ModulBank. Попробуйте еще раз')
  }
  console.assert(code && !error, 'non-successfull authorization', error)
  const response = await fetchJson('https://api.modulbank.ru/v1/oauth/token', {
    method: 'POST',
    headers: {
      Host: 'api.modulbank.ru'
    },
    body: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      code
    },
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: { accessToken: true, access_token: true } }
  })
  const accessToken = response.body
    ? response.body.accessToken || response.body.access_token
    : null
  console.assert(accessToken, 'non-successfull authorization')
  return accessToken
}

export async function fetchAccounts (token) {
  const response = await fetchJson('https://api.modulbank.ru/v1/account-info', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: {},
    sanitizeRequestLog: { headers: { Authorization: true } }
  })
  if (response.status === 401) {
    throw new AuthError()
  }
  const companies = response.body
  const accounts = []
  for (const company of companies) {
    accounts.push(...company.bankAccounts)
  }
  return accounts
}

export async function fetchTransactions (token, { id }, fromDate) {
  const transactions = []
  let skip = 0
  let batch
  do {
    let response
    try {
      response = await retry({
        getter: async () => await fetchJson(`https://api.modulbank.ru/v1/operation-history/${id}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: {
            from: fromDate.toISOString().slice(0, 10),
            skip,
            records: 50
          },
          sanitizeRequestLog: { headers: { Authorization: true } }
        }),
        predicate: response => response.body.message !== 'apierror',
        maxAttempts: 5,
        delayMs: 2000
      })
    } catch (e) {
      if (e instanceof RetryError) {
        throw new TemporaryUnavailableError()
      }
    }
    if (response.status === 401) {
      throw new AuthError()
    }
    batch = response.body
    transactions.push(...batch)
    skip += batch.length
  } while (batch.length)
  return transactions
}
