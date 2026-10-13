import { ScrapeFunc } from '../../types/zenmoney'
import { fetchAddressInfos, fetchTransactions } from './api'
import { convertAccounts, convertTransactions } from './converters'
import { Preferences } from './models'
import { parseWallets } from './preferences'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate }) => {
  const wallets = parseWallets(preferences)
  const infoByAddress = await fetchAddressInfos(wallets)
  const transactions = await fetchTransactions(wallets, fromDate)

  return {
    accounts: convertAccounts(wallets, infoByAddress),
    transactions: convertTransactions(wallets, transactions)
  }
}
