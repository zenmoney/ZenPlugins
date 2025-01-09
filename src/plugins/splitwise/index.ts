import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchExpenses, fetchCurrentUser } from './fetchApi'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'
import { InvalidPreferencesError } from '../../errors'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  if (!preferences.token) {
    throw new InvalidPreferencesError('Token is required')
  }

  const auth: Auth = {
    token: preferences.token,
    startDate: preferences.startDate ?? '2000-01-01'
  }

  // Ensure valid dates
  toDate = toDate ?? new Date()
  fromDate = fromDate ?? new Date(auth.startDate)

  // Validate dates
  if (isNaN(fromDate.getTime())) {
    fromDate = new Date('2000-01-01')
  }
  if (isNaN(toDate.getTime())) {
    toDate = new Date()
  }

  const currentUser = await fetchCurrentUser(auth)

  // Get all expenses to create accounts
  const allExpenses = await fetchExpenses(auth, fromDate)
  const accounts = convertAccounts(allExpenses)

  // Get expenses for the sync period
  const apiExpenses = fromDate.getTime() === new Date(auth.startDate).getTime()
    ? allExpenses // Reuse expenses if it's initial sync
    : await fetchExpenses(auth, fromDate)

  const transactions = apiExpenses
    .map((expense) => convertTransaction(expense, currentUser.id))
    .filter((transaction): transaction is Transaction => transaction !== null)

  return {
    accounts,
    transactions
  }
}
