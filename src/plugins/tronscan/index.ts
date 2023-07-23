import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences, tronscanApi } from './api'
import { convertAccount, convertTransaction } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const [tokens, transfers] = await Promise.all([
    tronscanApi.fetchTokens(preferences.wallet),
    tronscanApi.fetchTransfers(preferences.wallet, fromDate, toDate)
  ])

  const accounts: Account[] = tokens.map(t => convertAccount(t))

  const transactions = transfers
    .map((transaction) => convertTransaction(transaction, preferences.wallet, tokens))
    .filter((transaction): transaction is Transaction => transaction !== null)

  return {
    accounts,
    transactions
  }
}
