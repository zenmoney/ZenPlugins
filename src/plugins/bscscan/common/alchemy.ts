import { fetchJson } from '../../../common/network'
import { TemporaryError } from '../../../errors'

const ALCHEMY_BSC_URL = 'https://bnb-mainnet.g.alchemy.com/v2/'

interface AlchemyError {
  code?: number
  message?: string
}

interface AlchemyResponse<T> {
  jsonrpc?: string
  id?: number
  result?: T
  error?: AlchemyError
}

/**
 * Sends a read-only JSON-RPC request to Alchemy's BNB Smart Chain endpoint.
 *
 * The API key is deliberately kept out of request and response logs: an API
 * key is not a wallet secret, but must still never be exposed in a support
 * log.  Callers receive a generic temporary error for provider-side failures.
 */
export async function alchemyCall<T> (
  apiKey: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const response = await fetchJson(`${ALCHEMY_BSC_URL}${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    body: {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    },
    sanitizeRequestLog: {
      url: true,
      body: true
    },
    sanitizeResponseLog: {
      url: true
    }
  })

  const data = response.body as AlchemyResponse<T>
  if (data.error != null || data.result == null) {
    throw new TemporaryError('Alchemy временно не ответил на запрос BNB Smart Chain. Повторите синхронизацию позже.')
  }

  return data.result
}

export const BSC_USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955'
export const BSC_USDC_CONTRACT = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
