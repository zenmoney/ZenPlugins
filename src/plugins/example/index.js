import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const auth = await login(preferences, ZenMoney.getData('auth'))
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  const accounts = []
  const transactions = []
  await Promise.all(convertAccounts(await fetchAccounts(auth)).map(async ({ account, products }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    await Promise.all(products.map(async product => {
      const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }))
  }))
  return {
    accounts: accounts,
    transactions: transactions
  }
}
