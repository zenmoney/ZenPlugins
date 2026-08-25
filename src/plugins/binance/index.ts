import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import { login } from './api'
import { convertC2CTransfers, convertEarnTransfers, convertExternalStablecoinTransfers, convertInternalTransfers, convertPayTransfers, createAccounts } from './converters'
import { fetchC2CTransfers, fetchCapitalTransfers, fetchEarnTransfers, fetchFlexibleEarn, fetchFundingBalances, fetchInternalTransfers, fetchLockedEarn, fetchPayTransfers, fetchPrices, fetchSpotBalances, fetchWalletBalances } from './fetchApi'
import { Preferences } from './models'
import { parseSettlementAssets } from '../../common/settlementAssets'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const credentials = login(preferences)
  const selection = {
    spot: preferences.syncSpot !== false,
    funding: preferences.syncFunding !== false,
    earn: preferences.syncEarn !== false
  }
  const [spot, funding, flexible, lockedEarn, prices, wallets] = await Promise.all([
    selection.spot ? fetchSpotBalances(credentials) : Promise.resolve([]),
    selection.funding ? fetchFundingBalances(credentials) : Promise.resolve([]),
    selection.earn ? fetchFlexibleEarn(credentials) : Promise.resolve([]),
    selection.earn ? fetchLockedEarn(credentials) : Promise.resolve([]),
    fetchPrices(credentials.baseUrl),
    fetchWalletBalances(credentials)
  ])
  const detailedWallets = preferences.detailedWallets !== false
  const accounts = createAccounts(preferences.accountLabel ?? 'Binance', spot, funding, flexible, lockedEarn, prices, selection, wallets, detailedWallets)
  const transactions: Transaction[] = []
  if (preferences.syncTransactions !== false) {
    const settlementAssets = parseSettlementAssets(preferences.externalTransferAssets)
    const until = toDate ?? new Date()
    // Fetch the heavier history endpoints sequentially. Binance assigns very
    // different request weights to wallet, Pay and Earn APIs; a large initial
    // sync must not create an avoidable burst and trigger an IP ban.
    transactions.push(...convertExternalStablecoinTransfers(preferences.accountLabel ?? 'Binance', await fetchCapitalTransfers(credentials, fromDate, until), selection, detailedWallets, settlementAssets))
    transactions.push(...convertPayTransfers(preferences.accountLabel ?? 'Binance', await fetchPayTransfers(credentials, fromDate, until), selection, detailedWallets, settlementAssets))
    transactions.push(...convertC2CTransfers(preferences.accountLabel ?? 'Binance', await fetchC2CTransfers(credentials, fromDate, until), selection, detailedWallets, settlementAssets))
    transactions.push(...convertInternalTransfers(preferences.accountLabel ?? 'Binance', await fetchInternalTransfers(credentials, fromDate, until), selection, detailedWallets, settlementAssets))
    transactions.push(...convertEarnTransfers(preferences.accountLabel ?? 'Binance', await fetchEarnTransfers(credentials, fromDate, until), selection, detailedWallets, settlementAssets))
  }
  return {
    accounts,
    transactions
  }
}
