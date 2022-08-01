import { ScrapeFunc } from '../../../types/zenmoney'
import { Preferences } from '../common'
import { fetchAccounts } from './erc20'

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate,
  toDate
}) => {
  const [accounts] = await Promise.all([
    fetchAccounts(preferences)
  ])

  return {
    accounts,
    transactions: []
  }
}
