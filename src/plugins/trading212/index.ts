import { ScrapeFunc } from '../../types/zenmoney'
import { convertAccount, convertTransactions } from './converters'
import { fetchAccount, fetchTransactions } from './api'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const { account, card } = convertAccount(await fetchAccount(preferences))
  const transactions = convertTransactions(
    await fetchTransactions(preferences, fromDate, toDate),
    account.id,
    card.id,
    preferences
  )

  return {
    accounts: [account, card],
    transactions
  }
}
