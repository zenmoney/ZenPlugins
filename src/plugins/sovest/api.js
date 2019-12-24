/**
 * @author Pavel Shapilov <pavel@shapil.ru>
 */
import * as qs from 'querystring'
import * as network from '../../common/network'
import { retry } from '../../common/retry'
import * as setCookie from 'set-cookie-parser'
import * as moment from 'moment'

const homepage = 'https://sovest.ru'
const apiVersion = 1
const apiUrl = 'https://api.sovest.ru/'
const apiPath = '/api/v' + apiVersion + '/'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
let tokenType
let userCookie
let cookie
let fullCookieString = ''

async function fetchJson (url, options = {}, predicate = () => true) {
  const response = await network.fetchJson(url, {
    ...options,
    stringify: qs.stringify,
    headers: {
      'User-Agent': userAgent,
      'Sec-Fetch-Site': 'same-site',
      'Sec-Fetch-Mode': 'cors',
      'Referer': 'https://sovest.ru/',
      ...options.headers
    },
    sanitizeRequestLog: { body: { username: true, password: true }, headers: { Authorization: true } },
    sanitizeResponseLog: { body: { access_token: true } }
  })
  /* console.assert(false, JSON.stringify(response)) */
  if (predicate) {
    if (response.status === 401) {
      throw new TemporaryError('authorization error')
    }
  }
  return response
}

export async function login (login, password) {
  // get SNODE cookie from site
  const responsehome = await network.fetch(homepage, { headers: { 'User-Agent': userAgent }, sanitizeResponseLog: { headers: true } })

  if (responsehome.headers &&
    responsehome.headers['set-cookie'] &&
    responsehome.headers['set-cookie'].indexOf('SNODE') === 0) {
    cookie = setCookie.parse(setCookie.splitCookiesString(responsehome.headers['set-cookie']))
    fullCookieString += 'SNODE=' + cookie[0].value
  }

  let body = {
    'client_id': 'dbo_web',
    'grant_type': 'password',
    'username': login,
    'password': password,
    'recaptcha': ''
  }
  let headers = {
    'Accept': 'application/json',
    'Origin': homepage,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': cookie[0]
  }
  let options = {
    method: 'POST',
    body: body,
    headers: headers
  }
  const response = await fetchJson('https://oauth.sovest.ru/oauth/token', options, null)
  if (response.body.user_message && [
    'еверный логин или пароль'
  ].some(str => response.body.user_message.indexOf(str) >= 0)) {
    throw new InvalidPreferencesError('Неверный логин или пароль')
  }
  if (response.body.token_type) {
    tokenType = response.body.token_type
  }
  userCookie = setCookie.parse(setCookie.splitCookiesString(response.headers['set-cookie']))
  if (userCookie) {
    for (const element of userCookie) {
      if (element.name !== 'JSESSIONID' && element.name !== 'refresh_token') {
        fullCookieString += '; ' + element.name + '=' + element.value
      }
    }
  }
  return response.body.access_token
}

export async function fetchAccounts (token) {
  let account
  let method = 'GET'
  let headers = {
    'Referer': homepage + 'mycard',
    'cookie': fullCookieString,
    'Accept': '*/*',
    'Origin': homepage,
    'Authorization': tokenType + ' ' + token
  }
  // получаем данные о картах
  let responseCard = (await fetchJson(apiUrl + 'client' + apiPath + 'card', {
    'method': method,
    headers: headers
  }, responseCard => Array.isArray(responseCard.body)))
  // получаем баланс
  let responseBalance = (await fetchJson(apiUrl + 'reports' + apiPath + 'client/balance', {
    'method': method,
    headers: headers
  }, responseBalance => Array.isArray(responseBalance.body)))
  // обединяем данные о карте и балансе в один
  account = Object.assign(responseCard.body, responseBalance.body)
  // console.assert(false, JSON.stringify(account))
  return [account]
}

export async function fetchTransactions (token, fromDate, toDate) {
  // если toDate не указано, берем по текущий момент
  toDate = toDate || new Date()
  let apiTransactions = []
  let nextTxnDate = null
  let nextTxnId = null
  let fromDateMoment = null
  let toDateMoment = null
  if (fromDate) {
    fromDateMoment = moment(fromDate)
  }
  if (toDate) {
    toDateMoment = moment(toDate)
  }
  do {
    const response = await fetchTransactionPaged(token, nextTxnId, nextTxnDate)
    nextTxnDate = response.body.nextTxnDate
    nextTxnId = response.body.nextTxnId
    if (response.body.payments.length > 0) {
      apiTransactions.push(...response.body.payments)
    }
    // если nextTxnDate меньше fromDate, значит дальше не загружаем
    // console.assert(false, nextTxnDate + nextDate + moment(nextTxnDate) + fromDate + fromDateMoment)
    if (nextTxnDate && fromDate && moment(nextTxnDate) < fromDateMoment) {
      break
    }
  } while (nextTxnId && nextTxnDate)

  // фильтруем выборку по заданному интервалу fromDate toDate
  if (apiTransactions) {
    for (let i = 0; i < apiTransactions.length; i++) {
      let txnDateMoment = moment(apiTransactions[i].txnDate)
      // если дата не входит в интервал, удаляем ее из массива
      if (!(txnDateMoment >= fromDateMoment && txnDateMoment <= toDateMoment)) {
        delete apiTransactions[i]
      }
    }
    // clean removed elene
    apiTransactions = apiTransactions.filter(function (el) {
      return el !== null
    })
  }
  // console.assert(false, JSON.stringify(apiTransactions))
  return apiTransactions
}

async function fetchTransactionPaged (token, nextTxnId, nextTxnDate) {
  const pageLimit = 50
  const options = {
    'method': 'GET',
    headers: {
      'Referer': homepage + 'history',
      'cookie': fullCookieString,
      'Accept': '*/*',
      'Origin': homepage,
      'Authorization': tokenType + ' ' + token
    }
  }
  const url = apiUrl + 'reports' + apiPath + 'client/payments/history?rows=' + pageLimit +
    (nextTxnDate && nextTxnId ? `&txnDate=${encodeURIComponent(nextTxnDate)}&txn=${nextTxnId}` : '')
  const response = await retry({
    getter: () => fetchJson(url, options),
    predicate: response => response.body.errorCode !== 'request.blocked',
    maxAttempts: 5
  })
  // console.assert(false, JSON.stringify(response))
  return response
}
