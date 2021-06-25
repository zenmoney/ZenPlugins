import { uniqBy } from 'lodash'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertCard, convertDeposit, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  const token = await login(preferences.phone, preferences.password)
  const accounts = (await fetchAccounts(token))
  const cards = accounts.cards
    .map(convertCard)
    .filter(account => account !== null)

  let preparedAccounts = cards
  if (accounts.deposits) {
    const deposits = accounts.deposits
      .map(convertDeposit)
      .filter(account => account !== null)
    preparedAccounts = cards.concat(deposits).filter(acc => !ZenMoney.isAccountSkipped(acc.id))
  }

  const transactions = uniqBy(await fetchTransactions(token, preparedAccounts, fromDate, toDate), (tr) => tr.cardPAN + '#' + tr.operationDate + '#' + tr.operationName + '#' + tr.operationAmount)
    .map(transaction => convertTransaction(transaction, preparedAccounts))

  return {
    accounts: preparedAccounts,
    transactions: transactions
  }
}
