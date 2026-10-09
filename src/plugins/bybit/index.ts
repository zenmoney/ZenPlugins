import { ScrapeFunc, Transaction } from '../../types/zenmoney'
import {
  fetchAccounts,
  fetchAuthorizationTransactions,
  fetchConvertCoinUsdtValues,
  fetchEarnUsdtPrices,
  fetchEarnTransfers,
  fetchExternalTransfers,
  fetchFlexibleEarnPositions,
  fetchInternalTransfers,
  fetchUnifiedWallet,
  fetchFinancialTransactions,
  login
} from './api'
import {
  createFlexibleEarnAccount,
  createFundingAccount,
  createUnifiedAccount,
  convertEarnTransfers,
  convertExternalTransfers,
  convertInternalTransfers,
  convertTransaction,
  parseCardConversionFeePercent,
  parseTransferAssets,
  selectCardSettlementAccount,
  selectCardTransactionsForImport,
  sumPendingCardHolds,
  withPendingCardHoldsDeducted
} from './converters'
import { Preferences } from './models'

function withoutSkippedAccounts (transactions: Transaction[]): Transaction[] {
  return transactions.filter(transaction => transaction.movements.every(movement => {
    return 'id' in movement.account && !ZenMoney.isAccountSkipped(movement.account.id)
  }))
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const auth = await login(preferences)
  const shouldSyncCard = preferences.syncCard !== false
  // Validated before any request, so a typo costs a message and not a whole
  // synchronization — but only when the card is actually being imported.
  const cardConversionFeePercent = shouldSyncCard
    ? parseCardConversionFeePercent(preferences.cardConversionFeePercent)
    : 0

  const [balances, convertUsdtValues, flexibleEarnPositions, unifiedWallet] = await Promise.all([
    fetchAccounts(auth.credentials),
    fetchConvertCoinUsdtValues(auth.credentials),
    fetchFlexibleEarnPositions(auth.credentials),
    fetchUnifiedWallet(auth.credentials)
  ])
  const earnUsdtPrices = await fetchEarnUsdtPrices(auth.credentials, flexibleEarnPositions)
  const unifiedAccount = createUnifiedAccount(unifiedWallet)
  const fundingAccount = createFundingAccount(balances, convertUsdtValues)
  const flexibleEarnAccount = createFlexibleEarnAccount(flexibleEarnPositions, earnUsdtPrices)
  const endDate = toDate ?? new Date()
  const transactions: Transaction[] = []

  if (preferences.syncTransfers === true) {
    const transferAssets = parseTransferAssets(preferences.transferAssets)
    // Keep history endpoints sequential. Besides making rate limiting
    // deterministic, this avoids bursts from three independent cursor loops.
    const external = await fetchExternalTransfers(auth.credentials, fromDate, endDate)
    const internal = await fetchInternalTransfers(auth.credentials, fromDate, endDate)
    const earn = await fetchEarnTransfers(auth.credentials, fromDate, endDate)
    transactions.push(
      ...convertExternalTransfers(external, preferences.externalTransferAccount ?? 'funding', transferAssets),
      ...convertInternalTransfers(internal, transferAssets),
      ...convertEarnTransfers(earn, preferences.earnTransferAccount ?? 'funding', transferAssets)
    )
  }
  if (!shouldSyncCard) {
    return {
      accounts: [unifiedAccount, fundingAccount, flexibleEarnAccount],
      transactions: withoutSkippedAccounts(transactions)
    }
  }
  // A Bybit Card is a payment instrument, not a separate wallet.  When Auto-
  // Deduction is active it debits Flexible Earn; otherwise it uses Funding.
  // Link card purchases to that existing financial wallet so ZenMoney shows the
  // same relationship as a bank card attached to one account, without a second
  // balance or a virtual account that cannot be reconciled.
  const cardSettlementAccount = selectCardSettlementAccount(
    preferences.cardPaymentSource,
    fundingAccount,
    flexibleEarnAccount
  )
  if (ZenMoney.isAccountSkipped(cardSettlementAccount.id)) {
    return { accounts: [unifiedAccount, fundingAccount, flexibleEarnAccount], transactions: withoutSkippedAccounts(transactions) }
  }

  const financialEntries = await fetchFinancialTransactions(auth.credentials, fromDate, endDate)
  const authorizationEntries = await fetchAuthorizationTransactions(auth.credentials, endDate)
  const entries = selectCardTransactionsForImport(financialEntries, authorizationEntries)
  for (const entry of entries) {
    const transaction = convertTransaction(entry, cardSettlementAccount, cardConversionFeePercent)
    if (transaction != null) {
      transactions.push(transaction)
    }
  }

  // Every open authorization is imported as a hold above while its money is
  // still sitting in Funding as parked fiat. Reporting both leaves the balance
  // overstated until the purchase clears.
  const fundingAccountWithoutHolds = withPendingCardHoldsDeducted(
    fundingAccount,
    sumPendingCardHolds(authorizationEntries)
  )

  return {
    accounts: [unifiedAccount, fundingAccountWithoutHolds, flexibleEarnAccount],
    transactions: withoutSkippedAccounts(transactions)
  }
}
