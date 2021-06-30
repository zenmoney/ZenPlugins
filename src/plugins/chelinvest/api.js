import { stringify } from 'querystring'
import { fetchJson } from '../../common/network'
import { InvalidOtpCodeError, InvalidPreferencesError } from '../../errors'

const commonHeaders = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  DNT: '1',
  Pragma: 'no-cache',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest'
}
const BASE_URL = 'https://investpay.ru'

async function callGate (url, options) {
  return fetchJson(BASE_URL + url, {
    ...options,
    headers: {
      ...commonHeaders,
      ...options?.headers,
      ...options?.auth && { Cookie: options.auth }
    },
    stringify
  })
}

// eslint-disable-next-line camelcase
export async function login ({ login, password, confirmation_type }, auth) {
  let response = await callGate('/front/users/current', { auth })
  if (response.status === 200) {
    return auth
  }

  response = await callGate('/session', {
    method: 'POST',
    auth,
    body: {
      email: login,
      password: password,
      confirmation_type: confirmation_type
    },
    sanitizeRequestLog: { body: { email: true, password: true } }
  })
  if (response.status !== 200) {
    throw new InvalidPreferencesError()
  }
  auth = (response.headers['Set-Cookie'] || response.headers['set-cookie']).split(';').find(cookie => cookie.startsWith('_session_id'))

  // eslint-disable-next-line camelcase
  if (confirmation_type && confirmation_type !== 'none') {
    const smsCode = await ZenMoney.readLine('Введите код подтверждения для авторизации приложения в Инвестпей.', {
      inputType: 'number',
      time: 60000
    })
    response = await callGate('/session', {
      method: 'POST',
      auth,
      body: {
        login_confirmation: smsCode,
        email: 'undefined'
      }
    })
    if (response.status !== 200) {
      throw new InvalidOtpCodeError()
    }
  }

  return auth
}

export async function fetchAccounts (auth) {
  const accounts = (await callGate('/front/accounts/extended', { auth })).body.accounts
  const deposits = (await callGate('/front/products/deposits', { auth })).body.deposits
  const credits = (await callGate('/front/products/credits', { auth })).body.singleCredits
  return {
    accounts,
    deposits,
    credits
  }
}

export async function fetchTransactions (product, fromDate, toDate, auth) {
  const response = await callGate(`/front/accounts/${product.id}/transactions?with_blocked=1&start=${dateFormat(fromDate)}&finish=${dateFormat(toDate)}`, { auth })
  return response.body.transactions
}

function dateFormat (d) {
  d = new Date(d)

  let dd = d.getDate()
  if (dd < 10) { dd = '0' + dd }

  let mm = d.getMonth() + 1
  if (mm < 10) { mm = '0' + mm }

  const yyyy = d.getFullYear()

  return yyyy + '.' + mm + '.' + dd
}
