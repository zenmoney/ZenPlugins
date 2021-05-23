// import _ from 'lodash'
import { login, fetchAccounts } from './api'
import { processAccounts } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(processAccounts)
    .filter(account => account !== null)
  // const transactions = merge(
  //   await fetchOperations(token, accounts, fromDate, toDate))
  //   .map(transaction => convertTransaction(transaction))
  //   .filter(transaction => transaction !== null)
  return {
    accounts: accounts,
    transactions: [] // _.sortBy(transactions, transaction => transaction.date)
  }
}
