import { BASE_API_URL } from './models'
import { fetchJson } from '../../common/network'
import type * as T from './types/fetch'

const makeUrl = (domain: 'auth' | 'core', url: string): string =>
  `${BASE_API_URL}/${domain}/services/v3${url}`

export const fetchLogin = async ({ login, password }: T.AuthenticateInput): Promise<{ sessionToken: string }> => {
  const { body } = await fetchJson(makeUrl('auth', '/authentication/login'), {
    method: 'POST',
    body: {
      // TODO: find a way to properly label device in banking
      login,
      password,
      deviceUDID: '', // generate and save?
      clientKind: 'WEB',
      appID: '1.27'
    }
  })

  return body as T.AuthenticateOutput
}

export const fetchAccounts = async ({ sessionToken }: T.FetchAccountsInput): Promise<T.FetchAccountsOutput> => {
  const { body } = await fetchJson(makeUrl('core', '/product/get-products?getCreditDetail=false'), {
    headers: {
      Authorization: `Bearer ${sessionToken}`
    }
  })

  return body as T.FetchAccountsOutput
}

export const fetchTransactions = async ({ sessionToken, from, to }: T.FetchTransactionsInput): Promise<T.FetchTransactionsOutput> => {
  const { body } = await fetchJson(makeUrl('core', '/operation/history/get-operations-history'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken}`
    },
    body: {
      dateFrom: from,
      dateTo: to
    }
  })

  return body as T.FetchTransactionsOutput
}
