import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)

  const transactions = []
  await Promise.all(accounts.map(async account => {
    const apiTransactions = await fetchTransactions(token, account, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))
  return {
    accounts,
    transactions
  }
}
