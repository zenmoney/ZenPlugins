import { login, fetchCards, fetchTransactions } from './api'
import { convertAccount, convertTransaction } from './converters'
import { flattenDeep, omit } from 'lodash'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  let auth = ZenMoney.getData('auth', {})
  auth = await login(preferences, auth)

  const fetchedCards = await fetchCards(auth)
  const cardAccounts = fetchedCards.cardAccounts.map(account => convertAccount(account))

  const transactions = []
  transactions.push(await Promise.all(cardAccounts.map(async account => {
    const fetchedTransactions = await fetchTransactions(auth, account.id, account._type, fromDate, toDate || new Date())
    return fetchedTransactions.map(transaction => convertTransaction(transaction, account)).filter(item => item)
  })))

  // хранить accessToken не нужно
  delete auth.accessToken

  return {
    accounts: cardAccounts.map(account => omit(account, ['_type'])),
    transactions: flattenDeep(transactions)
  }
}
