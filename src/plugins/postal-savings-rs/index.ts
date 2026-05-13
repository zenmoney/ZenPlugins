import { ScrapeFunc, Transaction, Account } from '../../types/zenmoney'
import { fetchAllAccounts, fetchAuthorization } from './fetchApi'
import { Preferences } from './models'
import { accountDetailsToId } from './converters'
import { fetchAccount, fetchTransactions } from './api'

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
    accounts.push(account)
    transactions.push(...await fetchTransactions(account, fromDate, toDate))
  }

  return {
    accounts,
    transactions
  }
}
