import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await bank.login(preferences.phone, preferences.password)
  const accounts = (await bank.fetchAccounts(token))
  const cards = accounts.cards
    .map(converters.convertCard)
    .filter(account => account !== null)
  let lastTransactions = []
  for (let i = 0; i < cards.length; i++) {
    lastTransactions = lastTransactions.concat(await bank.fetchLastCardTransactions(token, cards[i]))
  }
  const deposits = accounts.deposits
    .map(converters.convertDeposit)
    .filter(account => account !== null)

  const preparedAccounts = cards.concat(deposits)
  const transactions = (await bank.fetchTransactions(token, preparedAccounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, preparedAccounts))
  lastTransactions = lastTransactions
    .map(transaction => converters.convertLastTransaction(transaction, cards))
    .filter(transaction => transaction !== null)
  return {
    accounts: preparedAccounts,
    transactions: transactions.concat(lastTransactions)
  }
}
