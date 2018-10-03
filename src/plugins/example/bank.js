import * as network from '../../common/network'

const baseUrl = 'https://raw.githubusercontent.com/zenmoney/ZenPlugins/master/src/plugins/example/public/'

async function fetchJson (url, options, predicate = () => true) {
  const response = await network.fetchJson(baseUrl + url, options || {})
  if (predicate) {
    validateResponse(response, response => response.body && !response.body.error && predicate(response))
  }
  return response
}

function validateResponse (response, predicate) {
  console.assert(!predicate || predicate(response), 'non-successful response')
}

export async function login (login, password) {
  // It happens on server side
  if (login !== 'example' || password !== 'example') {
    throw new InvalidPreferencesError('Неверный логин или пароль')
  }
  return (await fetchJson('auth.json', null, response => response.body.access_token)).body.access_token
}

export async function fetchAccounts (token) {
  return (await fetchJson('accounts.json', null, response => Array.isArray(response.body))).body
}

export async function fetchTransactions (token, fromDate, toDate = null) {
  return (await fetchJson('transactions.json', null, response => Array.isArray(response.body))).body
}
