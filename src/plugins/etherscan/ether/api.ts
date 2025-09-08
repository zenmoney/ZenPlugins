import { fetch } from '../common'
import { Preferences } from '../types'
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
  page?: number
}

const PAGE_SIZE = 100

export async function fetchAccountTransactions (
  preferences: Preferences,
  options: AccountTransactionsOptions
): Promise<EthereumTransaction[]> {
  const { account, startBlock, endBlock, page = 1 } = options

  try {
    const response = await fetch<TransactionResponse>({
      chainid: preferences.chain,
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
        ...(await fetchAccountTransactions(preferences, {
          ...options,
          page: page + 1
        }))
      ]
    }

    return transactions
  } catch (error: any) {
    // eslint-disable-line
    if (error?.body?.message === 'No transactions found') {
      return []
    }

    throw error
  }
}
