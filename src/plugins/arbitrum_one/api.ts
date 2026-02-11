import {
  ArbiscanResponse,
  BalanceResponse,
  TokenBalance,
  Transaction,
  TokenTransfer
} from './types'

import { SUPPORTED_TOKENS } from './supportedTokens'

const API_URL = 'https://api.etherscan.io/v2/api'
const CHAIN_ID = 42161
const PAGE_SIZE = 100

async function delay (ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

export class ArbitrumOneApi {
  private readonly apiKey: string

  private readonly queue: Array<() => Promise<void>> = []
  private isProcessing = false
  private readonly MIN_DELAY = 350

  constructor (apiKey: string) {
    this.apiKey = apiKey
  }

  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return await new Promise((resolve, reject) => {
      this.queue.push(async (): Promise<void> => {
        try {
          const result = await task()
          resolve(result)
        } catch (err) {
          reject(err)
        }
      })

      void this.processQueue()
    })
  }

  private async processQueue (): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()
      if (job == null) continue

      await job()
      await delay(this.MIN_DELAY)
    }

    this.isProcessing = false
  }

  private async call<T>(params: Record<string, string | number>): Promise<T> {
    return await this.enqueue(async () => {
      const url = new URL(API_URL)

      url.searchParams.set('chainid', String(CHAIN_ID))
      url.searchParams.set('apikey', this.apiKey)

      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
      }

      const response = await fetch(url.toString())
      const json = (await response.json()) as ArbiscanResponse<T>

      if (json.status !== '1') {
        throw new Error(json.message ?? 'Etherscan API error')
      }

      return json.result
    })
  }

  // НОРМАЛИЗАЦИЯ ДЛЯ ВСЕХ СЛУЧАЕВ
  async getBalance (address: string): Promise<BalanceResponse> {
    const res = await this.call<any>({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest'
    })

    // Etherscan v2 иногда возвращает строку вместо объекта
    if (typeof res === 'string') {
      return { balance: res }
    }

    if (typeof res === 'object' && res.balance != null) {
      return { balance: res.balance }
    }

    return { balance: '0' }
  }

  // Get startblocknumber
  async getBlockNumberByTimestamp (ts: number): Promise<number> {
    const result = await this.call<string>({
      module: 'block',
      action: 'getblocknobytime',
      timestamp: ts,
      closest: 'before'
    })

    return Number(result)
  }

  async getTokenBalances (address: string): Promise<TokenBalance[]> {
    const result = await Promise.all(
      SUPPORTED_TOKENS.map(async (token) => {
        const balance = await this.call<string>({
          module: 'account',
          action: 'tokenbalance',
          contractaddress: token.contract,
          address,
          tag: 'latest'
        })

        return {
          contract: token.contract,
          balance: String(balance),
          symbol: token.symbol
        }
      })
    )

    return result
  }

  async getTransactions (address: string, fromDate: Date): Promise<Transaction[]> {
    return await this.fetchTxPages<Transaction>({
      action: 'txlist',
      address,
      fromDate
    })
  }

  async getTokenTransfers (address: string, fromDate: Date): Promise<TokenTransfer[]> {
    return await this.fetchTxPages<TokenTransfer>({
      action: 'tokentx',
      address,
      fromDate
    })
  }

  private async fetchTxPages<T extends { contractAddress?: string }>(opts: {
    action: string
    address: string
    fromDate: Date
  }): Promise<T[]> {

    let page = 1
    const all: T[] = []

    const startTimestamp = Math.floor(opts.fromDate.getTime() / 1000)
    const startBlock = await this.getBlockNumberByTimestamp(startTimestamp)

    while (true) {
      const result = await this.call<T[]>({
        module: 'account',
        action: opts.action,
        address: opts.address,
        page,
        offset: PAGE_SIZE,
        sort: 'asc',
        startblock: startBlock,
        endblock: 9999999999
      })

      const normalized = result.map((tx) => ({
        ...tx,
        contract: tx.contractAddress
      }))

      all.push(...normalized)

      if (result.length < PAGE_SIZE) break
      page++
    }

    return all
  }
}
