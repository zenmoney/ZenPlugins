import { fetchAccounts, fetchTransactions, login } from './bank'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const auth = await login(preferences)
  const apiAccounts = await fetchAccounts(auth)
  const accounts = []

  let transactions = []
  let accountIndex = 0

  for (const apiAccount of apiAccounts) {
    const account = convertAccount(apiAccount)
    accounts.push(account)

    if (!ZenMoney.isAccountSkipped(account.id)) {
      const apiTransactions = await fetchTransactions(apiAccount.accountId, fromDate, toDate, auth, ++accountIndex)

      transactions = [
        ...transactions,
        ...apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, account.id))
      ]
    }
  }
  return {
    accounts,
    transactions
  }
}
