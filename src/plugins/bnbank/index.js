import _ from 'lodash'
import { fetchAccounts, fetchLastCardTransactions, fetchTransactions, login } from './api'
import { convertCard, convertDeposit, convertCheckingAccount, convertTransaction, transactionsUnique } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.phone, preferences.password)
  const accounts = (await fetchAccounts(token))
  const cards = accounts.cards
    .map(convertCard)
    .filter(account => account !== null)
  let lastTransactions = []
  for (let i = 0; i < cards.length; i++) {
    lastTransactions = lastTransactions.concat(await fetchLastCardTransactions(token, cards[i]))
  }
  let preparedAccounts = cards
  if (accounts.deposits) {
    const deposits = accounts.deposits
      .map(convertDeposit)
      .filter(account => account !== null)
    preparedAccounts = preparedAccounts.concat(deposits)
  }
  if (accounts.checkingAccounts) {
    const checkingAccounts = accounts.checkingAccounts
      .map(convertCheckingAccount)
      .filter(account => account !== null)
    preparedAccounts = preparedAccounts.concat(checkingAccounts)
  }

  const transactions = (await fetchTransactions(token, preparedAccounts, fromDate, toDate))
    .map(transaction => convertTransaction(transaction, preparedAccounts))
    .filter(transaction => transaction !== null)
  lastTransactions = lastTransactions
    .map(transaction => convertTransaction(transaction, cards))
    .filter(transaction => transaction !== null)
  return {
    accounts: preparedAccounts,
    transactions: _.sortBy(transactionsUnique(transactions.concat(lastTransactions)), transaction => transaction.date)
  }
}
