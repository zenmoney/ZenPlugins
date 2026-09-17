import { ScrapeFunc } from '../../types/zenmoney'
import { login } from './api'
import { convertExternalStablecoinTransfers, createSpotAccount, parseSettlementAssets } from './converters'
import { fetchCapitalTransfers, fetchPrices, fetchSpotBalances } from './fetchApi'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const credentials = login(preferences)
  const [balances, prices, transfers] = await Promise.all([fetchSpotBalances(credentials), fetchPrices(), fetchCapitalTransfers(credentials, fromDate, toDate ?? new Date())])
  return {
    accounts: [createSpotAccount(preferences.accountLabel ?? 'MEXC', balances, prices)],
    transactions: convertExternalStablecoinTransfers(preferences.accountLabel ?? 'MEXC', transfers, parseSettlementAssets(preferences.externalTransferAssets))
  }
}
