import { flatten } from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchCards, fetchLoans, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  toDate = toDate || new Date()

  const auth = await login(preferences, ZenMoney.getData('auth', {}))
  const transactions = []
  const accounts = []
  const accountsById = {}
  const accountsData = flatten(await Promise.all([
    fetchAccounts(auth),
    fetchCards(auth),
    fetchLoans(auth)
  ])).map(convertAccount).filter(x => x)
  flatten(accountsData.map(({ account }) => account.syncID)).forEach(syncId => {
    accountsById[syncId] = true
  })

  await Promise.all(accountsData.map(async ({ account, product }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account, accountsById)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))

  delete auth.accessToken

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: adjustTransactions({ transactions })
  }
}
