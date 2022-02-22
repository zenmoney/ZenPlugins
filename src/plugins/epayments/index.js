import { fetchCardsAndWallets, fetchTransactions } from './api'
import { getToken } from './auth'
import { convertTransactions, extractAccounts, mergeTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const authInfo = await getToken(preferences.login, preferences.password)

  const accounts = await fetchCardsAndWallets(authInfo).then(cardsAndWallets => extractAccounts(cardsAndWallets))

  const transactions = await fetchTransactions(authInfo, fromDate, toDate)
    .then(transactions => convertTransactions(transactions))
    .then(transactions => mergeTransactions(transactions, accounts))

  return {
    accounts,
    transactions
  }
}
