import { Account, ScrapeFunc, Transaction } from '../../../types/zenmoney'
import { Preferences } from '../common'
import { fetchAccounts, fetchAccountTransactions, fetchBlockNoByTime } from './api'
import { convertAccounts, convertTransactions, mergeTransferTransactions } from './converters'

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate,
  toDate
}) => {
  const transactions: Transaction[] = []

  const [accountsResponse, startBlock, endBlock] = await Promise.all([
    fetchAccounts(preferences),
    fetchBlockNoByTime(preferences, {
      timestamp: Math.floor(fromDate.valueOf() / 1000)
    }),
    fetchBlockNoByTime(preferences, {
      timestamp: Math.floor((toDate ?? new Date()).valueOf() / 1000)
    })
  ])

  const accounts: Account[] = convertAccounts(accountsResponse)

  for (const account of accounts) {
    const accountTransactions = await fetchAccountTransactions(preferences, {
      account: account.id,
      startBlock,
      endBlock
    })

    transactions.push(...convertTransactions(account.id, accountTransactions))
  }

  return {
    accounts,
    transactions: mergeTransferTransactions(transactions)
  }
}
