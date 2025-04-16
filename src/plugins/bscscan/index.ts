import { ScrapeFunc } from '../../types/zenmoney'
import { fetchBlockNoByTime } from './common'
import { Preferences } from './types'

import { scrape as scrapeBnb } from './bnb'
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

  const [bnb, tokens] = await Promise.all([
    scrapeBnb({
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
    accounts: [...bnb.accounts, ...tokens.accounts],
    transactions: [...bnb.transactions, ...tokens.transactions]
  }
}
