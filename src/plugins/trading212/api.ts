import _ from 'lodash'

import { fetchAccountSummary, fetchTransactionsPage } from './fetchApi'
import { AccountSummary, Preferences, ApiTransaction } from './models'

export async function fetchAccount (preferences: Preferences): Promise<AccountSummary> {
  return await fetchAccountSummary(preferences)
}

export async function fetchTransactions (preferences: Preferences, fromDate?: Date, toDate?: Date): Promise<ApiTransaction[]> {
  const transactions: ApiTransaction[] = []

  let page = await fetchTransactionsPage(preferences)
  transactions.push(...page.items)
  while (page.nextPaghPath != null) {
    page = await fetchTransactionsPage(preferences, page.nextPaghPath)
    transactions.push(...page.items)

    if ((fromDate != null) && new Date(transactions[transactions.length - 1].dateTime) < fromDate) {
      break
    }
  }

  console.log(fromDate, toDate, transactions.length)

  const sliceStart = (toDate != null)
    ? _.findIndex(transactions, transaction => Date.parse(transaction.dateTime) <= toDate.getTime())
    : 0

  const sliceEnd = (fromDate != null)
    ? _.findLastIndex(transactions, transaction => Date.parse(transaction.dateTime) >= fromDate.getTime())
    : transactions.length - 1

  console.log(sliceStart, sliceEnd)

  return transactions.slice(sliceStart, sliceEnd + 1)
}
