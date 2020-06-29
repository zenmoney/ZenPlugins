import { fetchAccounts, fetchTransactions } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  const accounts = (await fetchAccounts(preferences.token))
    .map(convertAccount)
    .filter(account => account !== null)
  const transactions = []
  for (let i = 0; i < accounts.length; i++) {
    const polTransactions = (await fetchTransactions(preferences.token, accounts[i], fromDate, toDate))
      .map(transaction => convertTransaction(transaction, accounts[i]))
      .filter(transaction => transaction !== null)
    transactions.push(...polTransactions)
  }

  return {
    accounts: accounts,
    transactions: transactions
  }
}
