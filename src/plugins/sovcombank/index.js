import * as _ from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { fetchAccounts, fetchTransactions, generateDevice, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  toDate = toDate || new Date()
  const device = ZenMoney.getData('device') || generateDevice()
  let auth = ZenMoney.getData('auth')
  auth = await login(device, auth)
  const transactions = []
  const accounts = (await fetchAccounts(auth))
    .map(convertAccount)
    .filter(account => account)
  await Promise.all(accounts.map(async account => {
    const apiTransactions = await fetchTransactions(auth, account.id, fromDate, toDate)
    apiTransactions.forEach(apiTransaction => {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    })
  }))
  ZenMoney.setData('device', device)
  ZenMoney.setData('auth', auth)
  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts: _.values(accounts), sanitizeSyncId }),
    transactions: _.sortBy(transactions, transaction => transaction.date)
  }
}
