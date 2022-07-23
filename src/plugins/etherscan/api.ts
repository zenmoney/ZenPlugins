import { stringify } from 'querystring'
import { fetchJson } from '../../common/network'
import { TemporaryError } from '../../errors'
import { EthereumAccount, EthereumTransaction } from './types'

const baseUrl = 'https://api.etherscan.io/api'

export type Auth = string

export interface Preferences {
  apiKey: string
  account: string
}

interface Response {
  status: string
  message: string
}

export interface AccountResponse extends Response {
  result: EthereumAccount[]
}

export interface BlockNoResponse extends Response {
  result: string
}

export interface TransactionResponse extends Response {
  result: EthereumTransaction[]
}

async function fetch<T extends Response> (params: Record<string, string | number>): Promise<T> {
  const query = stringify(params)

  const response = await fetchJson(`${baseUrl}?${query}`)

  const data = response.body as T

  if (data.message === 'OK') {
    return data
  }

  throw new TemporaryError(data.message)
}

export async function fetchAccounts (
  preferences: Preferences
): Promise<EthereumAccount[]> {
  const response = await fetch<AccountResponse>({
    module: 'account',
    action: 'balancemulti',
    address: preferences.account,
    tag: 'latest',
    apiKey: preferences.apiKey
  })

  return response.result
}

export async function fetchBlockNoByTime (
  preferences: Preferences,
  { timestamp }: { timestamp: number }
): Promise<number> {
  const response = await fetch<BlockNoResponse>({
    module: 'block',
    action: 'getblocknobytime',
    closest: 'before',
    timestamp,
    apiKey: preferences.apiKey
  })

  return Number(response.result)
}

interface AccountTransactionsOptions {
  account: string
  startBlock: number
  endBlock: number
  page?: number
}

const PAGE_SIZE = 100

export async function fetchAccountTransactions (
  preferences: Preferences,
  options: AccountTransactionsOptions
): Promise<EthereumTransaction[]> {
  const { account, startBlock, endBlock, page = 1 } = options

  const response = await fetch<TransactionResponse>({
    module: 'account',
    action: 'txlist',
    address: account,
    startblock: startBlock,
    endblock: endBlock,
    page,
    offset: PAGE_SIZE,
    sort: 'desc',
    apikey: preferences.apiKey
  })

  const transactions = response.result

  if (response.result.length === PAGE_SIZE) {
    return [
      ...transactions,
      ...await fetchAccountTransactions(preferences, {
        ...options,
        page: page + 1
      })
    ]
  }

  return transactions
}
