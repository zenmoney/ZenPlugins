import type { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { authenticate, getAccounts, getTransactions } from './api'
import type { PreferenceInput } from './types/base'

export const scrape: ScrapeFunc<PreferenceInput> = async ({ preferences, fromDate, toDate }) => {
  const { login, password } = preferences

  const { sessionToken } = await authenticate(login, password)

  console.log('[SCRAPE:AUTHENTICATE] Success')

  const accounts = await getAccounts({ sessionToken })

  console.log('[SCRAPE:ACCOUNTS] Successfully fetched', accounts.length, 'account(s)')

  const transactions: Transaction[] = []

  for (const account of accounts) {
    const accountTransactions = await getTransactions({ sessionToken, fromDate, toDate }, account)
    transactions.push(...accountTransactions)
  }

  return { accounts, transactions }
}
