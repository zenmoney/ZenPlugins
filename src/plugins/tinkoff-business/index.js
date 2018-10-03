import * as _ from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

function isAccountReference (accountId) {
  return accountId && [
    'cash#',
    'ccard#',
    'checking#'
  ].some(prefix => accountId.indexOf(prefix) === 0)
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (!toDate) {
    toDate = new Date()
  }
  const accounts = {}
  const transactions = []

  let auth = await login(ZenMoney.getData('auth'))
  let apiAccounts
  try {
    apiAccounts = await fetchAccounts(auth, preferences)
  } catch (e) {
    if (e && e.message === 'AuthError') {
      auth.expirationDateMs = 0
      auth = await login(auth)
      apiAccounts = await fetchAccounts(auth, preferences)
    } else {
      throw e
    }
  }

  await Promise.all(apiAccounts.map(async apiAccount => {
    const account = convertAccount(apiAccount)
    if (account) {
      accounts[account.id] = account
    }
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    (await fetchTransactions(auth, preferences, account, fromDate, toDate)).forEach(apiTransaction => {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    })
  }))
  transactions.forEach(transaction => {
    if (!accounts[transaction.incomeAccount] && !isAccountReference(transaction.incomeAccount)) {
      transaction.income = 0
      transaction.incomeAccount = transaction.outcomeAccount
    }
    if (!accounts[transaction.outcomeAccount] && !isAccountReference(transaction.outcomeAccount)) {
      transaction.outcome = 0
      transaction.outcomeAccount = transaction.incomeAccount
    }
    if (transaction.incomeAccount !== transaction.outcomeAccount) {
      transaction.payee = null
    }
  })
  ZenMoney.setData('auth', auth)
  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts: _.values(accounts), sanitizeSyncId }),
    transactions: _.sortBy(transactions, transaction => transaction.date)
  }
}
