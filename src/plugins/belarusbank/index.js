import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let lastLoginRequest = await bank.login(preferences)
  const accountURLs = await bank.fetchURLAccounts(lastLoginRequest)
  const cards = (await bank.fetchCards(accountURLs.cards))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  for (let i = 0; i < cards.length; i++) {
    delete cards[i].rawData
  }
  await bank.fetchCardsTransactions(cards[0])
  const deposits = (await bank.fetchDeposits(accountURLs.deposits))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  /* const accounts = (await bank.fetchURLAccounts(token))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  const transactions = (await bank.fetchTransactions(token, accounts, fromDate, toDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null) */
  return {
    accounts: cards.concat(deposits),
    transactions: []
  }
}
