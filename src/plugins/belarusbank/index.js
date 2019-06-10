import * as bank from './api'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences)
  console.log(token)
  /* const accounts = (await bank.fetchAccounts(token))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  const transactions = (await bank.fetchTransactions(token, accounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null) */
  return {
    accounts: [],
    transactions: []
  }
}
