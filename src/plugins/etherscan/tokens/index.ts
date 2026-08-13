import { Transaction } from '../../../types/zenmoney'
import { appendTransactions, mergeTransferTransactions } from '../common/converters'
import { Scrape } from '../types'

import { convertAccounts, convertTransactions } from './converters'
import { fetchAccounts, fetchAccountTransactions } from './erc20'

export const scrape: Scrape = async ({ preferences, startBlock, endBlock }) => {
  const transactions: Transaction[] = []
  const [accounts] = await Promise.all([fetchAccounts(preferences)])

  for (const account of accounts) {
    const accountTransactions = await fetchAccountTransactions(
      preferences,
      account,
      {
        startBlock,
        endBlock
      }
    )

    appendTransactions(
      transactions,
      convertTransactions(account, accountTransactions, preferences.chain)
    )
  }

  return {
    accounts: convertAccounts(accounts, preferences.chain),
    transactions: mergeTransferTransactions(transactions)
  }
}
