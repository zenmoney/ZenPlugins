import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  const auth = await login(preferences.token)
  const accounts = convertAccounts(await fetchAccounts(auth), auth.walletId)
  const transactions = []
  const apiTransactions = await fetchTransactions(auth, fromDate, toDate)
  for (const apiTransaction of apiTransactions) {
    const transaction = convertTransaction(apiTransaction, auth.walletId)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
