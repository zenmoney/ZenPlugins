import { ScrapeFunc, Transaction, Account } from '../../types/zenmoney'
import { fetchAllAccounts, fetchAuthorization, fetchAccountData } from './fetchApi'
import { Preferences } from './models'
import { convertAccount, convertTransactions } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  await fetchAuthorization(preferences)

  const fetchedAccounts = await fetchAllAccounts()

  const accounts: Account[] = []
  const transactions: Transaction[] = []

  for (const account of fetchedAccounts) {
    const rawAccountData = await fetchAccountData(account)
    accounts.push(convertAccount(account, rawAccountData))
    const filteredTransactions = convertTransactions(account, rawAccountData)
      .filter(transaction => transaction.date >= fromDate && (toDate == null || transaction.date <= toDate))
    transactions.push(...filteredTransactions)
  }

  return {
    accounts,
    transactions
  }
}
