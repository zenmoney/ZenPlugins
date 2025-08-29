import flatten from 'lodash/flatten'
import { fetch } from '../common'
import { type Preferences } from '../types'

import {
  AccountResponse,
  TokenAccount,
  TokenTransaction,
  TokenTransactionResponse
} from './types'
import { SUPPORTED_TOKENS } from './config'

export async function fetchAddressTokens (
  preferences: Preferences,
  address: string
): Promise<TokenAccount[]> {
  const result = await Promise.all(
    SUPPORTED_TOKENS[preferences.chain].map(async (token) => {
      const response = await fetch<AccountResponse>({
        chainid: preferences.chain,
        module: 'account',
        action: 'tokenbalance',
        contractaddress: token.contractAddress,
        address,
        tag: 'latest',
        apiKey: preferences.apiKey
      })

      const balance = Number(response.result)

      const account: TokenAccount = {
        id: address,
        balance,
        contractAddress: token.contractAddress
      }

      return account
    })
  )

  return result
}

/* Эндпоинт etherscan для получения инфы про все токены — платный.
   Поэтому обходим тут все поддерживаемые токены по каждому адресу отдельно */
export async function fetchAccounts (
  preferences: Preferences
): Promise<TokenAccount[]> {
  const accounts = preferences.account.split(',')

  const result = await Promise.all(
    accounts.map(async (address: string) => {
      const tokensAccounts = await fetchAddressTokens(preferences, address)

      return tokensAccounts
    })
  )

  return flatten(result)
}

const PAGE_SIZE = 100

interface AccountTransactionsOptions {
  startBlock: number
  endBlock: number
  page?: number
}

export async function fetchAccountTransactions (
  preferences: Preferences,
  account: TokenAccount,
  options: AccountTransactionsOptions
): Promise<TokenTransaction[]> {
  const { startBlock, endBlock, page = 1 } = options

  try {
    const response = await fetch<TokenTransactionResponse>({
      chainid: preferences.chain,
      module: 'account',
      action: 'tokentx',
      contractaddress: account.contractAddress,
      address: account.id,
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
        ...(await fetchAccountTransactions(preferences, account, {
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
