import * as bank from './bank'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  converters.run()
  const token = await bank.login(preferences.login, preferences.password)
  const accounts = (await bank.fetchAccounts(token))
    .map(converters.convertAccount)
  const transactions = (await bank.fetchTransactions(token, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
  return {
    accounts: accounts,
    transactions: transactions
  }
}
