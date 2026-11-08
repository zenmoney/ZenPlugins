import get, { getOptArray, getOptString } from '../../types/get'
import { Account, AccountOrCard, AccountType, Merchant, Movement, Transaction } from '../../types/zenmoney'
import { QPayAccountPlan } from './models'

export interface QPayAccountGraph {
  wallet: unknown
  cards: Array<{ card: unknown, balance: unknown }>
}

export interface QPayHistory {
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
  // Wallets have no independent history source; card records can describe funding.
  const plans: QPayAccountPlan[] = wallets.length === 0 ? [] : [{ accounts: wallets, fetchParams: null }]
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

export function normalizeCardMovement (movement: Movement): Movement | null {
  if (movement.sum !== 0) return movement
  if (movement.fee === 0) return null
  // A standalone commission is the expense itself; the app rejects a zero principal.
  return { ...movement, sum: movement.fee, fee: 0 }
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
    // Top-up fee fields do not reduce the card's credited amount.
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

function linkWalletFunding (source: unknown, converted: Transaction, accounts: Map<string, Account>): Transaction {
  const credit = converted.movements[0]
  if (getOptString(source, 'type')?.toLowerCase() !== 'topup' ||
    getOptString(source, 'status') !== 'settled' ||
    optionalString(source, 'funded_by') != null || credit.sum == null || credit.sum <= 0) return converted
  const asset = optionalString(source, 'wallet_asset')
  const amount = optionalNumber(source, 'amount_in_wallet')
  if (asset == null || amount == null) return converted
  if (amount <= 0) throw new Error('Q-Pay card funding has a nonpositive wallet amount')
  const wallet = accountFor(accounts, walletId(asset))
  // Both native account effects are explicit; do not infer an FX rate or another fee.
  // The wallet-side ID is derived from the card record, not an independent ledger ID.
  return {
    ...converted,
    movements: [{
      id: `q-pay:card-tx:${requiredString(source, 'id')}:wallet`,
      account: { id: wallet.id },
      sum: -amount,
      fee: 0,
      invoice: null
    }, credit],
    merchant: null
  }
}

/** Import card history, including wallet funding explicitly confirmed by a top-up. */
export function convertTransactions (graph: QPayAccountGraph, history: QPayHistory): Transaction[] {
  const accounts = accountMap(graph)
  const ownedCards = new Set(graph.cards.filter(({ card }) => getOptString(card, 'access') === 'owner')
    .map(({ card }) => requiredString(card, 'id')))
  const result: Transaction[] = []
  for (const group of history.cards) {
    for (const source of group.transactions) {
      const converted = cardTransaction(source, group.cardId, accounts)
      if (converted == null) continue
      const movement = normalizeCardMovement(converted.movements[0])
      if (movement == null) continue
      converted.movements[0] = movement
      result.push(ownedCards.has(group.cardId) ? linkWalletFunding(source, converted, accounts) : converted)
    }
  }
  return result.sort((left, right) => left.date.getTime() - right.date.getTime())
}
