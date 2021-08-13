import { sortBy } from 'lodash'
import { fetchAccounts, fetchTransactions, login } from './api' // fetchCardTransactions, fetchOperations,
import { convertTransaction, processAccounts } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const token = await login(preferences.login, preferences.password)
  const transactions = []
  const accounts = processAccounts(await fetchAccounts(token))
    .filter(account => account !== null && !ZenMoney.isAccountSkipped(account))
  await Promise.all(accounts.map(async ({ product, account }) => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(token, product, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))

  return {
    accounts: accounts,
    transactions: sortBy(transactions, transaction => transaction.date)
  }
}
