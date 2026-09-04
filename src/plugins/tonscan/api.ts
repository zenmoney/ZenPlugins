import qs from 'querystring'
import crypto from 'crypto-js'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import get from '../../types/get'
import { SUPPORTED_JETTONS } from './config'
import { delay } from '../../common/utils'

const MAX_RPS = 1

export interface Preferences {
  wallets: string
}

export interface RawJettons {
  jetton_wallets: Array<{ address: string, jetton: string, balance: number | string }>
}

export interface JettonInfo {
  address: string
  jetton: string
  jettonType: string
  title: string
  owner: string
  balance: number
  decimals: number
}

export interface RawWallet {
  balance: number | string
}

export interface WalletInfo {
  address: string
  balance: number
}

export interface TonRawTransactions {
  transactions: Array<{ in_msg: Msg, out_msgs: Msg[] }>
  address_book: AddressBook
}

export interface TonTransaction {
  transactionId: string
  fromAddress: string
  toAddress: string
  quantity: number
  timestamp: number
}

export interface RawJettonTransfer {
  jetton_transfers: Array<{
    trace_id?: string
    transaction_hash: string
    transaction_lt?: string
    query_id?: string
    source: string
    destination: string
    amount: number | string
    transaction_now: number
    transaction_aborted?: boolean
  }>
}

export interface JettonTransfer {
  jettonAddress: string
  transactionId: string
  fromAddress: string
  toAddress: string
  quantity: number
  timestamp: number
}

export interface Msg {
  hash: string
  source: string
  destination: string
  value: number
  created_at: number
}

export interface AddressBook {
  [key: string]: { user_friendly: string }
}

export class TonscanApi {
  private readonly baseUrl: string
  private readonly requestsDelay: number
  private readonly maxRps: number
  private activeList: Array<Promise<unknown>> = []

  constructor (options: { baseUrl: string, requestsDelay?: number, maxRps?: number }) {
    this.baseUrl = options.baseUrl
    this.requestsDelay = options.requestsDelay ?? 1300
    this.maxRps = options.maxRps ?? MAX_RPS
  }

  public async waitForIdle (): Promise<void> {
    await Promise.all(this.activeList)
  }

  private async fetchApi (
    url: string,
    options?: FetchOptions,
    predicate?: (x: FetchResponse) => boolean
  ): Promise<FetchResponse> {
    if (this.activeList.length < this.maxRps) {
      const request = this.fetchInner(url, options, predicate)

      const waiter = request
        .then(async () => await delay(this.requestsDelay))
        .catch(async () => await delay(this.requestsDelay))
        .then(() => {
          this.activeList = this.activeList.filter(item => item !== waiter)
        })

      this.activeList.push(waiter)

      const result = await request

      return result
    }

    await Promise.race(this.activeList)
    return await this.fetchApi(url, options, predicate)
  }

