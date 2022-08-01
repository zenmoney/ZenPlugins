import {
  ScrapeFunc
} from '../../types/zenmoney'
import { fetchBlockNoByTime, Preferences } from './common'

import { scrape as scrapeEther } from './ether'
import { scrape as scrapeTokens } from './tokens'

export const scrape: ScrapeFunc<Preferences> = async ({
  fromDate,
  toDate,
  preferences,
  isFirstRun,
  isInBackground
}) => {
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
