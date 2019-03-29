import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences.phone, preferences.password)
  const accounts = (await bank.fetchAccounts(token))
  const cards = accounts.cards
    .map(converters.convertCard)
    .filter(account => account !== null)
  const deposits = accounts.deposits
    .map(converters.convertDeposit)
    .filter(account => account !== null)

  const preparedAccounts = cards.concat(deposits)
  const transactions = (await bank.fetchTransactions(token, preparedAccounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, preparedAccounts))
  console.log(transactions)
  return {
    accounts: preparedAccounts,
    transactions: transactions
  }
}
