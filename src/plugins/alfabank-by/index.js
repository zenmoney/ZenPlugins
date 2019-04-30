import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let isResident = (preferences.isResident === 'true')
  let loginData = await bank.login(isResident)
  const accounts = (await bank.fetchAccounts(loginData.deviceID, loginData.sessionID))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  for (let i = 0; i < accounts.length; i++) {
    let res = await bank.fetchAccountInfo(loginData.sessionID, accounts[i].id)
    accounts[i] = converters.addAccountInfo(accounts[i], res)
  }
  const transactions = (await bank.fetchTransactions(loginData.sessionID, accounts, fromDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
  return {
    accounts: accounts,
    transactions: transactions
  }
}
