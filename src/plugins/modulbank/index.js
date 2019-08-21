//
// TODO:
// - Добавить поддержку депозитных счетов, счетов для процентов по депозиту, счетов учета резервов.
//
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate }) {
  let token = ZenMoney.getData('accessToken')
  if (!token) {
    token = await login()
    ZenMoney.setData('accessToken', token)
  }

  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account && !ZenMoney.isAccountSkipped(account.id))
  console.log(`Всего счетов: ${accounts.length}`)

  const transactions = (await fetchTransactions(token, accounts, fromDate))
    .map(transaction => convertTransaction(transaction, accounts))
    .filter(transaction => transaction)
  console.log(`Всего операций: ${transactions.length}`)

  return {
    accounts: accounts,
    transactions: transactions
  }
}
