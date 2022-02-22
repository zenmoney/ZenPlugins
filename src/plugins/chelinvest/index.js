import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  const auth = await login(preferences, ZenMoney.getData('sessionid', 'x'))
  ZenMoney.setData('sessionid', auth)
  ZenMoney.saveData()

  const accounts = convertAccounts(await fetchAccounts(auth))
  const transactions = []
  await Promise.all(accounts.map(async account => {
    const apiTransactions = await fetchTransactions(account, fromDate, toDate, auth)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))

  return {
    accounts,
    transactions
  }
}
