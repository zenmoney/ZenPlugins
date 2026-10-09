import { fetchAccounts, fetchTransactions, generateDevice, setLanguageCookie, setMbsessionCookie, withAuthRecovery } from './api'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  toDate = toDate || new Date()

  let auth = ZenMoney.getData('auth')
  if (!auth) {
    auth = {
      device: generateDevice()
    }
  }
  await setLanguageCookie()
  await setMbsessionCookie(auth)

  return await withAuthRecovery(preferences, auth, async () => {
    const apiAccounts = await fetchAccounts(auth)
    const accountsData = []
    const transactions = []
    // Finish each statement before retrying auth; no request may use a replaced session.
    for (const { product, accounts } of convertAccounts(apiAccounts)) {
      accountsData.push(...accounts)
      if (ZenMoney.isAccountSkipped(product.id)) {
        continue
      }
      const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, accounts)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }
    return {
      accounts: accountsData,
      transactions: adjustTransactions({ transactions, accounts: accountsData })
    }
  }, {
    isInBackground,
    onAuth: () => {
      ZenMoney.setData('auth', auth)
      ZenMoney.saveData()
    }
  })
}
