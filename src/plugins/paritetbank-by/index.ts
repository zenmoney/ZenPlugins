import { ScrapeFunc } from '../../types/zenmoney'

export const scrape: ScrapeFunc<{ login: string, password: string }> = async ({ preferences, fromDate, toDate }) => {
  const { login, password } = preferences

  return {
    accounts: [],
    transactions: []
  }
}
