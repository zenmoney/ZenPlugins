import get, { getOptArray, getOptString } from '../../types/get'
import { Account, AccountOrCard, AccountType, Merchant, Movement, Transaction } from '../../types/zenmoney'
import { QPayAccountPlan } from './models'

export interface QPayAccountGraph {
  wallet: unknown
  cards: Array<{ card: unknown, balance: unknown }>
}

export interface QPayHistory {
  operations: Array<{ operation: unknown, detail: unknown }>
  cards: Array<{ cardId: string, transactions: unknown[] }>
}

const ASSET_INSTRUMENTS: Record<string, string> = {
  USDT: 'USDT',
  USDC: 'USD',
  USDR: 'USD',
  AUSDT: 'USD',
  USDQ: 'USD',
  EURR: 'EUR',
  EURQ: 'EUR',
  XAUT: 'XAU'
}

export function normalizeInstrument (asset: string): string {
  const normalized = asset.trim().toUpperCase()
  return ASSET_INSTRUMENTS[normalized] ?? normalized
}

function requiredString (value: unknown, field: string): string {
  const result = getOptString(value, field)
  if (result == null || result.trim() === '') throw new Error(`Q-Pay requires a nonempty ${field}`)
  return result.trim()
}

function optionalString (value: unknown, field: string): string | null {
  const result = getOptString(value, field)?.trim()
  return result == null || result === '' ? null : result
}

function numberValue (value: unknown, field: string): number {
  const raw = get(value, field)
  if ((typeof raw !== 'string' && typeof raw !== 'number') || (typeof raw === 'string' && raw.trim() === '')) {
    throw new Error(`Q-Pay requires a numeric ${field}`)
  }
  const result = Number(raw)
  if (!Number.isFinite(result)) throw new Error(`Q-Pay has an invalid ${field}`)
  return result
}

function optionalNumber (value: unknown, field: string): number | null {
  return get(value, field) == null ? null : numberValue(value, field)
}

function arrayValue (value: unknown, field: string): unknown[] {
  const result = getOptArray(value, field)
  if (result == null) throw new Error(`Q-Pay requires an array ${field}`)
  return result
}

function dateValue (value: unknown, field: string): Date {
  const date = new Date(requiredString(value, field))
  if (!Number.isFinite(date.getTime())) throw new Error(`Q-Pay has an invalid ${field}`)
  return date
}

function walletId (asset: string): string {
  return `q-pay:wallet:${asset}`
}

function cardId (id: string): string {
  return `q-pay:card:${id}`
}

/** One asset balance covers all its deposit networks; network rows are not accounts. */
export function convertAccounts (graph: QPayAccountGraph): QPayAccountPlan[] {
  const wallets: Account[] = []
  const ids = new Set<string>()
  for (const asset of arrayValue(graph.wallet, 'assets')) {
    const key = requiredString(asset, 'asset')
    const balance = optionalNumber(asset, 'available') ?? numberValue(asset, 'amount')
    if (key === 'CASHBACK' && getOptString(asset, 'type') === 'bonus') {
      // The observed zero reward counter has no monetary denomination or wallet rail.
      if (balance !== 0 || numberValue(asset, 'balance') !== 0 || numberValue(asset, 'amount') !== 0) {
        throw new Error('Q-Pay has an unsupported nonzero cashback reward balance')
      }
      continue
    }
    const id = walletId(key)
    if (ids.has(id)) throw new Error('Q-Pay returned a duplicate wallet asset')
    ids.add(id)
    wallets.push({
      id,
      type: AccountType.checking,
      title: `Q-Pay ${optionalString(asset, 'symbol') ?? key}`,
      instrument: normalizeInstrument(optionalString(asset, 'symbol') ?? key),
      balance,
      syncIds: [id],
      savings: false
    })
  }
  const plans: QPayAccountPlan[] = wallets.length === 0 ? [] : [{ accounts: wallets, fetchParams: { kind: 'wallet' } }]
  for (const { card, balance } of graph.cards) {
    const sourceId = requiredString(card, 'id')
    const id = cardId(sourceId)
    if (ids.has(id)) throw new Error('Q-Pay returned a duplicate card')
    ids.add(id)
    const status = requiredString(card, 'status')
    if (!['issuing', 'inactive', 'active', 'frozen', 'blocked', 'closed', 'failed', 'maintenance'].includes(status)) {
      throw new Error('Q-Pay returned an unknown card lifecycle state')
    }
    const currency = optionalString(balance, 'currency') ?? requiredString(card, 'currency')
    const available = optionalNumber(balance, 'available')
    const account: AccountOrCard = {
      id,
      type: AccountType.ccard,
      title: requiredString(card, 'display_name'),
      instrument: normalizeInstrument(currency),
      balance: available,
      available,
      syncIds: [id, sourceId],
      savings: false,
      ...(status === 'closed' || optionalString(card, 'archive.reason') != null ? { archived: true } : {})
    }
    plans.push({ account, fetchParams: { kind: 'card', cardId: sourceId } })
  }
  return plans
}

