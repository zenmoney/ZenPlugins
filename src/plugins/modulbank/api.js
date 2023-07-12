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
  const response = await callGate('https://api.modulbank.ru/v1/account-info', token, {
    body: {}
  })
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
        getter: async () => await callGate(`https://api.modulbank.ru/v1/operation-history/${id}`, token, {
          body: {
            from: fromDate.toISOString().slice(0, 10),
            skip,
            records: 50
          }
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
    if (response.status === 504) {
      throw new TemporaryUnavailableError()
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

async function callGate (url, token, options = {}) {
  const response = await fetchJson(url, {
    method: 'POST',
    headers: {
      Company: 'Zenmoney',
      Authorization: `Bearer ${token}`
    },
    body: options.body,
    sanitizeRequestLog: { headers: { Authorization: true } }
  })
  switch (response.status) {
    case 401: throw new AuthError()
    case 404: throw new Error()
  }
  return response
}
