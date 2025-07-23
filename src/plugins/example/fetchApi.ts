import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { getString } from '../../types/get'
import { InvalidLoginOrPasswordError } from '../../errors'
import { Preferences, Product, Session } from './models'
import { isArray } from 'lodash'

const baseUrl = 'https://raw.githubusercontent.com/zenmoney/ZenPlugins/master/src/plugins/example/public/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{ accessToken: string }> {
  // It happens on server side
  if (login !== 'example' || password !== 'example') {
    throw new InvalidLoginOrPasswordError()
  }
  const response = await fetchApi('auth.json')
  return { accessToken: getString(response.body, 'access_token') }
}

export async function fetchAllAccounts (session: Session): Promise<unknown[]> {
  const response = await fetchApi('accounts.json')

  assert(isArray(response.body), 'cant get accounts array', response)
  return response.body
}

export async function fetchProductTransactions ({ id, transactionNode }: Product, session: Session): Promise<unknown[]> {
  const response = await fetchApi(`transactions_${transactionNode}${id}.json`)

  assert(isArray(response.body), 'cant get transactions array', response)
  return response.body
}
