import { sortBy } from 'lodash'
import { login, fetchAccounts, fetchCardTransactions, fetchDepositTransactions } from './api'
import { processAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = processAccounts(await fetchAccounts(token))
    .filter(account => account !== null && !ZenMoney.isAccountSkipped(account))
  const transactions = [
    ...await fetchCardTransactions(token, accounts.filter(acc => acc.type === 'card'), fromDate, toDate),
    ...await fetchDepositTransactions(token, accounts.filter(acc => acc.type === 'deposit'), fromDate, toDate)
  ]
    .map(convertTransaction)
  return {
    accounts: accounts,
    transactions: sortBy(transactions, transaction => transaction.date)
  }
}
