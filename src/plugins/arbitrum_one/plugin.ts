import type { ScrapeFunc } from '../../types/zenmoney'
import { ArbitrumOneApi } from './api'
import { convertBalances, convertTransactions } from './converter'
import type { Preferences } from './types'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate }) => {
  const apiKey = preferences.apiKey

  // Разбиваем строку адресов по запятой
  const raw = preferences.account

  // raw может быть string или string[]
  const addresses = Array.isArray(raw)
    ? raw
    : raw.split(',').map(a => a.trim())

  const normalized = addresses
    .map((a: string) => a.toLowerCase())
    .filter(a => a.length > 0)

  const api = new ArbitrumOneApi(apiKey)

  const allAccounts: any[] = []
  const allTransactions: any[] = []

  for (const address of addresses) {
    // Балансы
    const [nativeBalance, tokenBalances] = await Promise.all([
      api.getBalance(address),
      api.getTokenBalances(address)
    ])

    const accounts = convertBalances(nativeBalance, tokenBalances)
    allAccounts.push(...accounts)

    // Транзакции
    const [nativeTxs, tokenTxs] = await Promise.all([
      api.getTransactions(address, fromDate),
      api.getTokenTransfers(address, fromDate)
    ])

    const fromTs = fromDate.getTime()

    const filteredNative = nativeTxs.filter(
      tx => Number(tx.timeStamp) * 1000 >= fromTs
    )

    const filteredToken = tokenTxs.filter(
      tx => Number(tx.timeStamp) * 1000 >= fromTs
    )

    const transactions = convertTransactions(filteredNative, filteredToken, address)
    allTransactions.push(...transactions)
  }

  return {
    accounts: allAccounts,
    transactions: allTransactions
  }
}
