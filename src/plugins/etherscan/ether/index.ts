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

  const accountsResponse = await fetchAccounts(preferences)

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
