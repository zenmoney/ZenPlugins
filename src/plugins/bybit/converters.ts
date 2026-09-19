import { InvalidPreferencesError } from '../../errors'
import { AccountOrCard, AccountType, Merchant, Transaction } from '../../types/zenmoney'
import { CardTransaction, CoinBalance, EarnTransfer, ExternalTransfer, FlexibleEarnPosition, InternalTransfer, UnifiedWallet } from './models'

export const BYBIT_UNIFIED_ACCOUNT_ID = 'bybit_unified'
export const BYBIT_FUNDING_ACCOUNT_ID = 'bybit_funding'
export const BYBIT_FLEXIBLE_EARN_ACCOUNT_ID = 'bybit_flexible_earn'
export const DEFAULT_TRANSFER_ASSETS = new Set(['USDT', 'USDC', 'FDUSD', 'TUSD', 'USD'])

export function parseTransferAssets (raw?: string): Set<string> {
  const assets = new Set((raw ?? 'USDT,USDC,FDUSD,TUSD,USD').split(',').map(value => value.trim().toUpperCase()).filter(Boolean))
  if (assets.size === 0) throw new InvalidPreferencesError('Bybit: choose at least one transfer asset')
  const unsupportedAssets = [...assets].filter(asset => !DEFAULT_TRANSFER_ASSETS.has(asset))
  if (unsupportedAssets.length > 0) {
    throw new InvalidPreferencesError(`Bybit: unsupported transfer asset(s): ${unsupportedAssets.join(', ')}. Only USDT, USDC, FDUSD, TUSD and USD can be imported as nominal USD wallet movements.`)
  }
  return assets
}

/**
 * Bybit sells crypto for fiat when a card purchase is authorized and keeps a
 * markup between that rate and the wallet's nominal USD valuation. No Card API
 * field reports it: `totalFees` covers only the fiat-side fees (foreign
 * transaction, interchange, tax), while the conversion markup is visible solely
 * in the mobile app's "Crypto used" record. The user therefore supplies it, so
 * that card spending debits what the wallet actually loses.
 */
export function parseCardConversionFeePercent (raw?: string): number {
  const trimmed = raw?.trim()
  if (trimmed == null || trimmed === '') {
    return 0
  }
  // Number() would also accept '0x10', '1e1' and '1,000', turning a typo into a
  // markup on every card purchase. Only plain decimals are a percentage.
  const value = /^\d+([.,]\d+)?$/.test(trimmed) ? Number(trimmed.replace(',', '.')) : NaN
  if (!Number.isFinite(value) || value < 0 || value >= 100) {
    throw new InvalidPreferencesError('Bybit: crypto-to-fiat conversion fee must be a percentage between 0 and 100')
  }
  return value
}

// Mapping of /v5/card/transaction/query-asset-records `side` codes to a sign for the amount.
// The docs list 13 sides; we only emit transactions for unambiguous debits/credits.
// Anything else (authorization reversals, refund-requests, refund reversals, etc.) is
// suppressed because it is either redundant (gets superseded by a cleared entry) or
// cancels an earlier entry, which ZenMoney handles better by simply not importing.
const SIDE_SIGN: Readonly<Record<string, 1 | -1>> = {
  1: -1, // Authorization (hold)
  3: -1, // Transaction (cleared purchase)
  5: 1, //  Refund (settled credit)
  6: 1, //  Chargeback (credit via dispute)
  7: -1, // Transaction (Direct)
  12: -1, // Chargeback Fee
  13: -1 // ATM Withdrawal
}

// Returned by /v5/card/transaction/query-asset-records `tradeStatus`:
// 0 In_Progress, 1 Completed, 2 Declined, 3 Reversal.
const SKIPPED_TRADE_STATUSES: ReadonlySet<string> = new Set(['2', '3'])

export function createUnifiedAccount (wallet: UnifiedWallet): AccountOrCard {
  return {
    id: BYBIT_UNIFIED_ACCOUNT_ID,
    type: AccountType.checking,
    title: 'Bybit Unified',
    instrument: 'USD',
    balance: wallet.totalEquity,
    syncIds: [BYBIT_UNIFIED_ACCOUNT_ID]
  }
}

export function createFundingAccount (
  balances: CoinBalance[],
  convertUsdtValues: Map<string, number>
): AccountOrCard {
  let balance = 0
  for (const item of balances) {
    const coin = item.coin.toUpperCase()
    // Funding's wallet balance is the asset owned in the wallet. `transferBalance`
    // is merely the currently transferable amount and becomes zero when Bybit reserves
    // a coin for Card spending, although the asset still belongs to the user.
    balance += coin === 'USD' ? item.walletBalance : (convertUsdtValues.get(coin) ?? 0)
  }
  return {
    id: BYBIT_FUNDING_ACCOUNT_ID,
    type: AccountType.checking,
    title: 'Bybit Funding',
    instrument: 'USD',
    balance,
    syncIds: [BYBIT_FUNDING_ACCOUNT_ID]
  }
}

