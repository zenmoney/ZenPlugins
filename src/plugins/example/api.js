import { fetchJson } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'

const baseUrl = 'https://raw.githubusercontent.com/zenmoney/ZenPlugins/master/src/plugins/example/public/'

async function fetchApi (url, options, predicate = () => true) {
  const response = await fetchJson(baseUrl + url, options || {})
  if (predicate) {
    validateResponse(response, response => response.body && !response.body.error && predicate(response))
  }
  return response
}

function validateResponse (response, predicate) {
  console.assert(!predicate || predicate(response), 'non-successful response')
}

export async function login ({ login, password }, auth) {
  if (auth) {
    return auth
  }
  // It happens on server side
  if (login !== 'example' || password !== 'example') {
    throw new InvalidLoginOrPasswordError()
  }
  return (await fetchApi('auth.json', null, response => response.body.access_token)).body.access_token
}

export async function fetchAccounts (auth) {
  return (await fetchApi('accounts.json', null, response => Array.isArray(response.body))).body
}

export async function fetchTransactions (auth, { id, transactionNode }, fromDate, toDate = null) {
  return (await fetchApi(`transactions_${transactionNode}${id}.json`, null, response => Array.isArray(response.body))).body
}
