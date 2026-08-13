import { ScrapeFunc } from '../../types/zenmoney'
import { scrapeJupiter } from './api'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate }) => {
  ZenMoney.locale = 'en'
  // pass the persisted blob through as-is; scrapeJupiter validates it
  const { accounts, transactions, auth } = await scrapeJupiter(preferences, fromDate, ZenMoney.getData('auth'))
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()
  return { accounts, transactions }
}
