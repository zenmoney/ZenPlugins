import { fetchJson } from '../../common/network'
import { delay } from '../../common/utils'
import { GetBalanceResponse, Signature, Transaction } from './types'

const baseUrl = 'https://api.mainnet-beta.solana.com'

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

export async function fetchBalance (address: string): Promise<number> {
  const response = await fetch<GetBalanceResponse>('getBalance', [address, {
    encoding: 'base58'
  }])

  return response.value
}

const fetchTransaction = rateLimit(2, async function (signature: string): Promise<Transaction> {
  const response = await fetch<Transaction>('getTransaction', [
    signature,
    {
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0
    }
  ])
  return response
})

const fetchTransactions = rateLimit(2, async function (address: string, { fromDate, lastId }: {fromDate: Date, lastId?: string }): Promise<Transaction[]> {
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

    if (oldestSignature) {
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

    return await fetchTransaction(signature)
  })

  const list = await Promise.all(transactions)

  return list.filter((item): item is Transaction => item !== null)
})

export { fetchTransactions }
