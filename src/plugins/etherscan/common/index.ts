import { stringify } from 'querystring'
import { fetchJson } from '../../../common/network'
import { delay } from '../../../common/utils'
import { Preferences } from '../types'
import _ from 'lodash'

import type { BlockNoResponse, Response } from './types'
import { TemporaryError } from '../../../errors'

const baseUrl = 'https://api.etherscan.io/v2/api'

const MAX_RPS = 3
let activeList: Array<Promise<unknown>> = []

async function fetchInner<T extends Response> (
  params: Record<string, string | number>
): Promise<T> {
  const query = stringify({
    ...params
  })

  const response = await fetchJson(`${baseUrl}?${query}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*'
    },
    sanitizeRequestLog: {
      url: {
        query: {
          apiKey: true,
          apikey: true
        }
      }
    },
    sanitizeResponseLog: {
      url: {
        query: {
          apiKey: true,
          apikey: true
        }
      }
    }
  })

  const data = response.body as T

  if (data.message === 'OK') {
    return data
  }

  if (data.message === 'NOTOK') {
    if (_.get(data, 'result', '') === 'Max rate limit reached') {
      throw new TemporaryError('Etherscan RPS reached')
    }
  }

  // No transactions found is also a valid response
  if (data.status === '0' && data.message === 'No transactions found') {
    return data
  }

  throw new Error(`fetch error: ${JSON.stringify(response)}`)
}

export async function fetch<T extends Response> (
  params: Record<string, string | number>
): Promise<T> {
  if (activeList.length < MAX_RPS) {
    const request = fetchInner<T>(params)

    const waiter = request
      .then(async () => await delay(1000))
      .catch(async () => await delay(1000))
      .then(() => {
        // eslint-disable-line @typescript-eslint/no-floating-promises
        activeList = activeList.filter((item) => item !== waiter)
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
    chainid: preferences.chain,
    module: 'block',
    action: 'getblocknobytime',
    closest: 'before',
    timestamp,
    apiKey: preferences.apiKey
  })

  return Number(response.result)
}

export { Response }
