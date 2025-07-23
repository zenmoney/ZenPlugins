import { fetchJson } from '../../common/network'
import { BitcoinAddressInfo, BitcoinTransaction } from './types'

const baseUrl = 'https://btcscan.org/api'

export interface Preferences {
  addresses: string
}

const getDateFromSeconds = (value: number): Date => new Date(value * 1000)

const getTransactionDate = (transaction: BitcoinTransaction): Date =>
  getDateFromSeconds(transaction.status.block_time)

async function fetch<T> (url: string): Promise<T> {
  const response = await fetchJson(`${baseUrl}${url}`)

  const data = response.body as T

  return data
}

async function fetchAccount (address: string): Promise<BitcoinAddressInfo> {
  const response = await fetch<BitcoinAddressInfo>(`/address/${address}`)

  return response
}

export async function fetchAddressesInfo (addresses: string[]): Promise<BitcoinAddressInfo[]> {
  return await Promise.all(addresses.map(fetchAccount))
}

const PAGE_SIZE = 25

export async function fetchAddressTransactions ({
  address,
  fromDate,
  lastSeenTxId
}: { address: string, fromDate: Date, lastSeenTxId?: string }): Promise<BitcoinTransaction[]> {
  const transactions = await fetch<BitcoinTransaction[]>(`/address/${address}/txs${lastSeenTxId !== undefined ? `/chain/${lastSeenTxId}` : ''}`)
  const oldestTransaction = transactions[transactions.length - 1]

  if (transactions.length === PAGE_SIZE && getTransactionDate(oldestTransaction) > fromDate) {
    return [
      ...transactions,
      ...await fetchAddressTransactions({
        address,
        fromDate,
        lastSeenTxId: oldestTransaction.txid
      })
    ]
  }

  return transactions.filter(transaction => getTransactionDate(transaction) > fromDate)
}
