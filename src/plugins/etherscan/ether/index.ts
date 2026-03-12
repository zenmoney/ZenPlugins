import { Account, Transaction } from '../../../types/zenmoney'
import { Scrape } from '../types'
import { fetchAccounts, fetchAccountTransactions } from './api'
import { mergeTransferTransactions } from '../common/converters'
import { convertAccounts, convertTransactions } from './converters'
import { Instruments } from '../common/config'

export const scrape: Scrape = async ({ chain, preferences, startBlock, endBlock }) => {
  const transactions: Transaction[] = []

  const accountsResponse = await fetchAccounts(preferences, chain)

  const instrument = Instruments[chain]
  const accounts: Account[] = convertAccounts(accountsResponse, instrument, chain)

  for (const raw of accountsResponse) {
    const accountTransactions = await fetchAccountTransactions(preferences, chain, {
      account: raw.account,
      startBlock,
      endBlock
    })

    transactions.push(...convertTransactions(raw.account, accountTransactions, chain))
  }

  return {
    accounts,
    transactions: mergeTransferTransactions(transactions)
  }
}
