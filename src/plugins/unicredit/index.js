import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

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
  await Promise.all(convertAccounts(apiAccounts).map(async ({ product, account }) => {
    accounts.push(account)
    if (product) {
      const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }
  }))

  return {
    accounts,
    transactions
  }
}
