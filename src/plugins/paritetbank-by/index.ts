import { authenticate, getAccounts, getTransactions } from './api'
import type { ScrapeFunc } from '../../types/zenmoney'
import type { PreferenceInput } from './types/base'

export const scrape: ScrapeFunc<PreferenceInput> = async ({ preferences, fromDate, toDate }) => {
  console.log('SCRAPE', preferences, fromDate, toDate)
  const { login, password } = preferences

  const { sessionToken } = await authenticate(login, password)

  const accounts = await getAccounts({ sessionToken })
  const transactions = await getTransactions({ sessionToken, fromDate, toDate })

  return { accounts, transactions }
}
