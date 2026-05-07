import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction, filterDuplicates } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const cookies = await login(preferences.phone, preferences.password)

  const accounts = (await fetchAccounts(cookies))
    .map(convertAccount)
    .filter(account => account !== null)

  let transactions = (await fetchTransactions(cookies, accounts, fromDate, toDate))
    .map(transaction => convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)

  transactions = filterDuplicates(transactions)

  return {
    accounts,
    transactions
  }
}
