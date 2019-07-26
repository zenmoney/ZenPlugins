import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchHistory, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction, filterCardTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (!toDate) {
    toDate = new Date()
  }
  const auth = await login(ZenMoney.getData('auth'), preferences)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const apiAccounts = await fetchAccounts(auth)
  const accounts = []
  const transactions = []
  const apiCardTransactions = await fetchHistory(auth, fromDate, toDate)
  await Promise.all(convertAccounts(apiAccounts).map(async ({ product, account }) => {
    accounts.push(account)
    if (product) {
      const apiTransactions = product.type === 'card'
        ? filterCardTransactions(apiCardTransactions, product)
        : await fetchTransactions(auth, product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }
  }))

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: adjustTransactions({ transactions })
  }
}
