import { fetchAccounts, fetchTransactions, login } from './bank'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
  const transactions = (await fetchTransactions(token, fromDate, toDate))
    .map(transaction => convertTransaction(transaction, accounts))
  return {
    accounts: accounts,
    transactions: transactions
  }
}
