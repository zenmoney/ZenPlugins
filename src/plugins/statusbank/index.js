import {
  fetchAccounts,
  fetchFullTransactions,
  login,
  parseAccountTransactions,
  parseTransactions,
  fetchLatestOperations,
  parseLatestOperations
} from './api'
import { convertAccount, convertLinkedAccountSource, convertTransaction, deduplicateTransactions, TransactionSource } from './converters'
import { adjustTransactions } from '../../common/transactionGroupHandler'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const token = await login(preferences.login, preferences.password)

  const { accounts, sources } = await loadAccountsAndSources(token)
  if (accounts.length === 0) {
    // если активация первый раз, но карточки все еще не выпущены
    return {
      accounts: [],
      transactions: []
    }
  }

  const transactionsBySource = await Promise.all(
    sources.map(source => loadTransactions(token, source, fromDate, toDate))
  )
  return {
    accounts,
    transactions: adjustTransactions({
      transactions: deduplicateTransactions(transactionsBySource.flat(), accounts)
    })
  }
}

async function loadTransactions (token, source, fromDate, toDate) {
  const { account, type } = source
  let transactions
  if (type === TransactionSource.latestOperations) {
    const html = await fetchLatestOperations(token, account)
    transactions = html ? parseLatestOperations(html, fromDate) : []
  } else {
    const htmls = await fetchFullTransactions(token, account, fromDate, toDate)
    transactions = type === TransactionSource.cardStatement
      ? parseTransactions(htmls)
      : parseAccountTransactions(htmls)
  }
  return transactions
    .map(transaction => convertTransaction(transaction, account, type))
    .filter(Boolean)
}

async function loadAccountsAndSources (token) {
  const products = await fetchAccounts(token)
  const accounts = products
    .map(convertAccount)
    .filter(account => account !== null)
  const visibleAccountIds = new Set(accounts.map(account => account.id))
  const linkedAccounts = products
    .map(convertLinkedAccountSource)
    .filter(account => account !== null && visibleAccountIds.has(account.id))

  const sources = accounts.flatMap(account => {
    const accountSources = []
    if (account.transactionsAccId) {
      accountSources.push({
        account,
        type: account.productType === 'ACCOUNT'
          ? TransactionSource.currentAccountStatement
          : TransactionSource.cardStatement
      })
    }
    if (account.latestTrID) {
      accountSources.push({ account, type: TransactionSource.latestOperations })
    }
    return accountSources
  })

  sources.push(...linkedAccounts.map(account => ({
    account,
    type: TransactionSource.cardAccountStatement
  })))

  return {
    accounts,
    sources
  }
}
