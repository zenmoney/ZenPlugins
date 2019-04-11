import * as bank from './api'

export async function scrape ({ preferences, fromDate, toDate }) {
  await bank.login()
  // const token = await bank.login(preferences.login, preferences.password)
  // console.log(token)
  // const accounts = (await bank.fetchAccounts(token))
  //  .map(converters.convertAccount)
  //  .filter(account => account !== null)
  // const transactions = (await bank.fetchTransactions(token, accounts, fromDate, toDate))
  //  .map(transaction => converters.convertTransaction(transaction, accounts))
  return {
    accounts: [],
    transactions: []
  }
}
