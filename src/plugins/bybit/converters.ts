import { InvalidPreferencesError } from '../../errors'
import { AccountOrCard, AccountType, Merchant, Transaction } from '../../types/zenmoney'
import { CardTransaction, CoinBalance, FlexibleEarnPosition } from './models'

/** Stable id of the single USD Bybit Card account. */
export const BYBIT_CARD_AGGREGATE_ACCOUNT_ID = 'bybit_card'

const AGGREGATE_COINS_SUPPORTED: ReadonlySet<string> = new Set(['USDT', 'USDC'])

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

export function parseCardBalanceCoinsList (raw: string): Set<string> {
  const coins = new Set<string>()
  for (const part of raw.split(',')) {
    const coin = part.trim().toUpperCase()
    if (coin === '' || coins.has(coin)) {
      continue
    }

    if (!AGGREGATE_COINS_SUPPORTED.has(coin)) {
      throw new InvalidPreferencesError(
        `Bybit: aggregate card account supports only USDT and USDC in the coin list (got ${coin}).`
      )
    }
    coins.add(coin)
  }
  return coins
}

export function createAggregatedAccount (
  balances: CoinBalance[],
  cardBalanceCoins: Set<string>,
  convertUsdtValues: Map<string, number>,
  flexibleEarnPositions: FlexibleEarnPosition[] = []
): AccountOrCard {
  // USD fiat in Funding is taken 1:1 (it has no entry in the Convert coin list).
  // Every other allowed coin uses Bybit's own "one-click" USDT-worth value (`uBalance`)
  // so the aggregated balance matches what the Bybit Card UI displays.
  let usdSum = 0
  for (const b of balances) {
    const coin = b.coin.toUpperCase()
    if (!cardBalanceCoins.has(coin)) {
      continue
    }
    if (coin === 'USD') {
      usdSum += b.transferBalance
    } else {
      usdSum += convertUsdtValues.get(coin) ?? 0
    }
  }
  // With Bybit Card Auto-Earn and Auto-Deduction enabled, the redeemable part of
  // Flexible Earn is part of the card's spending power even though Funding is 0.
  // USDT/USDC are the only supported aggregate coins and are represented 1:1 in
  // this USD account, matching the existing card-balance model.
  for (const position of flexibleEarnPositions) {
    if (cardBalanceCoins.has(position.coin.toUpperCase())) {
      usdSum += position.availableAmount
    }
  }
  return {
    id: BYBIT_CARD_AGGREGATE_ACCOUNT_ID,
    type: AccountType.ccard,
    title: 'Bybit Card',
    instrument: 'USD',
    balance: usdSum,
    creditLimit: 0,
    syncIds: [BYBIT_CARD_AGGREGATE_ACCOUNT_ID]
  }
}

export function selectCardTransactionsForImport (
  financialEntries: CardTransaction[],
  authorizationEntries: CardTransaction[]
): CardTransaction[] {
  return [
    ...financialEntries,
    ...authorizationEntries.filter(entry => entry.tradeStatus === '0')
  ]
}

export function convertTransaction (
  entry: CardTransaction,
  account: AccountOrCard
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
  const sum = sign * (totalAmount - feeAmount)
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
      fee: feeAmount === 0 ? 0 : sign * feeAmount
    }],
    merchant,
    comment: buildComment(entry)
  }
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
