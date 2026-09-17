import { Account, Transaction } from '../../../types/zenmoney'
import { Scrape } from '../types'
import { fetchAccounts, fetchAccountTransactions } from './api'
import { mergeTransferTransactions } from '../common/converters'
import { convertAccounts, convertTransactions } from './converters'

export const scrape: Scrape = async ({
  preferences,
  startBlock,
  endBlock
}) => {
  const transactions: Transaction[] = []
  const accountsWithActivity = new Set<string>()

  const accountsResponse = await fetchAccounts(preferences)

  const accounts: Account[] = convertAccounts(accountsResponse)

  for (const account of accounts) {
    const accountTransactions = await fetchAccountTransactions(preferences, {
      account: account.id,
      startBlock,
      endBlock
    })

    if (account.balance !== 0 || accountTransactions.length > 0) {
      accountsWithActivity.add(account.id)
    }
    transactions.push(...convertTransactions(account.id, accountTransactions))
  }

  return {
    accounts: accounts.filter(account => accountsWithActivity.has(account.id)),
    transactions: mergeTransferTransactions(transactions)
  }
}
