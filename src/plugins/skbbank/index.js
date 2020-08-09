import { fetchProducts, fetchTransactions, login } from './skbbank'
import { convertAccount, convertCard, convertDeposit, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  await login(preferences.login, preferences.password)
  const products = await fetchProducts()
  let accounts = products.cards.map(convertCard).filter(x => !!x)
  accounts = accounts.concat(products.accounts.map(convertAccount).filter(x => !!x))
  accounts = accounts.concat(products.deposits.map(convertDeposit).filter(x => !!x))
  const operations = await fetchTransactions(fromDate, toDate)
  const transactions = operations.map(transaction => convertTransaction(transaction, accounts))
  return {
    accounts: accounts,
    transactions: transactions
  }
}
