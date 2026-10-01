import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { login } from './api'
import { convertC2CTransfers, convertEarnTransfers, convertExternalStablecoinTransfers, convertInternalTransfers, convertPayTransfers, createAccounts } from './converters'
import { fetchC2CTransfers, fetchCapitalTransfers, fetchEarnTransfers, fetchFlexibleEarn, fetchFundingBalances, fetchInternalTransfers, fetchLockedEarn, fetchPayTransfers, fetchPrices, fetchSpotBalances, fetchWalletBalances } from './fetchApi'
import { Preferences } from './models'
import { parseSettlementAssets } from '../../common/settlementAssets'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const credentials = login(preferences)
  // Keep the legacy Binance IDs when the label is empty. A distinct label lets
  // multiple API keys for separate Binance users/accounts avoid auto-matching.
  const configuredLabel = preferences.accountLabel?.trim()
  const accountLabel = configuredLabel == null || configuredLabel === '' ? 'Binance' : configuredLabel
  const selection = { spot: true, funding: true, earn: true }
  const [spot, funding, flexible, lockedEarn, prices, wallets] = await Promise.all([
    fetchSpotBalances(credentials),
    fetchFundingBalances(credentials),
    fetchFlexibleEarn(credentials),
    fetchLockedEarn(credentials),
    fetchPrices(credentials.baseUrl),
    fetchWalletBalances(credentials)
  ])
  const accounts = createAccounts(accountLabel, spot, funding, flexible, lockedEarn, prices, selection, wallets, true)
  const transactions: Transaction[] = []
  if (preferences.syncTransactions !== false) {
    const settlementAssets = parseSettlementAssets(preferences.externalTransferAssets)
    const until = toDate ?? new Date()
    // Fetch the heavier history endpoints sequentially. Binance assigns very
    // different request weights to wallet, Pay and Earn APIs; a large initial
    // sync must not create an avoidable burst and trigger an IP ban.
    transactions.push(...convertExternalStablecoinTransfers(accountLabel, await fetchCapitalTransfers(credentials, fromDate, until), selection, true, settlementAssets))
    transactions.push(...convertPayTransfers(accountLabel, await fetchPayTransfers(credentials, fromDate, until), selection, true, settlementAssets))
    transactions.push(...convertC2CTransfers(accountLabel, await fetchC2CTransfers(credentials, fromDate, until), selection, true, settlementAssets))
    transactions.push(...convertInternalTransfers(accountLabel, await fetchInternalTransfers(credentials, fromDate, until), selection, true, settlementAssets))
    transactions.push(...convertEarnTransfers(accountLabel, await fetchEarnTransfers(credentials, fromDate, until), selection, true, settlementAssets))
  }
  return {
    accounts,
    transactions
  }
}
