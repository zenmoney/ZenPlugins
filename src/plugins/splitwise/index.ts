import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchExpenses, fetchCurrentUser, fetchBalances } from './fetchApi'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const auth: Auth = {
    token: preferences.token,
    startDate: preferences.startDate
  }
  toDate = toDate ?? new Date()
  fromDate = fromDate ?? new Date(preferences.startDate)

  const currentUser = await fetchCurrentUser(auth)

  // Get all expenses to create accounts
  const allExpenses = await fetchExpenses(auth, new Date(preferences.startDate), toDate)
  const accounts = convertAccounts(allExpenses, await fetchBalances(auth))

  // Get expenses for the sync period
  const apiExpenses = fromDate.getTime() === new Date(preferences.startDate).getTime()
    ? allExpenses // Reuse expenses if it's initial sync
    : await fetchExpenses(auth, fromDate, toDate)

  const transactions = apiExpenses
    .map((expense) => convertTransaction(expense, currentUser.id))
    .filter((transaction): transaction is Transaction => transaction !== null)

  return {
    accounts,
    transactions
  }
}
