import _, { flatMap } from 'lodash'
import { fetchAccountConditions, fetchAccounts, fetchBalance, fetchFullTransactions, fetchLastTransactions, fetchTransactionsAccId, login } from './api'
import { addOverdraftInfo, convertAccount, convertLastTransaction, convertTransaction, transactionsUnique } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)

  let accounts = await allAccounts(token)
  if (accounts.length === 0) {
    // если активация первый раз, но карточки все еще не выпущены
    return {
      accounts: [],
      transactions: []
    }
  }

  const accountsAvailable = flatMap(accounts, (account) => {
    if (account.balance !== null && account.transactionsAccId) {
      return account
    }
  })
  const fullTransactionsRes = await fetchFullTransactions(token, accountsAvailable, fromDate, toDate)
  accounts = addOverdraftInfo(accounts, fullTransactionsRes.overdrafts)

  const transactionsStatement = (fullTransactionsRes.transactions)
    .map(transaction => convertTransaction(transaction, accounts))
  const transactionsLast = (await fetchLastTransactions(token))
    .map(transaction => convertLastTransaction(transaction, accounts))
    .filter(function (op) {
      if (op === null) {
        // удаляем лишние уведомления
        return false
      } else if (op.movements[0].invoice !== null && isNaN(op.movements[0].invoice.sum)) {
        // удаляем все операции, что были сделаны в отличной от счета валюте, пока не понятно как узнать реальное списание
        return false
      }
      return true
    })
  const transactions = transactionsUnique(transactionsStatement.concat(transactionsLast))
    .filter(transaction => transaction.movements[0].sum !== 0)
  return {
    accounts: accounts,
    transactions: _.sortBy(transactions, transaction => transaction.date)
  }
}

async function allAccounts (token) {
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account !== null)
  for (let i = 0; i < accounts.length; i++) {
    accounts[i].balance = await fetchBalance(token, accounts[i])
    if (accounts[i].balance === null) {
      continue
    }
    const accIDs = await fetchTransactionsAccId(token, accounts[i])
    accounts[i].transactionsAccId = accIDs.transactionsAccId
    accounts[i].conditionsAccId = accIDs.conditionsAccId
  }
  accounts.filter(account => account.balance !== null) // Фильтруем все карты, которые еще не выпущены

  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].balance !== null) {
      accounts[i].accountID = await fetchAccountConditions(token, accounts[i])
    }
  }

  return accounts
}
