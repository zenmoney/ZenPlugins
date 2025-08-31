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
      limit: 999
    },
    (res) => typeof res.body === 'object' && res.body != null && 'data' in res.body
    )

    return response.body.data.filter(isSupportedToken)
  }

  public async fetchTransactions (wallet: string, fromDate: Date, toDate?: Date): Promise<Map<string, TronTransaction>> {
    const transactions = new Map<string, TronTransaction>()
    let start = 0
    const limit = 50

    while (true) {
      const response = await this.fetchApi<{ data: TronTransaction[], total: number }>('transaction', {
        address: wallet,
        start_timestamp: fromDate.valueOf(),
        end_timestamp: toDate?.valueOf(),
        limit,
        start,
        sort: '-timestamp'
      })

      for (const transaction of response.body.data) {
        transactions.set(transaction.hash, transaction)
      }

      if (start + limit >= response.body.total) {
        break
      }

      start += limit
    }

    return transactions
  }

  public async fetchTokenTransfers (wallet: string, fromDate: Date, toDate?: Date): Promise<Transfer[]> {
    const transfers: Transfer[] = []
    let start = 0
    const limit = 50

    while (true) {
      const response = await this.fetchApi<{ total: number, token_transfers: Transfer[] }>('token_trc20/transfers', {
        relatedAddress: wallet,
        start_timestamp: fromDate.valueOf(),
        end_timestamp: toDate?.valueOf(),
        limit,
        start,
        sort: '-timestamp'
      })

      for (const t of response.body.token_transfers) {
        transfers.push({
          transaction_id: t.transaction_id,
          block_ts: t.block_ts,
          from_address: t.from_address,
          to_address: t.to_address,
          quant: t.quant,
          tokenInfo: t.tokenInfo
        })
      }

      if (start + limit >= response.body.total) {
        break
      }

      start += limit
    }

    return transfers
  }

  public async fetchTronTransfers (wallet: string, fromDate: Date, toDate?: Date): Promise<Transfer[]> {
    const transfers: Transfer[] = []
    let start = 0
    const limit = 50

    while (true) {
      const response = await this.fetchApi<{ tokenInfo: TokenInfo, page_size: number, data: TronTransfer[] }>(
        'transfer/trx', {
          direction: 0,
          address: wallet,
          start_timestamp: fromDate.valueOf(),
          end_timestamp: toDate?.valueOf(),
          limit,
          start
        })

      for (const t of response.body.data) {
        transfers.push({
          transaction_id: t.hash,
          block_ts: t.block_timestamp,
          from_address: t.from,
          to_address: t.to,
          quant: t.amount,
          tokenInfo: response.body.tokenInfo
        })
      }

      if (response.body.page_size < limit) {
        break
      }

      start += limit
    }

    return transfers
  }
}

export const tronscanApi = new TronscanApi({
  baseUrl: 'https://apilist.tronscanapi.com/api/'
})
