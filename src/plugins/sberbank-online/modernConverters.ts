import get, { getOptString } from '../../types/get'
import { AccountOrCard, AccountType, Transaction, Movement } from '../../types/zenmoney'
import { array, object, string, JsonObject } from './modernValidation'

// Verified scope: current/card accounts, accumulative/shared savings, metals,
// and an active digital-ruble wallet. No loan/term-deposit DTO was available.
// Non-zero commission inclusion and cross-currency transfers require real source
// examples; these cases fail visibly rather than producing guessed movements.
export interface AccountGraph { accounts: AccountOrCard[], byBankId: Map<string, AccountOrCard> }

function identifier (value: unknown): string {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
  return string(value, 'bank identifier')
}

function amount (value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value.replace(',', '.')) : NaN
  if (!Number.isFinite(n)) throw new Error('Invalid bank monetary amount')
  return n
}

function currency (value: unknown): string {
  const code = string(value, 'bank currency')
  // Official CurrencyCoreLib maps these metal codes to ISO 959/961/962/964.
  const metals: Record<string, string> = { AUR: 'XAU', ARG: 'XAG', PTR: 'XPT', PDR: 'XPD' }
  return metals[code] ?? code
}

export function parseBankDate (value: unknown): Date {
  const v = string(value, 'bank operation date')
  const match = v.match(/^(\d{2})\.(\d{2})\.(\d{4})T(\d{2}):(\d{2}):(\d{2})$/)
  if (match == null) throw new Error('Unexpected bank operation date format')
  const [, day, month, year, hour, minute, second] = match
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid bank operation date')
  return date
}

export function convertModernAccounts (model: JsonObject): AccountGraph {
  const byBankId = new Map<string, AccountOrCard>()
  for (const group of ['ACCOUNTS', 'SHARINGACCOUNTS', 'CTACCOUNTS', 'SHARINGCTACCOUNTS', 'IMACCOUNTS', 'ACCOUNTS_IN_WALLET']) {
    const block = model[group]
    if (block == null) continue
    if (get(block, 'state') !== 'SUCCESS' || array(get(block, 'errors'), 'account group errors').length !== 0) throw new Error(`Incomplete account group: ${group}`)
    for (const item of array(get(block, 'data'), 'account group data')) {
      const raw = object(item, 'bank account')
      const id = identifier(raw.id)
      const instrument = currency(get(raw, 'balance.currency.code'))
      const isCard = group.includes('CTACCOUNT')
      const balance = isCard && raw.availableTotalLimit != null
        ? amount(get(raw, 'availableTotalLimit.amount')) - amount(get(raw, 'creditLimit.amount'))
        : amount(get(raw, raw.availCash != null ? 'availCash.amount' : 'balance.amount'))
      const existing = byBankId.get(id)
      if (existing != null) {
        if (existing.instrument !== instrument || existing.balance !== balance) throw new Error('Conflicting account representations')
        continue
      }
      const state = string(raw.state, 'account state').toLowerCase()
      if (!['opened', 'active', 'closed'].includes(state)) throw new Error('Unknown bank account state')
      if (raw.accountType != null && raw.accountType !== 'AccumulativeAccount') throw new Error('Unsupported bank deposit contract')
      const account: AccountOrCard = {
        id: `sber:${id}`,
        type: isCard ? AccountType.ccard : AccountType.checking,
        title: string(raw.name, 'account title'),
        instrument,
        syncIds: [string(raw.number, 'account number')],
        balance,
        archived: state === 'closed',
        ...(raw.accountType === 'AccumulativeAccount' ? { savings: true } : {})
      }
      if (isCard) {
        account.creditLimit = amount(get(raw, 'creditLimit.amount'))
        account.available = amount(get(raw, 'availableTotalLimit.amount'))
      }
      byBankId.set(id, account)
    }
  }
  if (model.DIGITALRUBLE != null) {
    const block = model.DIGITALRUBLE
    if (get(block, 'state') !== 'SUCCESS' || array(get(block, 'errors'), 'digital account errors').length !== 0) throw new Error('Incomplete digital ruble account')
    for (const raw of array(get(block, 'data'), 'digital ruble accounts')) {
      const number = getOptString(raw, 'digitalRubleAccountNumber')
      if ((number == null || number === '') && get(raw, 'walletStatus.code') !== 'ACTIVE') continue
      if (get(raw, 'walletStatus.code') !== 'ACTIVE') throw new Error('Unknown digital ruble account state')
      const id = `digital:${string(number, 'digital account number')}`
      byBankId.set(id, {
        id: `sber:${id}`,
        type: AccountType.checking,
        title: 'Цифровой рубль',
        instrument: 'RUB',
        syncIds: [string(number, 'digital account number')],
        balance: amount(get(raw, 'balance.totalAmount')) - amount(get(raw, 'balance.totalBlockedAmount')),
        archived: false
      })
    }
  }
  const accounts = [...byBankId.values()]
  if (accounts.length === 0) throw new Error('Bank returned no accounts')
  if (new Set(accounts.map(a => a.syncIds[0])).size !== accounts.length) throw new Error('Ambiguous bank account numbers')
  return { accounts, byBankId }
}

