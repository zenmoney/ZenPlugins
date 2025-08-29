import type { ScrapeFunc } from '../../types/zenmoney'
import type { Chain } from './common/types'

export interface Preferences {
  chain: Chain
  apiKey: string
  account: string
}

export type Scrape = (args: {
  startBlock: number
  endBlock: number
  preferences: Preferences
  isFirstRun: boolean
  isInBackground: boolean
}) => ReturnType<ScrapeFunc<Preferences>>
