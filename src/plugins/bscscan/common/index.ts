import { stringify } from 'querystring'
import { fetchJson } from '../../../common/network'
import { delay } from '../../../common/utils'
import { Preferences } from '../types'

import type { BlockNoResponse, Response } from './types'

const baseUrl = 'https://api.bscscan.com/api'

const MAX_RPS = 5
let activeList: Array<Promise<unknown>> = []

async function fetchInner<T extends Response> (params: Record<string, string | number>): Promise<T> {
  const query = stringify(params)

  const response = await fetchJson(`${baseUrl}?${query}`)

  const data = response.body as T

  if (data.message === 'OK') {
    return data
  }

  throw new Error(`fetch error: ${JSON.stringify(response)}`)
}

export async function fetch<T extends Response> (params: Record<string, string | number>): Promise<T> {
  if (activeList.length < MAX_RPS) {
    const request = fetchInner<T>(params)

    const waiter = request
      .then(async () => await delay(1000))
      .catch(async () => await delay(1000))
      .then(() => { // eslint-disable-line @typescript-eslint/no-floating-promises
        activeList = activeList.filter(item => item !== waiter)
      })
    activeList.push(waiter)

    const result = await request

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
