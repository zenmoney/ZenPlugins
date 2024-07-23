import { omit } from 'lodash'
import { fetch, fetchJson, openWebViewAndInterceptRequest, RequestInterceptMode } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { delay, generateUUID } from '../../common/utils'
import { parse, stringify } from 'querystring'
import { BankMessageError, IncompatibleVersionError, TemporaryUnavailableError } from '../../errors'
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

  if (ZenMoney.trustCertificates) {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGUzCCBTugAwIBAgIMMjVN6wK9zLt8V+MHMA0GCSqGSIb3DQEBCwUAMFUxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSswKQYDVQQDEyJH
bG9iYWxTaWduIEdDQyBSNiBBbHBoYVNTTCBDQSAyMDIzMB4XDTI0MDcwODA4MDYx
OVoXDTI1MDgwOTA4MDYxOFowGzEZMBcGA1UEAxMQZW50ZXIudG9jaGthLmNvbTCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANTO1wd2lKXPDUF+i7PJsEHN
FL1U0SIIGF1iBLJiNQ91gC7yJnuTgdYPXwZzhHorH8IarpEX7I8CE2mGia8Hiirv
4Xz4A5ZWuJ6lNXVMLhFk9dURXnKyL2d9wA9Md7VgIzAu2FAnA8Qw5WRGmjMey3Gj
ISPKjaFPupyOeaDTfVjjgAOMqu8pqzMF7jz650N5W4ezrIU5BfW3V5RqkyJmEj5W
0/Cz1jjtmkkf4xVu2mQ8nW02ph0OVd8mkyXTT8o2tXjWMEllaTAqfRVOgmAHfI1q
6ES5sdjRxWqd61W7jeiKQZ6MT7Hi9F67FZ8LH3/xOMAgg/OXHPxOjVV3JZRlSncC
AwEAAaOCA1swggNXMA4GA1UdDwEB/wQEAwIFoDAMBgNVHRMBAf8EAjAAMIGZBggr
BgEFBQcBAQSBjDCBiTBJBggrBgEFBQcwAoY9aHR0cDovL3NlY3VyZS5nbG9iYWxz
aWduLmNvbS9jYWNlcnQvZ3NnY2NyNmFscGhhc3NsY2EyMDIzLmNydDA8BggrBgEF
BQcwAYYwaHR0cDovL29jc3AuZ2xvYmFsc2lnbi5jb20vZ3NnY2NyNmFscGhhc3Ns
Y2EyMDIzMFcGA1UdIARQME4wCAYGZ4EMAQIBMEIGCisGAQQBoDIKAQMwNDAyBggr
BgEFBQcCARYmaHR0cHM6Ly93d3cuZ2xvYmFsc2lnbi5jb20vcmVwb3NpdG9yeS8w
RAYDVR0fBD0wOzA5oDegNYYzaHR0cDovL2NybC5nbG9iYWxzaWduLmNvbS9nc2dj
Y3I2YWxwaGFzc2xjYTIwMjMuY3JsMBsGA1UdEQQUMBKCEGVudGVyLnRvY2hrYS5j
b20wHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMB8GA1UdIwQYMBaAFL0F
t/OKkzxzy3n6D4USoXeWGJF0MB0GA1UdDgQWBBSPWyt3T/8sx1sHOJrA2xeCbcI9
KDCCAX4GCisGAQQB1nkCBAIEggFuBIIBagFoAHYArxgaKNaMo+CpikycZ6sJ+Lu8
IrquvLE4o6Gd0/m2Aw0AAAGQkWEp9wAABAMARzBFAiBfFcOh470c6HFi8wd+fCAW
iE6+nOQi1hUQhtlJ9WBc+wIhAK/+yD5I9PsjLVJeh73wQX16RNDXCJBeKyk8ipa5
l0QRAHYAEvFONL1TckyEBhnDjz96E/jntWKHiJxtMAWE6+WGJjoAAAGQkWEp3QAA
BAMARzBFAiB9Dr8zeYqTrwEF3iJ980axpJ84KM5tVOl99f+6fMD4ogIhAJXJITTV
zt+jQBkxj7CkcLMZfqUAyTDmRw2P6zxzxlbmAHYADeHyMCvTDcFAYhIJ6lUu/Ed0
fLHX6TDvDkIetH5OqjQAAAGQkWEp/QAABAMARzBFAiEAj3BCjfQOVCljfjs6InGA
wUstEtouOtJxCy9jVAIgUXkCIEIz3/kywd13UQpiT9A7iwj5YsD/AL0gVAdCk75o
RjMVMA0GCSqGSIb3DQEBCwUAA4IBAQDLXeIr9bEsb2+TuT/PNURnpAwy1BZdxKL5
Q6RcwHG07ikzigUT+lY11L6arAD9GbTmBzJOrMCT+hQjZOiy0EbKxgaYgKouB1ig
6FpqIK9Qx4emJxrZrqgzvkiQsw6rC0gEDfyS6yndMVanEivvYIlStL55qMIxNGdI
hVwAQKXIj2/U8cR+ClWgxhPQ0/CgJzVDd2gYxzKXAGiRksfGOi+/6QixE4YqwYzm
i1Kc/v0LekFbZrs+dwytvpmwtJEbbhpcugSdgLHsClAjOKw1BZWznuZuv3M+vv6f
xXjsrTU9N3+9kpxGWFuklY31V4BH5kxtqoM5H0PMb6DPZmR9GhFI
-----END CERTIFICATE-----`
    ])
  }

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
    const state = generateUUID()
    const url = `${BASE_URI}/connect/authorize?${stringify({
      client_id: config.clientId,
      response_type: 'code',
      state,
      redirect_uri: config.redirectUri,
      scope: 'accounts',
      consent_id: consentId
    })}`
    let params
    try {
      params = await openWebViewAndInterceptRequest({
        url,
        sanitizeRequestLog: { url: { query: { client_id: true, consent_id: true } } },
        intercept: function (request) {
          if (request.url === url) {
            this.mode = RequestInterceptMode.OPEN_AS_DEEP_LINK
          }
          const i = request.url.indexOf(redirectUriWithoutProtocol)
          if (i < 0) {
            return null
          }
          return parse(request.url.substring(i + redirectUriWithoutProtocol.length + 1))
        }
      })
    } catch (err) {
      params = (await fetchJson(`${API_REDIRECT_URI.replace(/\/+$/, '')}/result/${state}/`, {
        log: false
      })).body
    }
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
        throw new TemporaryUnavailableError()
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