function resourceAccount (value: unknown, graph: AccountGraph): AccountOrCard | undefined {
  const id = getOptString(value, 'id')
  return id == null ? undefined : graph.byBankId.get(id.replace(/^[^:]+:/, ''))
}

export function convertModernTransactions (
  records: unknown[], graph: AccountGraph, fromDate: Date, toDate?: Date | null,
  isSkipped: (id: string) => boolean = () => false
): Transaction[] {
  const transactions: Transaction[] = []
  const seen = new Set<string>()
  for (const record of records) {
    const raw = object(record, 'history operation')
    if (raw.isFinancial === false) continue
    if (raw.isFinancial !== true) throw new Error('Unknown financial operation flag')
    const category = get(raw, 'state.category')
    if (category === 'cancel') continue
    if (category !== 'executed') throw new Error('Unknown financial operation category')
    const state = get(raw, 'state.name')
    if (!['AUTHORIZATION', 'FINANCIAL', 'EXECUTED'].includes(String(state))) throw new Error('Unknown financial operation state')
    const date = parseBankDate(raw.date)
    if (date < fromDate || (toDate != null && date > toDate)) continue
    const id = string(raw.uohId, 'unified operation ID')
    if (seen.has(id)) throw new Error('Duplicate unified operation ID')
    seen.add(id)
    const billing = object(raw.billingAmount, 'account operation amount')
    const account = graph.byBankId.get(identifier(billing.id))
    if (account == null) throw new Error('History references an undiscovered account')
    const source = resourceAccount(raw.fromResource, graph)
    const destination = resourceAccount(raw.toResource, graph)
    const internal = source != null && destination != null && source.id !== destination.id
    if (internal ? isSkipped(source.id) && isSkipped(destination.id) : isSkipped(account.id)) continue
    const signed = amount(get(raw, 'operationAmount.amount'))
    const billingCurrency = currency(billing.currencyCode)
    if (billingCurrency !== account.instrument) throw new Error('Billing currency differs from account currency')
    const fee = raw.commission == null ? 0 : amount(get(raw, 'commission.amount'))
    if (fee !== 0) throw new Error('Non-zero bank commission needs verified inclusion semantics')
    const operationCurrency = currency(get(raw, 'operationAmount.currencyCode'))
    // billingAmount.amount is not the posted movement amount (including real zero values).
    const sum = operationCurrency === account.instrument ? signed : null
    const invoice = operationCurrency === account.instrument ? null : { sum: signed, instrument: operationCurrency }
    let movements: Transaction['movements']
    if (internal) {
      if (source.instrument !== destination.instrument || invoice != null || sum == null) throw new Error('Cross-currency transfer needs both posted account amounts')
      const base = Math.abs(signed)
      movements = [
        { id: `${id}:out`, account: { id: source.id }, sum: -base, invoice: null, fee: 0 },
        { id: `${id}:in`, account: { id: destination.id }, sum: base, invoice: null, fee: 0 }
      ]
    } else {
      const movement: Movement = { id, account: { id: account.id }, sum, invoice, fee: 0 }
      if (raw.form === 'ExtCardCashIn') {
        if (sum == null) throw new Error('Cash operation needs a confirmed account amount')
        movements = [movement, { id: null, account: { type: AccountType.cash, instrument: account.instrument, company: null, syncIds: null }, sum: -sum, invoice: null, fee: 0 }]
      } else movements = [movement]
    }
    const title = getOptString(raw, 'correspondent')?.replace(/\s+/g, ' ').trim()
    const description = getOptString(raw, 'description')?.replace(/\s+/g, ' ').trim()
    const mcc = typeof raw.classificationCode === 'number' && raw.classificationCode >= 1000 && raw.classificationCode <= 9999 ? raw.classificationCode : null
    transactions.push({
      date,
      hold: state === 'AUTHORIZATION',
      movements,
      merchant: internal || title == null || title === '' ? null : { title, city: null, country: null, mcc, location: null },
      comment: description != null && description !== '' && description !== title ? description : null
    })
  }
  return transactions
}
