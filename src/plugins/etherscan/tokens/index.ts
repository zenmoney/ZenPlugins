import { Transaction } from '../../../types/zenmoney'
import { mergeTransferTransactions } from '../common/converters'
import { Scrape } from '../types'

import { convertAccounts, convertTransactions } from './converters'
import { fetchAccounts, fetchAccountTransactions } from './erc20'

export const scrape: Scrape = async ({ chain, preferences, startBlock, endBlock }) => {
  const transactions: Transaction[] = []
  const [accounts] = await Promise.all([fetchAccounts(preferences, chain)])

  for (const account of accounts) {
    const accountTransactions = await fetchAccountTransactions(
      preferences,
      chain,
      account,
      {
        startBlock,
        endBlock
      }
    )

    transactions.push(
      ...convertTransactions(account, accountTransactions, chain)
    )
  }

  return {
    accounts: convertAccounts(accounts, chain),
    transactions: mergeTransferTransactions(transactions)
  }
}
