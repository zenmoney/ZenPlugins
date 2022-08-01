import { stringify } from 'querystring'
import { fetchJson } from '../../../common/network'
import { TemporaryError } from '../../../errors'
import { Preferences } from '../types'

import type { Response, BlockNoResponse } from './types'

const baseUrl = 'https://api.etherscan.io/api'

const MAX_CONCURRENCY = 5
let activeList: Array<Promise<unknown>> = []

async function fetchInner<T extends Response> (params: Record<string, string | number>): Promise<T> {
  const query = stringify(params)

  const response = await fetchJson(`${baseUrl}?${query}`)

  const data = response.body as T

  if (data.message === 'OK') {
    return data
  }

  throw new TemporaryError(data.message)
}

export async function fetch<T extends Response> (params: Record<string, string | number>): Promise<T> {
  if (activeList.length < MAX_CONCURRENCY) {
    const fetcher = fetchInner<T>(params)
    activeList.push(fetcher)
    const result = await fetcher
    activeList = activeList.filter(item => item !== fetcher)
    return result
  }

  await Promise.race(activeList)
  return await fetch<T>(params)
}

export async function fetchBlockNoByTime (
  preferences: Preferences,
  { timestamp }: { timestamp: number }
): Promise<number> {
  const response = await fetch<BlockNoResponse>({
    module: 'block',
    action: 'getblocknobytime',
    closest: 'before',
    timestamp,
    apiKey: preferences.apiKey
  })

  return Number(response.result)
}

export { Response }
