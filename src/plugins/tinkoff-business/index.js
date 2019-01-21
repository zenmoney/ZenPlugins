import * as _ from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { mergeTransfers } from '../../common/mergeTransfers'
import { AuthError, fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (!toDate) {
    toDate = new Date()
  }
  preferences.inn = preferences.inn.toString().replace(/[^\d]/g, '')

  const accounts = []
  const transactions = []

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
      accounts.push(account)
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

  ZenMoney.setData('auth', auth)
  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: _.sortBy(mergeTransfers({
      items: transactions,
      makeGroupKey: transaction => transaction.movements[0].id
    }), transaction => transaction.date)
  }
}
