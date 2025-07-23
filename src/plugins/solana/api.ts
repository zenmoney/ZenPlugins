import { fetchJson } from '../../common/network'
import { delay } from '../../common/utils'
import { GetBalanceResponse, GetTokenAccountsByOwnerResponse, Signature, TokenAccount, Transaction } from './types'
import { TOKEN_PROGRAM_ID, RPC_ENDPOINT as baseUrl, RPC_MAX_RPS } from './constants'

export interface Preferences {
  addresses: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rateLimit<T, A extends ((...args: any[]) => Promise<T>)> (MAX_RPS: number, fn: A): A {
  let activeList = new Array<Promise<unknown>>()

  const fetcher = async function (...args: unknown[]): Promise<T> {
    if (activeList.length < MAX_RPS) {
      const request = fn(...args)

      const waiter = request
        .then(async () => await delay(11000))
        .catch(async () => await delay(11000))
        .then(() => { // eslint-disable-line @typescript-eslint/no-floating-promises
          activeList = activeList.filter(item => item !== waiter)
        })
      activeList.push(waiter)

      const result = await request

      return result
    }

    await Promise.race(activeList)

    return await fetcher(...args)
  } as A

  return fetcher
}

async function fetch<T> (method: string, params: unknown[]): Promise<T> {
  const response = await fetchJson(baseUrl, {
    method: 'POST',
    body: {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    }
  })

  if (response.status === 429) {
    const retryAfter = (response.headers as Record<string, undefined | string>)['retry-after']
    if (retryAfter !== undefined) {
      await delay(parseInt(retryAfter) * 1000 + 1000)
      return await fetch(method, params)
    } else {
      throw new Error('Rate limit exceeded')
    }
  }

  if (response.status !== 200) {
    throw new Error('Failed to fetch data')
  }

  const data = response.body as { result: T }

  return data.result
}

export async function fetchTokenAccounts (owner: string): Promise<TokenAccount[]> {
  // TODO: paging is not implemented
  const response = await fetch<GetTokenAccountsByOwnerResponse>('getTokenAccountsByOwner', [owner, {
    programId: TOKEN_PROGRAM_ID
  }, {
    encoding: 'jsonParsed'
  }])

  return response.value.map((r) => {
    const info = r.account.data.parsed.info
    return {
      pubkey: r.pubkey,
      mint: info.mint,
      owner: info.owner,
      amount: parseInt(info.tokenAmount.amount)
    }
  })
}

export async function fetchBalance (address: string): Promise<number> {
  const response = await fetch<GetBalanceResponse>('getBalance', [address, {
    encoding: 'base58'
  }])

  return response.value
}

export type TransactionFetcher = (signature: string) => Promise<Transaction>

export const fetchTransaction: TransactionFetcher = rateLimit(RPC_MAX_RPS, async function (signature) {
  const response = await fetch<Transaction>('getTransaction', [
    signature,
    {
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0
    }
  ])
  return response
})

export const newCachedTransactionFetcher = function (fetchFn: TransactionFetcher): TransactionFetcher {
  const cache = new Map<string, Promise<Transaction>>()

  return async function fetchTransactionCached (signature: string): Promise<Transaction> {
    if (cache.has(signature)) {
      return await (cache.get(signature) as Promise<Transaction>)
    }

    const promise = fetchFn(signature)
      .then((result) => {
        // Cache only successful results
        cache.set(signature, Promise.resolve(result))
        return result
      })
      .catch((error) => {
        // Remove failed requests from cache
        cache.delete(signature)
        throw error
      })

    cache.set(signature, promise)

    return await promise
  }
}

export const fetchTransactions = async function (address: string, { fromDate, lastId }: { fromDate: Date, lastId?: string }, fetchFn: TransactionFetcher): Promise<Transaction[]> {
  const limit = 50
  const signatures: Signature[] = []
  let before: undefined | string

  while (true) {
    const response = await fetch<Signature[]>('getSignaturesForAddress', [address, {
      limit,
      until: lastId,
      before
    }])

    signatures.push(...response)

    if (response.length < limit) {
      break
    }

    const oldestSignature = response.at(-1)

    if (oldestSignature != null) {
      if (new Date(oldestSignature.blockTime * 1000) < fromDate) {
        break
      }
      before = oldestSignature.signature
    }
  }

  const transactions = signatures.map(async ({ signature, blockTime }) => {
    const blockDate = new Date(blockTime * 1000)

    if (blockDate < fromDate) {
      return null
    }

    return await fetchFn(signature)
  })

  const list = await Promise.all(transactions)

  return list.filter((item): item is Transaction => item !== null)
}
