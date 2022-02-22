import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import get from '../../types/get'
import { Product } from './converters'

const baseUrl = 'https://raw.githubusercontent.com/zenmoney/ZenPlugins/master/src/plugins/example/public/'

export type Auth = string

export interface Preferences {
  login: string
  password: string
}

async function fetchApi (url: string, options?: FetchOptions, predicate?: (x: FetchResponse) => boolean): Promise<FetchResponse> {
  const response = await fetchJson(baseUrl + url, options ?? {})
  if (predicate) {
    validateResponse(response, response => !get(response.body, 'error') && predicate(response))
  }
  return response
}

function validateResponse (response: FetchResponse, predicate?: (x: FetchResponse) => boolean): void {
  console.assert(!predicate || predicate(response), 'non-successful response')
}

export async function login ({ login, password }: Preferences, auth?: Auth): Promise<Auth> {
  if (auth != null) {
    return auth
  }
  // It happens on server side
  if (login !== 'example' || password !== 'example') {
    throw new InvalidLoginOrPasswordError()
  }
  return get((await fetchApi('auth.json', undefined, response => !!get(response.body, 'access_token'))).body, 'access_token') as Auth
}

export async function fetchAccounts (auth: Auth): Promise<unknown[]> {
  return (await fetchApi('accounts.json', undefined, response => Array.isArray(response.body))).body as unknown[]
}

export async function fetchTransactions (auth: Auth, { id, transactionNode }: Product, fromDate: Date, toDate?: Date): Promise<unknown[]> {
  return (await fetchApi(`transactions_${transactionNode}${id}.json`, undefined, response => Array.isArray(response.body))).body as unknown[]
}
