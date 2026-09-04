import { ScrapeFunc } from '../../types/zenmoney'
import { login } from './api'
import { convertExternalStablecoinTransfers, createAccounts, parseSettlementAssets } from './converters'
import { fetchCapitalTransfers, fetchWalletBalances } from './fetchApi'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const credentials = login(preferences)
  const [wallets, transfers] = await Promise.all([fetchWalletBalances(credentials), fetchCapitalTransfers(credentials, fromDate, toDate ?? new Date())])
  return { accounts: createAccounts(preferences.accountLabel ?? 'OKX', wallets), transactions: convertExternalStablecoinTransfers(preferences.accountLabel ?? 'OKX', transfers, parseSettlementAssets(preferences.externalTransferAssets)) }
}
