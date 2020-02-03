import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let lastLoginRequest = await bank.login(preferences)
  const accountURLs = await bank.fetchURLAccounts(lastLoginRequest)
  const cards = (await bank.fetchCards(accountURLs.cards))
    .map(converters.convertAccount)
    .filter(account => account !== null)

  const transactionsCard = cards.length > 0
    ? (await bank.fetchCardsTransactions(cards[0]))
      .map(transaction => converters.convertTransaction(transaction, cards))
      .filter(transaction => transaction !== null)
    : []
  const deposits = (await bank.fetchDeposits(accountURLs.deposits))
    .map(converters.convertAccount)
    .filter(account => account !== null)
  cards.forEach(card => delete card.raw)
  return {
    accounts: cards.concat(deposits),
    transactions: transactionsCard
  }
}
