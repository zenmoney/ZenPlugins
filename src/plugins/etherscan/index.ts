import {
  ScrapeFunc
} from '../../types/zenmoney'
import { Preferences } from './common'

import { scrape as scrapeEther } from './ether'

export const scrape: ScrapeFunc<Preferences> = async (params) => {
  return await scrapeEther(params)
}
