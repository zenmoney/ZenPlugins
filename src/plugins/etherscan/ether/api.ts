import { fetch } from '../common'
import { Preferences } from '../types'
import { fetchPaginatedTransactions } from '../common/pagination'
import {
  AccountResponse,
  EthereumAccount,
  EthereumTransaction,
  TransactionResponse
} from './types'

export async function fetchAccounts (
  preferences: Preferences
): Promise<EthereumAccount[]> {
  const response = await fetch<AccountResponse>({
    chainid: preferences.chain,
    module: 'account',
    action: 'balancemulti',
    address: preferences.account,
    tag: 'latest',
    apiKey: preferences.apiKey
  })

  return response.result
}

interface AccountTransactionsOptions {
  account: string
  startBlock: number
  endBlock: number
}

export async function fetchAccountTransactions (
  preferences: Preferences,
  options: AccountTransactionsOptions
): Promise<EthereumTransaction[]> {
  const { account, startBlock, endBlock } = options

  return await fetchPaginatedTransactions({
    startBlock,
    endBlock,
    getKey: (transaction) => transaction.hash,
    fetchPage: async ({ startBlock, endBlock, page, offset }) => {
      const response = await fetch<TransactionResponse>({
        chainid: preferences.chain,
        module: 'account',
        action: 'txlist',
        address: account,
        startblock: startBlock,
        endblock: endBlock,
        page,
        offset,
        sort: 'desc',
        apikey: preferences.apiKey
      })

      if (!Array.isArray(response.result)) {
        return []
      }

      return response.result
    }
  })
}
