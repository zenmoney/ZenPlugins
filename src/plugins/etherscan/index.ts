import {
  ScrapeFunc
} from '../../types/zenmoney'
import { Preferences } from './common'

import { scrape as scrapeEther } from './ether'
import { scrape as scrapeTokens } from './tokens'

export const scrape: ScrapeFunc<Preferences> = async (params) => {
  const [ether, tokens] = await Promise.all([
    scrapeEther(params),
    scrapeTokens(params)
  ])

  console.log([...ether.accounts, ...tokens.accounts])

  return {
    accounts: [...ether.accounts, ...tokens.accounts],
    transactions: [...ether.transactions, ...tokens.transactions]
  }
}