function accountMap (graph: QPayAccountGraph): Map<string, Account> {
  return new Map(convertAccounts(graph).flatMap(plan => 'accounts' in plan ? plan.accounts : [plan.account]).map(account => [account.id, account]))
}

function accountFor (accounts: Map<string, Account>, id: string): Account {
  const account = accounts.get(id)
  if (account == null) throw new Error('Q-Pay operation does not identify a fetched account')
  return account
}

function holdValue (status: string): boolean {
  if (status === 'success' || status === 'settled') return false
  if (status === 'pending' || status === 'authorized') return true
  throw new Error('Q-Pay operation has an unsupported financial status')
}

function amountEqual (left: number, right: number): boolean {
  return Math.abs(left - right) <= 1e-8
}

function ledgerAmount (operation: unknown): number {
  // amount is rounded for the feed; the exact native asset value is also supplied.
  return Math.abs(optionalNumber(operation, 'amount_exact') ?? numberValue(operation, 'amount.amount'))
}

function ledgerComment (operation: unknown, detail: unknown): string | null {
  const message = optionalString(detail, 'details.message')
  if (message != null) return message
  return ['crypto_deposit', 'card_recharge', 'card_topup'].includes(requiredString(operation, 'kind'))
    ? null
    : optionalString(operation, 'title')
}

function ledgerTransaction (operation: unknown, detail: unknown, accounts: Map<string, Account>): Transaction {
  const asset = requiredString(operation, 'asset')
  const account = accountFor(accounts, walletId(asset))
  const direction = requiredString(operation, 'direction')
  if (direction !== 'debit' && direction !== 'credit') throw new Error('Q-Pay operation has an unknown direction')
  const sign = direction === 'credit' ? 1 : -1
  const currency = normalizeInstrument(requiredString(operation, 'amount.currency'))
  if (currency !== account.instrument) throw new Error('Q-Pay ledger amount is not in its wallet currency')
  const rawFee = get(detail, 'fee_total') ?? get(detail, 'fee')
  const feeAmount = optionalNumber(rawFee, 'amount') ?? optionalNumber(detail, 'fee_details.fee_total') ?? 0
  // A nonzero ledger fee needs a captured gross/net contract before splitting it.
  if (feeAmount !== 0) throw new Error('Q-Pay ledger fee accounting requires additional source evidence')
  return {
    hold: holdValue(requiredString(operation, 'status')),
    date: dateValue(operation, 'occurred_at'),
    movements: [{
      id: `q-pay:wallet-tx:${requiredString(operation, 'id')}`,
      account: { id: account.id },
      sum: sign * ledgerAmount(operation),
      fee: 0,
      invoice: null
    }],
    merchant: null,
    comment: ledgerComment(operation, detail)
  }
}

const CARD_CREDITS = new Set(['topup', 'load', 'refund', 'reversal', 'chargeback', 'credit', 'deposit', 'card_recharge', 'card_topup'])
const CARD_DEBITS = new Set(['purchase', 'atm_withdrawal', 'withdrawal', 'fee', 'card_withdrawal'])

function cardSign (transaction: unknown): 1 | -1 {
  const type = requiredString(transaction, 'type').toLowerCase()
  if (CARD_CREDITS.has(type)) return 1
  if (CARD_DEBITS.has(type)) return -1
  throw new Error('Q-Pay card operation has an unknown financial type')
}

function cardMerchant (transaction: unknown): Merchant | null {
  const title = optionalString(transaction, 'merchant_name')
  if (title == null) return null
  const mcc = optionalNumber(transaction, 'mcc_code')
  return {
    title,
    mcc,
    city: optionalString(transaction, 'merchant_city'),
    country: optionalString(transaction, 'merchant_country'),
    location: null,
    ...(mcc == null && optionalString(transaction, 'merchant_category') != null
      ? { category: requiredString(transaction, 'merchant_category') }
      : {})
  }
}

