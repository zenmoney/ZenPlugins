import { Preferences } from '../types'
import { alchemyCall } from './alchemy'

import type { Response } from './types'

interface AlchemyBlock {
  number: string
  timestamp: string
}

async function fetchBlock (apiKey: string, number: number): Promise<AlchemyBlock> {
  return await alchemyCall<AlchemyBlock>(apiKey, 'eth_getBlockByNumber', [`0x${number.toString(16)}`, false])
}

/** Find the last block at or before the requested Unix timestamp. */
export async function fetchBlockNoByTime (
  preferences: Preferences,
  { timestamp }: { timestamp: number }
): Promise<number> {
  const latestHex = await alchemyCall<string>(preferences.apiKey, 'eth_blockNumber', [])
  let low = 0
  let high = Number(BigInt(latestHex))

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    const block = await fetchBlock(preferences.apiKey, middle)
    if (Number(BigInt(block.timestamp)) <= timestamp) low = middle
    else high = middle - 1
  }

  return low
}

export { Response }
