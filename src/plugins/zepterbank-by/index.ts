import { authenticate, getAccounts, getTransactions } from './api'
import type { ScrapeFunc } from '../../types/zenmoney'
import type { PreferenceInput } from './types/base.types'

export const scrape: ScrapeFunc<PreferenceInput> = async ({ preferences, fromDate, toDate }) => {
  const { login, password } = preferences

  const { sessionToken } = await authenticate(login, password)

  console.log('[SCRAPE:AUTHENTICATE] Success')

  const accounts = await getAccounts({ sessionToken })

  console.log('[SCRAPE:ACCOUNTS] Successfully fetched', accounts.length, 'account(s)')

  const transactions = []

  // TODO: add isAccountSkipped
  // No Promise.all([...]) because bank may not like it
  for (const account of accounts) {
    const accountTransactions = await getTransactions({ sessionToken, fromDate, toDate }, account)
    transactions.push(...accountTransactions)
  }

  return { accounts, transactions }
}
