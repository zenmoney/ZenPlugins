import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences.phone, preferences.password)
  const accounts = (await bank.fetchAccounts(token))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  const transactions = (await bank.fetchTransactions(token, accounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)
  return {
    accounts: accounts,
    transactions: transactions
  }
}
