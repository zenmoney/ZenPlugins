import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let loginData = await bank.login()
  const accounts = (await bank.fetchAccounts(loginData.deviceID, loginData.sessionID))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  const transactions = (await bank.fetchTransactions(loginData.sessionID, accounts, fromDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
  return {
    accounts: accounts,
    transactions: transactions
  }
}
