import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertTransaction, convertAccounts } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()
  const token = await login(preferences.login, preferences.password)
  const transactions = []
  const accounts = []
  const accountsData = convertAccounts(await fetchAccounts(token))
    .filter(account => account !== null)
    .filter(account => account.account !== null)
  await Promise.all(accountsData.map(async ({ product, account }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(token, product, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
