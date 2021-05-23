import { sortBy } from 'lodash'
import { login, fetchAccounts, fetchCardTransactions } from './api'
import { processAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = processAccounts(await fetchAccounts(token))
    .filter(account => account !== null)
  const transactions =
  [...await fetchCardTransactions(token, accounts.filter(acc => acc.type === 'card'), fromDate, toDate)]
    .map(convertTransaction)
  return {
    accounts: accounts,
    transactions: sortBy(transactions, transaction => transaction.date)
  }
}
