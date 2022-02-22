import _ from 'lodash'
import { login, fetchAccounts, fetchOperations, fetchTransactions } from './api'
import { convertAccount, convertTransaction, merge } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account !== null)
  const transactions = merge(
    await fetchTransactions(token, accounts, fromDate),
    await fetchOperations(token, accounts, fromDate, toDate))
    .map(transaction => convertTransaction(transaction))
    .filter(transaction => transaction !== null)
  return {
    accounts,
    transactions: _.sortBy(transactions, transaction => transaction.date)
  }
}