export function createFlexibleEarnAccount (
  positions: FlexibleEarnPosition[],
  usdtPrices: Map<string, number>
): AccountOrCard {
  const balance = positions.reduce((sum, position) => {
    const price = usdtPrices.get(position.coin.toUpperCase())
    if (price == null || !Number.isFinite(price) || price <= 0) {
      throw new Error(`Bybit Flexible Earn asset has no USDT valuation: ${position.coin}`)
    }
    return sum + position.amount * price
  }, 0)
  return {
    id: BYBIT_FLEXIBLE_EARN_ACCOUNT_ID,
    type: AccountType.investment,
    title: 'Bybit Flexible Earn',
    instrument: 'USD',
    balance,
    savings: true,
    syncIds: [BYBIT_FLEXIBLE_EARN_ACCOUNT_ID]
  }
}

/**
 * Bybit exposes the Card as a product, not a wallet with a separately
 * reconcilable balance.  Card purchases must therefore debit the wallet the
 * user selected in Bybit's payment settings. The Card API does not return
 * that setting, so the plugin must use the explicit user choice.
 */
export function selectCardSettlementAccount (
  source: 'auto' | 'earn' | 'funding' | undefined,
  fundingAccount: AccountOrCard,
  flexibleEarnAccount: AccountOrCard
): AccountOrCard {
  if (source === 'earn') return flexibleEarnAccount
  if (source === 'funding') return fundingAccount
  throw new InvalidPreferencesError('Bybit: choose the Bybit Card payment source: Flexible Earn or Funding. The API does not disclose this setting.')
}

/**
 * An open authorization is imported as a hold and subtracted from the balance.
 * Both have to act on exactly the same set: importing one that is not
 * subtracted, or subtracting one that is not imported, is the very drift this
 * plugin is correcting. Hence one predicate, used by both.
 */
export function isOpenCardAuthorization (entry: CardTransaction): boolean {
  return entry.tradeStatus === '0' && SIDE_SIGN[entry.side] === -1
}

export function selectCardTransactionsForImport (
  financialEntries: CardTransaction[],
  authorizationEntries: CardTransaction[]
): CardTransaction[] {
  return [
    ...financialEntries,
    ...authorizationEntries.filter(isOpenCardAuthorization)
  ]
}

/**
 * Authorizing a card purchase does not yet move money out of Bybit: the coin is
 * sold and the proceeds are parked in the Funding wallet as a fiat balance with
 * `transferBalance` zero, until the merchant clears the purchase, which was
 * observed to take about a day and a half. That parked fiat is part of the reported wallet balance while the very
 * same purchase is already imported as a hold, so it would be counted twice.
 *
 * The deduction is applied to Funding whichever wallet settles the card: the
 * fiat pocket was observed there on a Funding-settled account, and that is
 * where the card settles. An Auto-Deduction account paying from Flexible Earn
 * was not available to verify, so if Bybit instead froze the Earn position, the
 * correction would land on the wrong account.
 */
export function sumPendingCardHolds (authorizationEntries: CardTransaction[]): number {
  return authorizationEntries
    .filter(isOpenCardAuthorization)
    .reduce((sum, entry) => sum + Math.abs(entry.basicAmount), 0)
}

export function withPendingCardHoldsDeducted (account: AccountOrCard, pendingHoldTotal: number): AccountOrCard {
  // A null balance means the plugin could not determine it; turning that into a
  // negative number would be worse than leaving it unknown.
  if (pendingHoldTotal === 0 || account.balance == null) {
    return account
  }
  return { ...account, balance: account.balance - pendingHoldTotal }
}

function walletAccountId (accountType: string): string | null {
  if (accountType === 'FUND') return BYBIT_FUNDING_ACCOUNT_ID
  if (accountType === 'UNIFIED') return BYBIT_UNIFIED_ACCOUNT_ID
  return null
}

export function convertExternalTransfers (
  transfers: ExternalTransfer[],
  target: 'funding' | 'unified',
  assets: Set<string>
): Transaction[] {
  const accountId = target === 'unified' ? BYBIT_UNIFIED_ACCOUNT_ID : BYBIT_FUNDING_ACCOUNT_ID
  return transfers.filter(item => assets.has(item.coin) && !Number.isNaN(item.date.getTime())).map(item => {
    const sign = item.direction === 'deposit' ? 1 : -1
    const network = item.network == null ? '' : `; network ${item.network}`
    return {
      hold: false,
      date: item.date,
      movements: [{
        id: `bybit_external_${item.direction}_${item.id}`,
        account: { id: accountId },
        invoice: null,
        sum: sign * item.amount,
        fee: item.direction === 'withdrawal' ? -Math.abs(item.fee) : 0
      }],
      merchant: null,
      comment: `Bybit external ${item.direction}: ${item.coin}${network}`
    }
  })
}

