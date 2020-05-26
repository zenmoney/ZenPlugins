import _ from 'lodash'
import { login, fetchAccounts, fetchTransactionsMini, fetchTransactions } from './api'
import { convertAccount, convertTransaction, transactionsUnique } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account !== null)
  const transactions = transactionsUnique(
    (await fetchTransactionsMini(token, accounts, fromDate, toDate)).concat(
      await fetchTransactions(token, accounts, fromDate, toDate)
    )
  )
    .map(transaction => convertTransaction(transaction))
    .filter(transaction => transaction !== null)
  return {
    accounts: accounts,
    transactions: _.sortBy(transactions, transaction => transaction.date)
  }
}
