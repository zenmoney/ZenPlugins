import { defaultsDeep } from 'lodash'
import { fetchJson } from '../../common/network'

const baseUrl = 'https://24.bsb.by/api_ibank/api/'

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = defaultsDeep(
    options,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      sanitizeRequestLog: { body: { token: true } }
    }
  )

  const response = await fetchJson(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  switch (response.body.authorizationStatus) {
    case 'INCORECT_LOGIN_OR_PASSWORD':
      throw new InvalidPreferencesError('Неверный токен WebAPI')
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export async function fetchAccounts (token) {
  console.log('>>> Загрузка списка аккаунтов')
  const res = await fetchApiJson('accounts', {
    body: {
      token: token
    }
  }, response => response.body, message => new Error('Сайт не доступен'))

  return res.body
}

export async function fetchTransactions (token, acc, fromDate, toDate) {
  console.log('>>> Загрузка транзакций по ' + acc.title)

  const res = await fetchApiJson('accounts/' + acc.id + '/' + acc.currencyCode + '/statement', {
    body: {
      token: token,
      fromDate: dateFormat(fromDate),
      toDate: dateFormat(toDate),
      showTarget: true,
      showCorrespondent: true
    }
  }, response => response.success, message => new Error(''))

  return res.body.transactions
}

function dateFormat (date) {
  function ii (i, len) {
    let s = i + ''
    len = len || 2
    while (s.length < len) s = '0' + s
    return s
  }

  return date.getUTCFullYear() + '' + ii(date.getUTCMonth() + 1) + '' + ii(date.getUTCDate())
}
