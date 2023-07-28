import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences, tronscanApi } from './api'
import { convertAccount, convertTransaction } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const accounts: Account[] = []
  const transactions: Transaction[] = []

  await Promise.all(
    preferences.wallets
      .split(',')
      .map(wallet => wallet.trim())
      .map(async (wallet) => {
        const [tokens, transfers] = await Promise.all([
          tronscanApi.fetchTokens(wallet),
          tronscanApi.fetchTransfers(wallet, fromDate, toDate)
        ])

        const walletAccounts: Account[] = tokens.map(t => convertAccount(t, wallet))

        const walletTransactions = transfers
          .map((transaction) => convertTransaction(transaction, wallet, tokens))
          .filter((transaction): transaction is Transaction => transaction !== null)

        accounts.push(...walletAccounts)
        transactions.push(...walletTransactions)
      }))

  return {
    accounts,
    transactions
  }
}
