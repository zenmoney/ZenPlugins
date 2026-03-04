import { fetchAccounts, fetchTransactions, generateDevice, login, setLanguageCookie } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  let auth = ZenMoney.getData('auth')
  if (!auth) {
    auth = {
      device: generateDevice()
    }
  }
  await setLanguageCookie()

  await login(preferences, auth)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accountsData = []
  const transactions = []
  await Promise.all(convertAccounts(await fetchAccounts(auth)).map(async ({ product, accounts }) => {
    accountsData.push(...accounts)
    if (ZenMoney.isAccountSkipped(product.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(product, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, accounts)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))
  return {
    accounts: accountsData,
    transactions
  }
}
