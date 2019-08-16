import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  const auth = await login(ZenMoney.getData('auth'), preferences)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accountsData = convertAccounts(await fetchAccounts())
  const accounts = []
  const transactions = []
  await Promise.all(accountsData.map(async ({ products, account }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    await Promise.all(products.map(async product => {
      const apiTransactions = await fetchTransactions(product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }))
  }))

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: adjustTransactions({ transactions })
  }
}
