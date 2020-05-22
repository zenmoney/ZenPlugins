import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
  const transactions = (await fetchTransactions(token, accounts, fromDate, toDate))
    .map(transaction => convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)
  return {
    accounts: accounts,
    transactions: transactions
  }
}
