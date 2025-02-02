import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { login, fetchAccounts, fetchTransactions } from './api'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  ZenMoney.locale = 'ru'
  toDate = toDate || new Date()
  let auth = ZenMoney.getData('auth')
  auth = await login(preferences, auth)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  const accountsData = convertAccounts(await fetchAccounts(auth))
  const accounts = accountsData.accounts
  const transactions = convertTransactions(await fetchTransactions(auth, fromDate, toDate), accountsData.cardsByLastFourDigits)

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: adjustTransactions({ transactions })
  }
}
