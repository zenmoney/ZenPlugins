import {
  fetchAccounts,
  fetchFullTransactions,
  login,
  parseTransactions,
  fetchLatestOperations,
  parseLatestOperations
} from './api'
import { convertAccount, convertTransaction, deduplicateTransactions } from './converters'
import { adjustTransactions } from '../../common/transactionGroupHandler'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const token = await login(preferences.login, preferences.password)

  let accounts = await allAccounts(token)
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
      const htmls = await fetchFullTransactions(token, account, fromDate, toDate)
      const transactions = parseTransactions(htmls)
      for (const apiTransaction of transactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactionsStatement.push(transaction)
        }
      }
    }
    if (account.latestTrID) {
      const html = await fetchLatestOperations(token, account)
      if (html) {
        const transactions = parseLatestOperations(html, fromDate)
        for (const apiTransaction of transactions) {
          const transaction = convertTransaction(apiTransaction, account)
          if (transaction) {
            transactionsStatement.push(transaction)
          }
        }
      }
    }
    return account
  }))
  return {
    accounts,
    transactions: adjustTransactions({
      transactions: deduplicateTransactions(transactionsStatement, accounts)
    })
  }
}

async function allAccounts (token) {
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account !== null)
  return accounts
}
