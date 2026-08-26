import { ScrapeFunc } from '../../types/zenmoney'
import { login } from './api'
import { convertExternalStablecoinTransfers, convertInternalTransfers, createAccounts, parseSettlementAssets } from './converters'
import { fetchCapitalTransfers, fetchInternalTransfers, fetchWalletBalances } from './fetchApi'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const credentials = login(preferences)
  const effectiveToDate = toDate ?? new Date()
  const [wallets, transfers, internalTransfers] = await Promise.all([fetchWalletBalances(credentials), fetchCapitalTransfers(credentials, fromDate, effectiveToDate), fetchInternalTransfers(credentials, fromDate, effectiveToDate)])
  const assets = parseSettlementAssets(preferences.externalTransferAssets)
  return { accounts: createAccounts(preferences.accountLabel ?? 'BingX', wallets), transactions: [...convertExternalStablecoinTransfers(preferences.accountLabel ?? 'BingX', transfers, assets), ...convertInternalTransfers(preferences.accountLabel ?? 'BingX', internalTransfers, assets)].sort((left, right) => left.date.getTime() - right.date.getTime()) }
}
