import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertCard, convertDeposit, convertCheckingAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences)
  const accounts = (await fetchAccounts(token))
  const cards = accounts.cards
    .map(convertCard)
    .filter(account => account !== null)
  let preparedAccounts = cards
  if (accounts.deposits) {
    const deposits = accounts.deposits
      .map(convertDeposit)
      .filter(account => account !== null)
    preparedAccounts = preparedAccounts.concat(deposits)
  }
  if (accounts.checkingAccounts) {
    const checkingAccounts = accounts.checkingAccounts
      .map(convertCheckingAccount)
      .filter(account => account !== null)
    preparedAccounts = preparedAccounts.concat(checkingAccounts)
  }

  const accountsForTransactions = preparedAccounts
    .filter(account => !ZenMoney.isAccountSkipped(account.id))
  const transactions = (await fetchTransactions(token, accountsForTransactions, fromDate, toDate))
    .map(transaction => convertTransaction(transaction, preparedAccounts))
    .filter(transaction => transaction !== null)
  return {
    accounts: preparedAccounts,
    transactions: adjustTransactions({ transactions: transactions.sort((a, b) => a.date - b.date) })
  }
}
