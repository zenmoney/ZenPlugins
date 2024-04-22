import { ScrapeFunc, Transaction, Account } from '../../types/zenmoney'
import { fetchAllAccounts, fetchAuthorization } from './fetchApi'
import { Preferences } from './models'
import { accountDetailsToId, convertTransactions } from './converters'
import { fetchAccount } from './api'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  await fetchAuthorization(preferences)

  const fetchedAccounts = await fetchAllAccounts()

  const accounts: Account[] = []
  const transactions: Transaction[] = []

  for (const accountDetails of fetchedAccounts) {
    if (ZenMoney.isAccountSkipped(accountDetailsToId(accountDetails))) {
      continue
    }

    const account = await fetchAccount(accountDetails)
    const filteredTransactions = convertTransactions(accountDetails, account.rawData)
      .filter(transaction => transaction.date >= fromDate && (toDate == null || transaction.date <= toDate))
    accounts.push(account)
    transactions.push(...filteredTransactions)
  }

  return {
    accounts,
    transactions
  }
}
