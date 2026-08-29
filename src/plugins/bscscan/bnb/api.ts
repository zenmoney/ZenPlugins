import { alchemyCall } from '../common/alchemy'
import { Preferences } from '../types'
import { BNBAccount, BNBTransaction } from './types'

function fromHex (value: string): string {
  return BigInt(value).toString(10)
}

export async function fetchAccounts (
  preferences: Preferences
): Promise<BNBAccount[]> {
  const addresses = preferences.account.split(',').map(address => address.trim()).filter(Boolean)
  return await Promise.all(addresses.map(async (account) => ({
    account,
    balance: fromHex(await alchemyCall<string>(preferences.apiKey, 'eth_getBalance', [account, 'latest']))
  })))
}

interface AccountTransactionsOptions {
  account: string
  startBlock: number
  endBlock: number
}

interface AlchemyTransfer {
  hash?: string
  from?: string
  to?: string
  rawContract?: { value?: string }
  metadata?: { blockTimestamp?: string }
}

interface AlchemyTransfersResult {
  transfers?: AlchemyTransfer[]
  pageKey?: string
}

interface AlchemyReceipt {
  gasUsed?: string
  effectiveGasPrice?: string
  status?: string
}

async function fetchReceipt (apiKey: string, hash: string): Promise<AlchemyReceipt> {
  return await alchemyCall<AlchemyReceipt>(apiKey, 'eth_getTransactionReceipt', [hash])
}

export async function fetchAccountTransactions (
  preferences: Preferences,
  options: AccountTransactionsOptions
): Promise<BNBTransaction[]> {
  let pageKey: string | undefined
  const transfers = new Map<string, AlchemyTransfer>()
  for (const direction of ['incoming', 'outgoing'] as const) {
    pageKey = undefined
    do {
      const params: Record<string, unknown> = {
        fromBlock: `0x${options.startBlock.toString(16)}`,
        toBlock: `0x${options.endBlock.toString(16)}`,
        category: ['external'],
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: '0x3e8',
        order: 'asc'
      }
      params[direction === 'incoming' ? 'toAddress' : 'fromAddress'] = options.account
      if (pageKey != null) params.pageKey = pageKey
      const result = await alchemyCall<AlchemyTransfersResult>(preferences.apiKey, 'alchemy_getAssetTransfers', [params])
      for (const transfer of result.transfers ?? []) {
        if (transfer.hash != null) transfers.set(transfer.hash, transfer)
      }
      pageKey = result.pageKey
    } while (pageKey != null)
  }

  return await Promise.all([...transfers.values()].map(async transfer => {
    const receipt = await fetchReceipt(preferences.apiKey, transfer.hash ?? '')
    const timestamp = Date.parse(transfer.metadata?.blockTimestamp ?? '')
    return {
      hash: transfer.hash ?? '',
      from: transfer.from ?? '',
      to: transfer.to ?? '',
      value: fromHex(transfer.rawContract?.value ?? '0x0'),
      timeStamp: Math.floor(timestamp / 1000).toString(),
      isError: receipt.status === '0x0' ? '1' : '0',
      gasPrice: fromHex(receipt.effectiveGasPrice ?? '0x0'),
      gasUsed: fromHex(receipt.gasUsed ?? '0x0')
    }
  }))
}
