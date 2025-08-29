import type { ScrapeFunc } from '../../types/zenmoney'
import { fetchBlockNoByTime } from './common'
import type { Preferences } from './types'

import { scrape as scrapeEther } from './ether'
import { scrape as scrapeTokens } from './tokens'
import { ETHER_MAINNET } from './common/config'

export const scrape: ScrapeFunc<Preferences> = async ({
  fromDate,
  toDate,
  preferences,
  isFirstRun,
  isInBackground
}) => {
  if (preferences.chain === undefined) {
    preferences.chain = ETHER_MAINNET
  }

  const [startBlock, endBlock] = await Promise.all([
    fetchBlockNoByTime(preferences, {
      timestamp: Math.floor(fromDate.valueOf() / 1000)
    }),
    fetchBlockNoByTime(preferences, {
      timestamp: Math.floor((toDate ?? new Date()).valueOf() / 1000)
    })
  ])

  const [ether, tokens] = await Promise.all([
    scrapeEther({
      preferences,
      startBlock,
      endBlock,
      isFirstRun,
      isInBackground
    }),
    scrapeTokens({
      preferences,
      startBlock,
      endBlock,
      isFirstRun,
      isInBackground
    })
  ])

  return {
    accounts: [...ether.accounts, ...tokens.accounts],
    transactions: [...ether.transactions, ...tokens.transactions]
  }
}
