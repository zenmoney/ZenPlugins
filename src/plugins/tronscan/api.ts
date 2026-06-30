import qs from 'querystring'
import { fetchJson, FetchResponse } from '../../common/network'
import get from '../../types/get'
import { isSupportedToken, SupportedTokenInfo, TokenInfo } from './config'
import { delay } from '../../common/utils'

const MAX_RPS = 5

export interface Preferences {
  apiKey: string
  wallets: string
}

interface TronTransfer {
  hash: string
  block_timestamp: number
  from: string
  to: string
  amount: string
}

interface TransactionCost {
  energy_fee: number
  fee: number
}

export interface TronTransaction {
  hash: string
  timestamp: number
  ownerAddress: string
  toAddress: null | string
  cost: TransactionCost
  contractType?: number
  amount?: string
}

export interface Transfer {
  transaction_id: string
  block_ts: number
  from_address: string
  to_address: string
  quant: string
  tokenInfo: TokenInfo
}

export class TronscanApi {
  private readonly baseUrl: string
  private apiKey?: string
  private activeList: Array<Promise<unknown>> = []

  constructor (options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl
  }

  setApiKey (apiKey: string): void {
    this.apiKey = apiKey
  }

  private async fetchApi<T>(
    url: string,
    params?: Record<string, string | number | boolean | undefined>,
    predicate?: (x: FetchResponse) => boolean
  ): Promise<FetchResponse & { body: T }> {
    if (this.activeList.length < MAX_RPS) {
      const request = this.fetchInner(`${url}?${qs.stringify(params)}`, predicate)

      const waiter = request
        .then(async () => await delay(1000))
        .catch(async () => await delay(1000))
        .then(() => {
          this.activeList = this.activeList.filter(item => item !== waiter)
        })

      this.activeList.push(waiter)

      const result = await request

      return result as FetchResponse & { body: T }
    }

    await Promise.race(this.activeList)
    return await this.fetchApi(url, params, predicate)
  }

  private async fetchInner (
    url: string,
    predicate?: (x: FetchResponse) => boolean
  ): Promise<FetchResponse> {
    const headers: Record<string, string> = {}

    if (this.apiKey != null) {
      headers['TRON-PRO-API-KEY'] = this.apiKey
    }

    const response = await fetchJson(this.baseUrl + url, {
      headers
    })

    if (predicate != null) {
      this.validateResponse(
        response,
        response => !(get(response.body, 'error') != null) && predicate(response)
      )
    }

    return response
  }

  private validateResponse (
    response: FetchResponse,
    predicate?: (x: FetchResponse) => boolean
  ): void {
    console.assert((predicate == null) || predicate(response), 'non-successful response')
  }

  public async fetchTokens (wallet: string): Promise<SupportedTokenInfo[]> {
    const response = await this.fetchApi<{ data: TokenInfo[] }>('account/tokens', {
      address: wallet,
      limit: 200
    },
    (res) => typeof res.body === 'object' && res.body != null && 'data' in res.body
    )

    return response.body.data.filter(isSupportedToken)
  }

  // Tronscan enforces `start + limit <= 10000` for a single (address,
  // time-range) query. Once a window reaches that ceiling we move its upper
  // bound (end_timestamp) back to the oldest record seen and keep going, so
  // the full history is retrieved without leaving gaps.
  private static readonly PAGE_LIMIT = 50
  private static readonly WINDOW_CAP = 10000

  private async fetchPaginated<Body, Item> (
    url: string,
    params: Record<string, string | number | boolean | undefined>,
    fromDate: Date,
    toDate: Date | undefined,
    extract: (body: Body) => { items: Item[], total?: number },
    getId: (item: Item) => string,
    getTimestamp: (item: Item) => number
  ): Promise<Item[]> {
    const limit = TronscanApi.PAGE_LIMIT
    const cap = TronscanApi.WINDOW_CAP
    const collected: Item[] = []
    const seen = new Set<string>()
    let windowEnd = toDate?.valueOf()

    while (true) {
      let start = 0
      let windowCount = 0
      let oldestTs: number | undefined

      while (true) {
        const response = await this.fetchApi<Body>(url, {
          ...params,
          start_timestamp: fromDate.valueOf(),
          end_timestamp: windowEnd,
          limit,
          start
        })

        const { items, total } = extract(response.body)

        if (items.length === 0) {
          break
        }

        for (const item of items) {
          const ts = getTimestamp(item)
          if (oldestTs === undefined || ts < oldestTs) {
            oldestTs = ts
          }
          const id = getId(item)
          // De-duplicate: the record on the window boundary is re-fetched
          // when we narrow the window below.
          if (!seen.has(id)) {
            seen.add(id)
            collected.push(item)
          }
        }

        windowCount += items.length
        // Advance by the number of records actually returned, not by the
        // requested page size: Tronscan may serve fewer than `limit` per page.
        start += items.length

        if (total !== undefined && start >= total) {
          break
        }
        if (start >= cap) {
          break
        }
      }

      // The window was not capped, so there are no older records to fetch.
      if (windowCount < cap || oldestTs === undefined) {
        break
      }
      // Guard against making no progress (e.g. many records share a timestamp).
      if (windowEnd !== undefined && oldestTs >= windowEnd) {
        break
      }
      windowEnd = oldestTs
    }

    return collected
  }

  public async fetchTransactions (wallet: string, fromDate: Date, toDate?: Date): Promise<Map<string, TronTransaction>> {
    const items = await this.fetchPaginated<{ data: TronTransaction[], total: number }, TronTransaction>(
      'transaction',
      { address: wallet, sort: '-timestamp' },
      fromDate,
      toDate,
      (body) => ({ items: body.data, total: body.total }),
      (tx) => tx.hash,
      (tx) => tx.timestamp
    )

    const transactions = new Map<string, TronTransaction>()
    for (const transaction of items) {
      transactions.set(transaction.hash, transaction)
    }

    return transactions
  }

  public async fetchTokenTransfers (wallet: string, fromDate: Date, toDate?: Date): Promise<Transfer[]> {
    return await this.fetchPaginated<{ total: number, token_transfers: Transfer[] }, Transfer>(
      'token_trc20/transfers',
      { relatedAddress: wallet, sort: '-timestamp' },
      fromDate,
      toDate,
      (body) => ({ items: body.token_transfers, total: body.total }),
      (t) => t.transaction_id,
      (t) => t.block_ts
    )
  }

  public async fetchTronTransfers (wallet: string, fromDate: Date, toDate?: Date): Promise<Transfer[]> {
    return await this.fetchPaginated<{ tokenInfo: TokenInfo, page_size: number, data: TronTransfer[] }, Transfer>(
      'transfer/trx',
      { direction: 0, address: wallet },
      fromDate,
      toDate,
      (body) => ({
        items: body.data.map((t) => ({
          transaction_id: t.hash,
          block_ts: t.block_timestamp,
          from_address: t.from,
          to_address: t.to,
          quant: t.amount,
          tokenInfo: body.tokenInfo
        }))
      }),
      (t) => t.transaction_id,
      (t) => t.block_ts
    )
  }
}

export const tronscanApi = new TronscanApi({
  baseUrl: 'https://apilist.tronscanapi.com/api/'
})
