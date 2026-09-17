import { ScrapeFunc } from '../../types/zenmoney'
import { scrapeQPay } from './api'
import { Preferences } from './models'

/** Q-Pay plugin entrypoint. */
export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const { accounts, transactions, session } = await scrapeQPay(
    preferences,
    ZenMoney.getData('session'),
    fromDate,
    toDate ?? new Date()
  )
  ZenMoney.setData('session', session)
  ZenMoney.saveData()
  return { accounts, transactions }
}
