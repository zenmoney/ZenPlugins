import { fetch } from '../common'
import { AccountResponse, BlockNoResponse, EthereumAccount, EthereumTransaction, TransactionResponse } from './types'
import { Preferences } from '../common/types'

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