  private async fetchInner (
    url: string,
    options?: FetchOptions,
    predicate?: (x: FetchResponse) => boolean
  ): Promise<FetchResponse> {
    const response = await fetchJson(this.baseUrl + url, options)

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

  public async fetchJettons (ownerWalletAddress: string): Promise<JettonInfo[]> {
    const response = await this.fetchApi(
      `v3/jetton/wallets?${qs.stringify({
        owner_address: ownerWalletAddress
      })}`,
      undefined,
      (res) => typeof res.body === 'object' && res.body != null && 'jetton_wallets' in res.body
    ) as FetchResponse & { body: RawJettons }

    const filteredJettons = response.body.jetton_wallets.filter(t => Object.keys(SUPPORTED_JETTONS).includes(t.jetton))
    const jettonsAddressBook = filteredJettons.length > 0
      ? await this.fetchAddressBook(filteredJettons.map(t => t.address))
      : {}

    return filteredJettons
      .map(t => ({
        address: jettonsAddressBook[t.address]?.user_friendly ?? t.address,
        jetton: t.jetton,
        jettonType: SUPPORTED_JETTONS[t.jetton].ticker,
        title: SUPPORTED_JETTONS[t.jetton].title,
        decimals: SUPPORTED_JETTONS[t.jetton].decimals,
        owner: ownerWalletAddress,
        balance: Number(t.balance)
      }))
  }

  public async fetchWallet (wallet: string): Promise<WalletInfo> {
    const response = await this.fetchApi(
      `v3/wallet?${qs.stringify({
      address: wallet
      })}`,
      undefined,
      (res) => typeof res.body === 'object' && res.body != null && 'balance' in res.body
    ) as FetchResponse & { body: RawWallet }

    return {
      address: wallet,
      balance: Number(response.body.balance)
    }
  }

  public async fetchAddressBook (addresses: string[]): Promise<AddressBook> {
    const response = await this.fetchApi(
      `v3/addressBook?${qs.stringify({
      address: addresses
      })}`,
      undefined,
      (res) => typeof res.body === 'object' && res.body != null
    ) as FetchResponse & { body: AddressBook }

    return response.body
  }

  public async fetchTonTransactions (ownerWalletAddress: string, fromDate: Date, toDate?: Date): Promise<TonTransaction[]> {
    const transactions: TonTransaction[] = []
    let offset = 0
    const limit = 30

    while (true) {
      const response = await this.fetchApi(
        `v3/transactions?${qs.stringify({
          account: ownerWalletAddress,
          start_utime: Math.floor((fromDate).getTime() / 1000),
          end_utime: Math.floor((toDate ?? new Date()).getTime() / 1000),
          limit,
          offset,
          sort: 'desc'
        })}`) as FetchResponse & { body: TonRawTransactions }

      const incomeTransactions = response.body.transactions.filter(t => t.in_msg?.value > 1)
      const outcomeTransactions = response.body.transactions.flatMap(t => t.out_msgs).filter(msg => msg.value > 1)
      const addressBook = response.body.address_book

      transactions.push(...incomeTransactions.map(t => ({
        transactionId: t.in_msg.hash,
        fromAddress: addressBook[t.in_msg.source]?.user_friendly ?? t.in_msg.source,
        toAddress: addressBook[t.in_msg.destination]?.user_friendly ?? t.in_msg.destination,
        quantity: t.in_msg.value,
        timestamp: t.in_msg.created_at
      })))

      transactions.push(...outcomeTransactions.map(t => ({
        transactionId: t.hash,
        fromAddress: addressBook[t.source]?.user_friendly ?? t.source,
        toAddress: addressBook[t.destination]?.user_friendly ?? t.destination,
        quantity: t.value,
        timestamp: t.created_at
      })))

      if (limit > response.body.transactions.length) {
        break
      }

      offset += limit
    }

    return transactions
  }

  public async fetchJettonsTransfers (jettons: JettonInfo[], fromDate: Date, toDate?: Date): Promise<JettonTransfer[]> {
    const transfers: JettonTransfer[] = []
    const movementIds = new Set<string>()

    // fetch each supported jetton transfers separately to avoid fetching all trasnfers of unsupported jettons
    for (const jetton of jettons) {
      let offset = 0
      const limit = 50

      while (true) {
        const response = await this.fetchApi(
          `v3/jetton/transfers?${qs.stringify({
            address: jetton.owner,
            jetton_master: jetton.jetton,
            start_utime: Math.floor((fromDate).getTime() / 1000),
            end_utime: Math.floor((toDate ?? new Date()).getTime() / 1000),
            limit,
            offset,
            sort: 'desc'
          })}`) as FetchResponse & { body: RawJettonTransfer }

        transfers.push(...response.body.jetton_transfers
          .filter(t => t.transaction_aborted !== true)
          .map(t => ({
            jettonAddress: jetton.address,
            transactionId: jettonTransferId(t, movementIds),
            fromAddress: t.source,
            toAddress: t.destination,
            quantity: Number(t.amount),
            timestamp: t.transaction_now
          })))

        if (limit > response.body.jetton_transfers.length) {
          break
        }

        offset += limit
      }
    }

    if (transfers.length === 0) {
      return []
    }

    const uniqueAddresses = [...new Set([...transfers.map(t => t.fromAddress), ...transfers.map(t => t.toAddress)])]
    const addressBook = await this.fetchAddressBook(uniqueAddresses)

    // replace raw addresses with user_friendly forms
    const updatedTransfers = transfers.map(t => ({
      ...t,
      fromAddress: addressBook[t.fromAddress]?.user_friendly !== undefined ? addressBook[t.fromAddress]?.user_friendly : t.fromAddress,
      toAddress: addressBook[t.toAddress]?.user_friendly !== undefined ? addressBook[t.toAddress]?.user_friendly : t.toAddress
    }))

    return updatedTransfers
  }
}

function jettonTransferId (transfer: RawJettonTransfer['jetton_transfers'][number], usedIds: Set<string>): string {
  // A TON transaction may contain multiple Jetton transfers. The transaction
  // hash alone is therefore not always unique. Preserve the historical ID for
  // the first movement to avoid duplicating existing ZenMoney imports.
  if (!usedIds.has(transfer.transaction_hash)) {
    usedIds.add(transfer.transaction_hash)
    return transfer.transaction_hash
  }
  const discriminator = [
    transfer.trace_id,
    transfer.transaction_lt,
    transfer.query_id,
    transfer.source,
    transfer.destination,
    String(transfer.amount),
    String(transfer.transaction_now)
  ]
    .filter((value): value is string => value != null && value !== '')
    .join('|')
  const base = `${transfer.transaction_hash}:${crypto.SHA256(discriminator).toString(crypto.enc.Hex)}`
  let candidate = base
  let suffix = 2
  while (usedIds.has(candidate)) candidate = `${base}:${suffix++}`
  usedIds.add(candidate)
  return candidate
}
