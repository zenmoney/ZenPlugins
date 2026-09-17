import { Transaction } from '../../../types/zenmoney'
import { mergeTransferTransactions } from '../common/converters'
import { Scrape } from '../types'

import { convertAccounts, convertTransactions } from './converters'
import { fetchAccounts, fetchAccountTransactions } from './bep20'

export const scrape: Scrape = async ({
  preferences,
  startBlock,
  endBlock
}) => {
  const transactions: Transaction[] = []
  const accountsWithActivity = new Set<string>()
  const [accounts] = await Promise.all([
    fetchAccounts(preferences)
  ])

  for (const account of accounts) {
    const accountTransactions = await fetchAccountTransactions(preferences, account, {
      startBlock,
      endBlock
    })

    if (account.balance !== 0 || accountTransactions.length > 0) {
      accountsWithActivity.add(`${account.id}-${account.contractAddress}`)
    }
    transactions.push(...convertTransactions(account, accountTransactions))
  }

  return {
    // Preserve the legacy anyUSDC contract without cluttering new installs
    // with empty stablecoin accounts.
    accounts: convertAccounts(accounts.filter(account => accountsWithActivity.has(`${account.id}-${account.contractAddress}`))),
    transactions: mergeTransferTransactions(transactions)
  }
}
