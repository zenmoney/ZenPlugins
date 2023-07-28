import qs from 'querystring'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import get from '../../types/get'
import { SUPPORTED_TOKENS } from './config'

export interface Preferences {
  wallets: string
}

export interface TokenInfo {
  tokenId: string
  tokenName: string
  tokenAbbr: string
  tokenDecimal: number
  quantity: number
}

export interface TokenTransfer {
  transaction_id: string
  block_ts: number
  from_address: string
  to_address: string
  quant: string
  tokenInfo: TokenInfo
}

export class TronscanApi {
  private readonly baseUrl: string

  constructor (options: {baseUrl: string}) {
    this.baseUrl = options.baseUrl
  }

  private async fetchApi (
    url: string,
    options?: FetchOptions,
    predicate?: (x: FetchResponse) => boolean
  ): Promise<FetchResponse> {
    const response = await fetchJson(this.baseUrl + url, options)

    if (predicate) {
      this.validateResponse(response, response => !get(response.body, 'error') && predicate(response))
    }
    return response
  }

  private validateResponse (response: FetchResponse, predicate?: (x: FetchResponse) => boolean): void {
    console.assert(!predicate || predicate(response), 'non-successful response')
  }

  public async fetchTokens (wallet: string): Promise<TokenInfo[]> {
    const response = await this.fetchApi(
      `account/tokens?${qs.stringify({
        address: wallet,
        limit: 999
      })}`,
      undefined,
      (res) => typeof res.body === 'object' && res.body != null && 'data' in res.body
    ) as FetchResponse & {body: {data: Array<Record<string, unknown>>}}

    return response.body.data
      .filter(t => SUPPORTED_TOKENS.includes(t.tokenAbbr as string))
      .map(t => ({
        tokenId: t.tokenId as string,
        tokenName: t.tokenName as string,
        tokenAbbr: t.tokenAbbr as string,
        tokenDecimal: t.tokenDecimal as number,
        quantity: t.quantity as number
      }))
  }

  public async fetchTransfers (wallet: string, fromDate: Date, toDate?: Date): Promise<TokenTransfer[]> {
    const transfers: TokenTransfer[] = []
    let start = 0
    const limit = 50

    while (true) {
      const response = await this.fetchApi(
    `token_trc20/transfers?${qs.stringify({
      relatedAddress: wallet,
      start_timestamp: fromDate.valueOf(),
      end_timestamp: toDate?.valueOf(),
      limit,
      start,
      sort: '-timestamp'
    })}`) as FetchResponse & {body: {total: number, token_transfers: Array<Record<string, unknown>>}}

      transfers.push(...response.body.token_transfers.map(t => ({
        transaction_id: t.transaction_id as string,
        block_ts: t.block_ts as number,
        from_address: t.from_address as string,
        to_address: t.to_address as string,
        quant: t.quant as string,
        tokenInfo: t.tokenInfo as TokenInfo
      })))

      if (transfers.length >= response.body.total) {
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
