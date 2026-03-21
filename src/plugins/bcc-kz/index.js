import { fetchAccounts, fetchTransactions, generateDevice, login, setLanguageCookie } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function fetchAccountsWithCachedAuthFallback (preferences, auth, deps = { fetchAccounts, login }) {
  if (auth?.accessToken) {
    try {
      return await deps.fetchAccounts(auth)
    } catch (error) {
      delete auth.accessToken
      delete auth.sessionCode
    }
  }

  await deps.login(preferences, auth)
  return await deps.fetchAccounts(auth)
}

export async function scrape ({ preferences, fromDate, toDate }) {
  toDate = toDate || new Date()

  let auth = ZenMoney.getData('auth')
  if (!auth) {
    auth = {
      device: generateDevice()
    }
  }
  await setLanguageCookie()

  const apiAccounts = await fetchAccountsWithCachedAuthFallback(preferences, auth)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accountsData = []
  const transactions = []
  await Promise.all(convertAccounts(apiAccounts).map(async ({ product, accounts }) => {
    accountsData.push(...accounts)
    if (ZenMoney.isAccountSkipped(product.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
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
