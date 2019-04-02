import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences.login, preferences.password)
  const accounts = (await bank.fetchAccounts(token))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  var i
  for (i = 0; i < accounts.length; i++) {
    accounts[i].balance = await bank.fetchBalance(token, accounts[i])
    accounts[i].transactionsAccId = await bank.fetchTransactionsAccId(token, accounts[i])
  }
  const transactions = (await bank.fetchTransactions(token, accounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
  console.log(transactions)
  return {
    accounts: accounts,
    transactions: transactions
  }
}
