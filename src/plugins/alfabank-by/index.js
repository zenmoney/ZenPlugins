import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let loginData = await bank.login(preferences.isResident)
  const accountsRaw = (await bank.fetchAccounts(loginData.deviceID, loginData.sessionID))
  const accounts = (await bank.fetchDeposits(loginData.sessionID)).concat(accountsRaw)
    .map(converters.convertAccount)
    .filter(account => account !== null)
  await bank.fetchCredits(loginData.sessionID) // для временного перехвата логов
  const transactions = (await bank.fetchTransactions(loginData.sessionID, accounts, fromDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)
  return {
    accounts: accounts,
    transactions: transactions
  }
}
