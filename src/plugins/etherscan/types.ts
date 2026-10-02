import type { ScrapeFunc } from '../../types/zenmoney'
import type { Chain } from './common/types'

export interface Preferences {
  // Legacy single-chain (old configs)
  chain?: Chain
  // New multi-chain checkboxes
  chainEthereum?: boolean
  chainBsc?: boolean
  chainArbitrum?: boolean
  apiKey: string
  account: string
}

export type Scrape = (args: {
  chain: Chain
  startBlock: number
  endBlock: number
  preferences: Preferences
  isFirstRun: boolean
  isInBackground: boolean
}) => ReturnType<ScrapeFunc<Preferences>>