export function convertInternalTransfers (transfers: InternalTransfer[], assets: Set<string>): Transaction[] {
  return transfers.flatMap(item => {
    const from = walletAccountId(item.fromAccountType)
    const to = walletAccountId(item.toAccountType)
    if (from == null || to == null || from === to || !assets.has(item.coin) || Number.isNaN(item.date.getTime())) return []
    return [{
      hold: false,
      date: item.date,
      movements: [
        { id: `bybit_internal_${item.id}_out`, account: { id: from }, invoice: null, sum: -item.amount, fee: 0 },
        { id: `bybit_internal_${item.id}_in`, account: { id: to }, invoice: null, sum: item.amount, fee: 0 }
      ],
      merchant: null,
      comment: `Bybit internal transfer: ${item.amount} ${item.coin}`
    }]
  })
}

export function convertEarnTransfers (
  transfers: EarnTransfer[],
  source: 'funding' | 'unified',
  assets: Set<string>
): Transaction[] {
  const sourceId = source === 'unified' ? BYBIT_UNIFIED_ACCOUNT_ID : BYBIT_FUNDING_ACCOUNT_ID
  return transfers.filter(item => assets.has(item.coin) && !Number.isNaN(item.date.getTime())).map(item => {
    const stake = item.type === 'Stake'
    return {
      hold: false,
      date: item.date,
      movements: [
        { id: `bybit_earn_${item.id}_source`, account: { id: sourceId }, invoice: null, sum: stake ? -item.amount : item.amount, fee: 0 },
        { id: `bybit_earn_${item.id}_earn`, account: { id: BYBIT_FLEXIBLE_EARN_ACCOUNT_ID }, invoice: null, sum: stake ? item.amount : -item.amount, fee: 0 }
      ],
      merchant: null,
      comment: `Bybit Flexible Earn ${item.type.toLowerCase()}: ${item.amount} ${item.coin}`
    }
  })
}

export function convertTransaction (
  entry: CardTransaction,
  account: AccountOrCard,
  conversionFeePercent = 0
): Transaction | null {
  if (SKIPPED_TRADE_STATUSES.has(entry.tradeStatus)) {
    return null
  }
  const sign = SIDE_SIGN[entry.side]
  if (sign === undefined) {
    return null
  }
  if (entry.basicAmount === 0 && entry.transactionAmount === 0) {
    return null
  }

  const accountCurrency = account.instrument.toUpperCase()
  const transactionCurrency = entry.paidCurrency.toUpperCase()
  const totalAmount = Math.abs(entry.basicAmount)
  const feeAmount = Math.min(totalAmount, Math.abs(entry.totalFees))
  // Only spending converts crypto to fiat. A refund returns fiat that Bybit
  // converts back at its own rate, which the API does not disclose either, so
  // no markup is invented for credits.
  const conversionFee = sign < 0 ? roundToCents(totalAmount * conversionFeePercent / 100) : 0
  // Round to the account's cents: binary floating point turns 7.77 - 0.15 into
  // 7.619999999999999, which ZenMoney would store verbatim.
  const totalFee = roundToCents(feeAmount + conversionFee)
  const sum = sign * roundToCents(totalAmount - feeAmount)
  const sameCurrency = transactionCurrency === accountCurrency || entry.paidAmount === 0
  const invoice = sameCurrency
    ? null
    : { sum: sign * Math.abs(entry.paidAmount), instrument: transactionCurrency }

  const hold = entry.tradeStatus === '0' || entry.side === '1'

  const merchant = buildMerchant(entry)

  return {
    hold,
    date: new Date(Number(entry.txnCreate)),
    movements: [{
      id: entry.txnId,
      account: { id: account.id },
      invoice,
      sum,
      fee: totalFee === 0 ? 0 : sign * totalFee
    }],
    merchant,
    comment: buildComment(entry)
  }
}

function roundToCents (value: number): number {
  return Math.round(value * 100) / 100
}

function buildComment (entry: CardTransaction): string | null {
  const details: string[] = []
  const place = [entry.merchCity?.trim(), entry.merchCountry?.trim()].filter(Boolean).join(', ')

  if (place !== '') {
    details.push(`Place: ${place}`)
  }

  return details.length === 0 ? null : details.join('; ')
}

function buildMerchant (entry: CardTransaction): Merchant | null {
  const title = entry.merchName ?? entry.merchCategoryDesc
  if (title == null && entry.merchCity == null && entry.merchCountry == null && entry.mccCode == null) {
    return null
  }
  return {
    title: title ?? 'Bybit Card',
    country: entry.merchCountry,
    city: entry.merchCity,
    mcc: entry.mccCode,
    location: null
  }
}
