import _ from 'lodash'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import {
  fetchAccountConditions,
  fetchAccounts,
  fetchBalance,
  fetchFullTransactions,
  fetchLastTransactions,
  fetchTransactionsAccId,
  login,
  parseTransactionsAndOverdraft
} from './api'
import { addOverdraftInfo, convertAccount, convertLastTransaction, convertTransaction, transactionsUnique } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.login, preferences.password)

  let accounts = (await allAccounts(token)).filter(acc => !ZenMoney.isAccountSkipped(acc.id))
  if (accounts.length === 0) {
    // если активация первый раз, но карточки все еще не выпущены
    return {
      accounts: [],
      transactions: []
    }
  }

  const transactionsStatement = []
  accounts = await Promise.all(accounts.map(async account => {
    if (account.transactionsAccId) {
      const mails = await fetchFullTransactions(token, account, fromDate, toDate)
      const { overdraft, transactions } = parseTransactionsAndOverdraft(mails)
      account = addOverdraftInfo(account, overdraft)
      for (const apiTransaction of transactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactionsStatement.push(transaction)
        }
      }
    }
    return account
  }))

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
    transactions: adjustTransactions({ transactions: _.sortBy(transactions, transaction => transaction.date) })
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

  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].balance !== null && accounts[i].conditionsAccId !== null) {
      accounts[i].accountID = await fetchAccountConditions(token, accounts[i])
    }
  }

  return accounts
}
