import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let auth = await login(preferences, ZenMoney.getData('auth', {}))
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accounts = []
  const transactions = []
  let apiAccounts = await fetchAccounts(auth)
  if (!apiAccounts) {
    auth = await login(preferences, ZenMoney.getData('auth', {}))
    apiAccounts = await fetchAccounts(auth)
    console.assert(apiAccounts, 'LOGGED_OUT_USER even after relogin')
  }
  await Promise.all(convertAccounts(apiAccounts).map(async ({ mainProduct, account }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }

    const apiTransactions = await fetchTransactions(auth, mainProduct, fromDate, toDate)
    if (!apiTransactions) {
      auth = await login(preferences, ZenMoney.getData('auth', {}))
      apiAccounts = await fetchAccounts(auth.device)
      console.assert(apiAccounts, 'Still can\'t get accounts after relogin')
    }
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
