import { ScrapeFunc } from '../../types/zenmoney'

export interface Preferences {
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
