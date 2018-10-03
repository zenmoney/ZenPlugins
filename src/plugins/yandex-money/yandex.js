import * as network from '../../common/network'

const qs = require('querystring')

const CLIENT_ID = '57DCAFF3AC9CFEFEF4DA51501BCA28BD765C6F94B1D106225E51B2CBD276A2D5'
const SCOPE = 'operation-history account-info'
const REDIRECT_URI = 'http://zenmoney.ru/callback/yandex/'

export function isAuthError (err) {
  return err && err.message === 'authorization error'
}

async function fetchJson (url, options = {}, predicate = () => true) {
  const response = await network.fetchJson(url, {
    method: 'POST',
    sanitizeRequestLog: { headers: { Authorization: true } },
    sanitizeResponseLog: { headers: { 'set-cookie': true } },
    ...options,
    stringify: qs.stringify,
    headers: {
      'Host': 'money.yandex.ru',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers
    }
  })
  if (predicate) {
    if (response.status === 401) {
      throw new TemporaryError('authorization error')
    }
  }
  return response
}

export async function login () {
  if (!ZenMoney.openWebView) {
    throw new TemporaryError('У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии.')
  }
  const { error, code } = await new Promise((resolve) => {
    const redirectUriWithoutProtocol = REDIRECT_URI.replace(/^https?:\/\//i, '')
    const url = `https://money.yandex.ru/oauth/authorize?${qs.stringify({
      'client_id': CLIENT_ID,
      'scope': SCOPE,
      'redirect_uri': REDIRECT_URI,
      'response_type': 'code'
    })}`
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
    throw new TemporaryError('Не удалось пройти авторизацию в Яндекс.Деньги. Попробуйте еще раз')
  }
  console.assert(code && !error, 'non-successfull authorization', error)
  const response = await fetchJson('https://money.yandex.ru/oauth/token', {
    body: {
      'client_id': CLIENT_ID,
      'grant_type': 'authorization_code',
      'redirect_uri': REDIRECT_URI,
      code
    },
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: { access_token: true }, headers: { 'set-cookie': true } }
  }, null)
  if (!response.body || !response.body.access_token) {
    throw new TemporaryError('Не удалось пройти авторизацию в Яндекс.Деньги. Попробуйте еще раз')
  }
  return { accessToken: response.body.access_token }
}

export async function fetchAccount ({ accessToken }) {
  const response = await fetchJson('https://money.yandex.ru/api/account-info', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  return response.body
}

export async function fetchTransactions ({ accessToken }, fromDate, toDate) {
  const transactions = []
  let nextRecord = null
  do {
    const response = await fetchJson('https://money.yandex.ru/api/operation-history', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        from: fromDate.toISOString(),
        ...toDate && { till: toDate.toISOString() },
        ...nextRecord && { start_record: nextRecord }
      }
    })
    nextRecord = response.body.next_record
    transactions.push(...response.body.operations)
  } while (nextRecord)
  return transactions
}
