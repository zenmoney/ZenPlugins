import _ from 'lodash'
import { login, fetchAccounts, fetchTransactionsMini, fetchTransactions } from './api'
import { convertAccount, convertTransaction, transactionsUnique } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isFirstRun }) {
  const token = await login(preferences.login, preferences.password)
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account !== null)
  const transactions = transactionsUnique(
    (await fetchTransactionsMini(token, accounts, fromDate, toDate)).concat(
      await fetchTransactions(token, accounts, fromDate, toDate)
    )
  )
    .map(transaction => convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)
  return {
    accounts: removeBalances(accounts, transactions, isFirstRun),
    transactions: _.sortBy(transactions, transaction => transaction.date)
  }
}

function removeBalances (accounts, transactions, isFirstRun) {
  if (isFirstRun) {
    return accounts
  }
  const map = []
  _.flatMap(transactions, (tr) => {
    map[tr.movements[0].account.id] = true
  })

  for (let i = 0; i < accounts.length; i++) {
    if (map[accounts[i].id] === undefined) {
      accounts[i].balance = null
    }
  }
  return accounts
}
