import flatten from 'lodash/flatten'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchCards, fetchCardsTransactions, fetchDeposits, fetchURLAccounts, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  const lastLoginRequest = await login(preferences)
  const accountURLs = await fetchURLAccounts(lastLoginRequest)
  const cards = (await fetchCards(accountURLs.cards))
    .map(convertAccount)
    .filter(account => account !== null)
  const transactionsCard = cards.length > 0
    ? await Promise.all(cards.map(async card => (await fetchCardsTransactions(card, fromDate, toDate))
      .map(transaction => convertTransaction(transaction, cards))
      .filter(transaction => transaction !== null)))
    : []
  const deposits = (await fetchDeposits(accountURLs.deposits))
    .map(convertAccount)
    .filter(account => account !== null)
  for (const card of cards) {
    delete card.raw
  }

  const accounts = cards.concat(deposits)
  const transactions = flatten(transactionsCard)

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: adjustTransactions({ transactions })
  }
}
