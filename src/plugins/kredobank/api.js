import { fetchJson } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import { parse, splitCookiesString } from 'set-cookie-parser'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'

const baseUrl = 'https://online.kredobank.com.ua/ibank/api/'
const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Chrome/97.0.4692.71'
}

function parseCookies (response) {
  if (response.headers) {
    return parse(splitCookiesString(response.headers['set-cookie']))
  } else {
    return '' // tests not mocking headers, ignoring
  }
}

export async function login ({ login, password }, auth) {
  if (auth) {
    return auth
  }

  const res = await fetchJson(
    baseUrl + 'v1/individual/light/auth/login/login-password',
    {
      credentials: 'include',
      method: 'POST',
      headers: defaultHeaders,
      body: {
        login: login,
        password: password
      }
    },
    response => response.body.success
  )

  console.log(res)

  if (!res) {
    throw new InvalidLoginOrPasswordError()
  }

  const cookies = parseCookies(res)

  return { authorization: res.headers.authorization, cookies: cookies }
}

export async function fetchAccounts (auth, type) {
  const res = await fetchJson(
    baseUrl + 'v2/individual/light/contract/' + type + '/all',
    {
      headers: {
        Authorization: auth.authorization,
        ...defaultHeaders
      }
    },
    response => Array.isArray(response.body.contracts)
  )

  return res.body.contracts
}

function formatDate (date) {
  if (!date) { return '' }

  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('')
}

export async function fetchTransactions (auth, { id, type, bankType, cardId }, fromDate, toDate) {
  let url = baseUrl + 'v1/individual/light/contract/' + bankType + '/' + id + '/history/all/between?from=' + formatDate(fromDate) + '&to=' + formatDate(toDate || new Date())

  if (type === 'ccard' && cardId) {
    url += '&withCard=true&cardId=' + cardId
  }

  const res = await fetchJson(
    url,
    {
      headers: {
        Authorization: auth.authorization,
        ...defaultHeaders
      }
    },
    response => Array.isArray(response.body)
  )

  return res.body
}
