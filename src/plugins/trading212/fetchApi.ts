import { fetchJson, FetchOptions } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { AccountSummary, Preferences, ExportRequest, ExportData } from './models'

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

export async function requestExport (preferences: Preferences, fromDate?: Date, toDate?: Date): Promise<ExportRequest> {
  const now = new Date()
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

  const timeFrom = ((fromDate != null) && fromDate > yearAgo ? fromDate : yearAgo).toISOString()
  const timeTo = ((toDate != null) && toDate < now ? toDate : now).toISOString()

  return await fetchApi('/history/exports', preferences, {
    method: 'POST',
    body: {
      dataIncluded: {
        includeOrders: false,
        includeDividends: true,
        includeInterest: true,
        includeTransactions: true
      },
      timeFrom,
      timeTo
    }
  })
}

export async function listExports (preferences: Preferences): Promise<ExportData[]> {
  return await fetchApi('/history/exports', preferences)
}

export async function fetchAccountSummary (preferences: Preferences): Promise<AccountSummary> {
  return await fetchApi('/account/summary', preferences)
}
