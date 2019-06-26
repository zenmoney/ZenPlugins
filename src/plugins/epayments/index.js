import * as api from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const authInfo = await api.authenthicate(preferences.login, preferences.password)

  const accounts = await api.fetchCardsAndWallets(authInfo).then(cardsAndWallets => converters.extractAccounts(cardsAndWallets))

  // const from = new Date(Date.parse('2018-11-11T00:00:00.000Z'))
  // const to = new Date(Date.parse('2018-11-13T00:00:00.000Z'))

  const transactions = await api.fetchTransactions(authInfo, fromDate, toDate)
    .then(transactions => converters.convertTransactions(transactions))
    .then(transactions => converters.mergeTransactions(transactions, accounts))

  return {
    accounts: accounts,
    transactions: transactions
  }
}
