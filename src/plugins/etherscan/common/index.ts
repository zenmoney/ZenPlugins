import { stringify } from 'querystring'
import { fetchJson } from '../../../common/network'
import { TemporaryError } from '../../../errors'

import type { Response, Preferences } from './types'

const baseUrl = 'https://api.etherscan.io/api'

export async function fetch<T extends Response> (params: Record<string, string | number>): Promise<T> {
  const query = stringify(params)

  const response = await fetchJson(`${baseUrl}?${query}`)

  const data = response.body as T

  if (data.message === 'OK') {
    return data
  }

  throw new TemporaryError(data.message)
}

export { Response, Preferences }
