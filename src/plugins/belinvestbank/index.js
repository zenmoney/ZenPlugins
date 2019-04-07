import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences.login, preferences.password)
  const accounts = (await bank.fetchAccounts(token))
    .map(converters.convertAccount)
  const transactions = (await bank.fetchTransactions(token, accounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)
  console.log(transactions)
  return {
    accounts: accounts,
    transactions: transactions
  }
}
