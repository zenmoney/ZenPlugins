import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences.phone, preferences.password)
  const accounts = (await bank.fetchAccounts(token))
  const cards = accounts.cards
    .map(converters.convertCard)
    .filter(account => account !== null)

  var preparedAccounts = cards
  if (accounts.deposits) {
    const deposits = accounts.deposits
      .map(converters.convertDeposit)
      .filter(account => account !== null)
    preparedAccounts = cards.concat(deposits)
  }

  const transactions = (await bank.fetchTransactions(token, preparedAccounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, preparedAccounts))

  return {
    accounts: preparedAccounts,
    transactions: transactions
  }
}
