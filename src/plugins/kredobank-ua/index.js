import { fetchAccounts, fetchTransactions, generateDevice, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  let auth = ZenMoney.getData('auth')

  if (!auth) {
    auth = { device: generateDevice() }
  }

  await login(preferences, auth)
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
