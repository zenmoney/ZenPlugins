import * as api from './api'
import * as auth from './auth'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const authInfo = await auth.getToken(preferences.login, preferences.password)

  const accounts = await api.fetchCardsAndWallets(authInfo).then(cardsAndWallets => converters.extractAccounts(cardsAndWallets))

  const transactions = await api.fetchTransactions(authInfo, fromDate, toDate)
    .then(transactions => converters.convertTransactions(transactions))
    .then(transactions => converters.mergeTransactions(transactions, accounts))

  return {
    accounts: accounts,
    transactions: transactions
  }
}
