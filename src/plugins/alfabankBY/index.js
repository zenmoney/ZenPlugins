import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let loginData = await bank.login()
  const accounts = (await bank.fetchAccounts(loginData.deviceID, loginData.sessionID))
    .map(converters.convertAccount)
  for (let i = 0; i < accounts.length; i++) {
    let res = await bank.fetchAccountInfo(loginData.sessionID, accounts[i].id)
    accounts[i] = converters.addAccountInfo(accounts[i], res)
  }
  //  .filter(account => account !== null)
  // const transactions = (await bank.fetchTransactions(token, accounts, fromDate, toDate))
  //  .map(transaction => converters.convertTransaction(transaction, accounts))
  return {
    accounts: accounts,
    transactions: []
  }
}