function cardTransaction (transaction: unknown, sourceCardId: string, accounts: Map<string, Account>): Transaction | null {
  const account = accountFor(accounts, cardId(sourceCardId))
  const sign = cardSign(transaction)
  const status = requiredString(transaction, 'status')
  const total = optionalNumber(transaction, 'total_debited')
  const fees = getOptArray(transaction, 'debit_fees') ?? []
  const debitFee = fees.reduce<number>((sum, fee) => sum + Math.abs(numberValue(fee, 'amount')), 0)
  const rawAmount = Math.abs(numberValue(transaction, 'amount'))
  const currency = normalizeInstrument(requiredString(transaction, 'currency'))
  const totalCurrency = optionalString(transaction, 'total_debited_currency')
  const accountTotal = total != null && totalCurrency != null && normalizeInstrument(totalCurrency) === account.instrument ? Math.abs(total) : null
  const rejected = status === 'declined' || status === 'reversed'
  let principal: number | null
  let fee = 0
  if (rejected) {
    if (accountTotal === 0 && debitFee === 0) return null
    if (accountTotal == null || !amountEqual(accountTotal, debitFee)) {
      throw new Error('Q-Pay rejected card operation has an unresolved charged amount')
    }
    principal = 0
    fee = debitFee === 0 ? 0 : -debitFee
  } else if (sign < 0 && accountTotal != null) {
    principal = optionalNumber(transaction, 'debit_principal')
    if (principal == null) principal = accountTotal - debitFee
    if (principal < 0 || !amountEqual(principal + debitFee, accountTotal)) {
      throw new Error('Q-Pay card principal and fees do not reconcile with the debit total')
    }
    fee = debitFee === 0 ? 0 : -debitFee
  } else {
    const billingCurrency = optionalString(transaction, 'billing_currency')
    const billing = optionalNumber(transaction, 'billing_amount')
    principal = billing != null && billingCurrency != null && normalizeInstrument(billingCurrency) === account.instrument
      ? Math.abs(billing)
      : currency === account.instrument ? rawAmount : null
    // Legacy top-up fees are charged to the funding wallet, not the card credit.
    if (sign < 0 && debitFee !== 0) throw new Error('Q-Pay card fees have no confirmed account-currency total')
  }
  const movement: Movement = {
    id: `q-pay:card-tx:${requiredString(transaction, 'id')}`,
    account: { id: account.id },
    sum: principal == null ? null : principal === 0 ? 0 : sign * principal,
    fee,
    invoice: rejected || currency === account.instrument ? null : { sum: sign * rawAmount, instrument: currency }
  }
  if (movement.sum == null && movement.invoice == null) throw new Error('Q-Pay card operation has no account or invoice amount')
  return {
    hold: rejected ? false : holdValue(status),
    date: optionalString(transaction, 'authorized_at') != null
      ? dateValue(transaction, 'authorized_at')
      : dateValue(transaction, 'settled_at'),
    movements: [movement],
    merchant: cardMerchant(transaction),
    comment: null
  }
}

interface CardEntry {
  cardId: string
  source: unknown
  converted: Transaction
}

function fundingMatch (operation: unknown, entries: CardEntry[], used: Set<CardEntry>): CardEntry | null {
  if (!['card_recharge', 'card_topup'].includes(requiredString(operation, 'kind'))) return null
  const target = optionalString(operation, 'card_id')
  if (target == null) return null
  const date = dateValue(operation, 'occurred_at').getTime()
  const amount = ledgerAmount(operation)
  const asset = requiredString(operation, 'asset')
  const candidates = entries.filter(entry => !used.has(entry) && entry.cardId === target &&
    ['topup', 'load', 'deposit'].includes(requiredString(entry.source, 'type').toLowerCase()) &&
    optionalString(entry.source, 'wallet_asset') === asset &&
    amountEqual(optionalNumber(entry.source, 'amount_in_wallet') ?? NaN, amount) &&
    entry.converted.hold === holdValue(requiredString(operation, 'status')) &&
    Math.abs(entry.converted.date.getTime() - date) <= 10 * 60 * 1000)
  candidates.sort((left, right) => Math.abs(left.converted.date.getTime() - date) - Math.abs(right.converted.date.getTime() - date))
  return candidates[0] ?? null
}

/** Reconcile actual wallet debits and card credits without inventing a missing side. */
export function convertTransactions (graph: QPayAccountGraph, history: QPayHistory): Transaction[] {
  const accounts = accountMap(graph)
  const entries: CardEntry[] = []
  for (const group of history.cards) {
    for (const source of group.transactions) {
      const converted = cardTransaction(source, group.cardId, accounts)
      if (converted != null) entries.push({ cardId: group.cardId, source, converted })
    }
  }
  const result: Transaction[] = []
  const used = new Set<CardEntry>()
  for (const { operation, detail } of history.operations) {
    const converted = ledgerTransaction(operation, detail, accounts)
    const match = fundingMatch(operation, entries, used)
    if (match != null && converted.movements[0].sum != null && converted.movements[0].sum < 0) {
      used.add(match)
      result.push({
        ...converted,
        movements: [converted.movements[0], match.converted.movements[0]],
        merchant: null,
        comment: optionalString(detail, 'details.message')
      })
    } else result.push(converted)
  }
  result.push(...entries.filter(entry => !used.has(entry)).map(entry => entry.converted))
  return result.sort((left, right) => left.date.getTime() - right.date.getTime())
}
