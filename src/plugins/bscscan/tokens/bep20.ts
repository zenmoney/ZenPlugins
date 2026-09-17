import flatten from 'lodash/flatten'
import { alchemyCall } from '../common/alchemy'
import { Preferences } from '../types'

import { TokenAccount, TokenTransaction } from './types'
import { SUPPORTED_TOKENS } from './config'

export async function fetchAddressTokens (preferences: Preferences, address: string): Promise<TokenAccount[]> {
  const result = await Promise.all(SUPPORTED_TOKENS.map(async token => {
    const normalizedAddress = address.trim().replace(/^0x/i, '').toLowerCase()
    const data = `0x70a08231${normalizedAddress.padStart(64, '0')}`
    const rawBalance = await alchemyCall<string>(preferences.apiKey, 'eth_call', [{
      to: token.contractAddress,
      data
    }, 'latest'])
    const balance = Number(BigInt(rawBalance))

    const account: TokenAccount = {
      id: address,
      balance,
      contractAddress: token.contractAddress
    }

    return account
  }))

  return result
}

/* Query only the allowlisted stablecoins for every configured address. */
export async function fetchAccounts (
  preferences: Preferences
): Promise<TokenAccount[]> {
  const accounts = preferences.account.split(',')

  const result = await Promise.all(accounts.map(async (address: string) => {
    const tokensAccounts = await fetchAddressTokens(preferences, address)

    return tokensAccounts
  }))

  return flatten(result)
}

interface AccountTransactionsOptions {
  startBlock: number
  endBlock: number
}

interface AlchemyTransfer {
  blockNum?: string
  uniqueId?: string
  hash?: string
  from?: string
  to?: string
  rawContract?: { value?: string, address?: string }
  metadata?: { blockTimestamp?: string }
}

interface AlchemyTransfersResult {
  transfers?: AlchemyTransfer[]
  pageKey?: string
}

function transferLogIndex (transfer: AlchemyTransfer): string {
  const match = transfer.uniqueId?.match(/:log:(\d+)$/)
  return match?.[1] ?? '0'
}

function toTokenTransaction (transfer: AlchemyTransfer, account: TokenAccount): TokenTransaction | null {
  const timestamp = Date.parse(transfer.metadata?.blockTimestamp ?? '')
  const rawValue = transfer.rawContract?.value
  if (transfer.hash == null || transfer.from == null || transfer.to == null || rawValue == null || !Number.isFinite(timestamp)) return null

  return {
    blockNumber: transfer.blockNum == null ? '0' : BigInt(transfer.blockNum).toString(),
    timeStamp: Math.floor(timestamp / 1000).toString(),
    hash: transfer.hash,
    nonce: '0',
    blockHash: '',
    from: transfer.from,
    contractAddress: transfer.rawContract?.address ?? account.contractAddress,
    to: transfer.to,
    value: BigInt(rawValue).toString(),
    tokenName: '',
    tokenSymbol: '',
    tokenDecimal: '18',
    transactionIndex: '0',
    logIndex: transferLogIndex(transfer),
    gas: '0',
    gasPrice: '0',
    gasUsed: '0',
    cumulativeGasUsed: '0',
    input: '0x',
    confirmations: '0'
  }
}

async function fetchDirection (
  preferences: Preferences,
  account: TokenAccount,
  direction: 'incoming' | 'outgoing',
  options: AccountTransactionsOptions
): Promise<TokenTransaction[]> {
  let pageKey: string | undefined
  const transactions = new Map<string, TokenTransaction>()
  do {
    const params: Record<string, unknown> = {
      fromBlock: `0x${options.startBlock.toString(16)}`,
      toBlock: `0x${options.endBlock.toString(16)}`,
      category: ['erc20'],
      contractAddresses: [account.contractAddress],
      withMetadata: true,
      excludeZeroValue: true,
      maxCount: '0x3e8',
      order: 'asc'
    }
    params[direction === 'incoming' ? 'toAddress' : 'fromAddress'] = account.id
    if (pageKey != null) params.pageKey = pageKey

    const result = await alchemyCall<AlchemyTransfersResult>(preferences.apiKey, 'alchemy_getAssetTransfers', [params])
    for (const row of result.transfers ?? []) {
      const transaction = toTokenTransaction(row, account)
      if (transaction != null) transactions.set(`${transaction.hash}:${transaction.logIndex ?? '0'}`, transaction)
    }
    pageKey = result.pageKey
  } while (pageKey != null)

  return [...transactions.values()]
}

export async function fetchAccountTransactions (
  preferences: Preferences,
  account: TokenAccount,
  options: AccountTransactionsOptions
): Promise<TokenTransaction[]> {
  const [incoming, outgoing] = await Promise.all([
    fetchDirection(preferences, account, 'incoming', options),
    fetchDirection(preferences, account, 'outgoing', options)
  ])
  return [...new Map([...incoming, ...outgoing].map(transaction => [`${transaction.hash}:${transaction.logIndex ?? '0'}`, transaction])).values()]
}
