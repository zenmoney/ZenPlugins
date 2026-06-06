import { fetchJson, FetchOptions } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { AccountSummary, Preferences, TransactionHistoryPage } from './models'

const BASE_URL = 'https://live.trading212.com/api/v0/equity'

async function fetchApi<T> (url: string, { apiKey, apiSecret }: Preferences, options: FetchOptions = {}): Promise<T> {
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  options.headers = {
    ...options.headers as object,
    Authorization: `Basic ${auth}`
  }

  const response = await fetchJson(BASE_URL + url, options)
  if (response.status === 401) {
    throw new InvalidLoginOrPasswordError()
  } else if (response.status === 429) {
    throw new TemporaryError('Too many requests, try again later')
  }

  return response.body as T
}

export async function fetchAccountSummary (preferences: Preferences): Promise<AccountSummary> {
  return await fetchApi('/account/summary', preferences)
}

export async function fetchTransactionsPage (preferences: Preferences, path?: string): Promise<TransactionHistoryPage> {
  return await fetchApi(`/history/transactions${path !== undefined ? `?${path}` : ''}`, preferences)
}
