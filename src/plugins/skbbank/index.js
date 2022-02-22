import { UserInteractionError } from '../../errors'
import { fetchProducts, fetchTransactions, login } from './api'
import { convertAccounts, convertTransaction, groupAccountsById } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (isInBackground) {
    throw new UserInteractionError()
  }
  await login(preferences.login, preferences.password)
  const products = await fetchProducts()
  const accounts = convertAccounts(products)
  const accountsById = groupAccountsById(accounts)
  const operations = await fetchTransactions(fromDate, toDate)
  const transactions = operations.map(transaction => convertTransaction(transaction, accountsById)).filter(x => x)
  return {
    accounts,
    transactions
  }
}
