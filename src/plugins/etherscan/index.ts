import type { Account, Transaction, ScrapeFunc } from '../../types/zenmoney'
import { fetchBlockNoByTime } from './common'
import type { Preferences } from './types'
import type { Chain } from './common/types'

import { scrape as scrapeEther } from './ether'
import { scrape as scrapeTokens } from './tokens'
import { ETHER_MAINNET, BNB_MAINNET, ARBITRUM_ONE, ChainMinTimestamp } from './common/config'

function parseChains (preferences: Preferences): Chain[] {
  const chains: Chain[] = []

  if (preferences.chainEthereum === true) chains.push(ETHER_MAINNET)
  if (preferences.chainBsc === true) chains.push(BNB_MAINNET)
  if (preferences.chainArbitrum === true) chains.push(ARBITRUM_ONE)

  // New checkboxes selected — use them
  if (chains.length > 0) return chains

  // Legacy fallback: single chain from old config
  if (preferences.chain != null) return [preferences.chain]

  return [ETHER_MAINNET]
}

export const scrape: ScrapeFunc<Preferences> = async ({
  fromDate,
  toDate,
  preferences,
  isFirstRun,
  isInBackground
}) => {
  const chains = parseChains(preferences)

  const allAccounts: Account[] = []
  const allTransactions: Transaction[] = []

  for (const chain of chains) {
    const minTs = ChainMinTimestamp[chain] ?? 0
    const fromTs = Math.max(Math.floor(fromDate.valueOf() / 1000), minTs)
    const toTs = Math.max(Math.floor((toDate ?? new Date()).valueOf() / 1000), minTs)

    const [startBlock, endBlock] = await Promise.all([
      fetchBlockNoByTime(preferences, chain, { timestamp: fromTs }),
      fetchBlockNoByTime(preferences, chain, { timestamp: toTs })
    ])

    const [ether, tokens] = await Promise.all([
      scrapeEther({
        chain,
        preferences,
        startBlock,
        endBlock,
        isFirstRun,
        isInBackground
      }),
      scrapeTokens({
        chain,
        preferences,
        startBlock,
        endBlock,
        isFirstRun,
        isInBackground
      })
    ])

    allAccounts.push(...ether.accounts, ...tokens.accounts)
    allTransactions.push(...ether.transactions, ...tokens.transactions)
  }

  return {
    accounts: allAccounts,
    transactions: allTransactions
  }
}
