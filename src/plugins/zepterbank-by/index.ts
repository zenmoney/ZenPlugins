import { authenticate, getAccounts, getTransactions } from './api'
import type { ScrapeFunc } from '../../types/zenmoney'
import type { PreferenceInput } from './types/base.types'

export const scrape: ScrapeFunc<PreferenceInput> = async ({ preferences, fromDate, toDate }) => {
  console.log('SCRAPE', preferences, fromDate, toDate)
  const { login, password } = preferences

  const { sessionToken } = await authenticate(login, password)

  console.log('[SCRAPE:AUTHENTICATE] Success', sessionToken)

  const accounts = await getAccounts({ sessionToken })

  console.log('[SCRAPE:ACCOUNTS] Success', accounts)

  const transactions = []

  // TODO: add isAccountSkipped
  // No Promise.all([...]) because bank may not like it
  for (const account of accounts) {
    console.log('[SCRAPE:TRANSACTIONS] Get for account', account.id)
    const accountTransactions = await getTransactions({ sessionToken, fromDate, toDate }, account)
    transactions.push(...accountTransactions)
  }

  return { accounts, transactions }
}
