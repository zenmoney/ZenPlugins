import * as _ from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { AuthError, fetchAccounts, fetchTransactions, login } from './api'
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
  preferences.inn = preferences.inn.toString().replace(/[^\d]/g, '')

  const accounts = {}
  const transactions = []
  const transactionIds = {}

  let i = 0
  let auth = ZenMoney.getData('auth')
  let apiAccounts = null
  const isFirstRun = !auth
  do {
    auth = await login(auth)
    try {
      apiAccounts = await fetchAccounts(auth, preferences)
    } catch (e) {
      if (e instanceof AuthError) {
        if (!isFirstRun && i === 0) {
          auth.expirationDateMs = 0
        } else if (!isFirstRun && i === 1) {
          auth = undefined
        } else {
          throw new TemporaryError('Недостаточно прав для просмотра счетов. Попробуйте подключить синхронизацию заново.')
        }
      } else {
        throw e
      }
    }
    i++
  } while (!apiAccounts)

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
      if (transaction && (!transaction.id || !transactionIds[transaction.id])) {
        if (transaction.id) {
          transactionIds[transaction.id] = true
        }
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
