import get, { getOptString } from '../../types/get'
import { AccountOrCard, AccountType, Transaction, Movement } from '../../types/zenmoney'
import { array, object, string, JsonObject } from './modernValidation'

// Verified scope: current/card accounts, accumulative/shared savings, metals,
// and an active digital-ruble wallet. No loan/term-deposit DTO was available.
// Monetary interpretation is backed by the complete fee/FX source captures in tests.
export interface AccountGraph { accounts: AccountOrCard[], byBankId: Map<string, AccountOrCard>, maskedAccounts?: Array<[string, string]> }

function identifier (value: unknown): string {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
  return string(value, 'bank identifier')
}

function amount (value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value.replace(',', '.')) : NaN
  if (!Number.isFinite(n)) throw new Error('Invalid bank monetary amount')
  return n
}

export function currency (value: unknown): string {
  const code = string(value, 'bank currency')
  // Official CurrencyCoreLib maps these metal codes to ISO 959/961/962/964.
  // RUR occurs in real older fee and history records alongside RUB.
  const aliases: Record<string, string> = { AUR: 'XAU', ARG: 'XAG', PTR: 'XPT', PDR: 'XPD', RUR: 'RUB' }
  return aliases[code] ?? code
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
      if (isCard && raw.cards != null) {
        for (const card of array(raw.cards, 'account cards')) byBankId.set(identifier(get(card, 'id')), account)
      }
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
  const accounts = [...new Set(byBankId.values())]
  if (accounts.length === 0) throw new Error('Bank returned no accounts')
  if (new Set(accounts.map(a => a.syncIds[0])).size !== accounts.length) throw new Error('Ambiguous bank account numbers')
  return { accounts, byBankId }
}

function resourceAccount (value: unknown, graph: AccountGraph): AccountOrCard | undefined {
  const id = getOptString(value, 'id')
  return id == null ? undefined : graph.byBankId.get(id.replace(/^[^:]+:/, ''))
}

export function convertOperationAmounts (raw: JsonObject, instrument: string): Pick<Movement, 'sum' | 'invoice' | 'fee'> {
  const signed = amount(get(raw, 'operationAmount.amount'))
  const operationCurrency = currency(get(raw, 'operationAmount.currencyCode'))
  const commission = raw.commission == null ? 0 : amount(get(raw, 'commission.amount'))
  if (commission < 0) throw new Error('Unexpected negative bank commission')
  if (commission !== 0 && currency(get(raw, 'commission.currencyCode')) !== instrument) throw new Error('Commission needs a confirmed account-currency amount')
  // Real totals and adjacent posted balances confirm that operationAmount is
  // principal, including old nationalAmount values that omit the extra fee.
  // billingAmount.amount is a post-operation balance, never a movement amount.
  return {
    sum: operationCurrency === instrument ? signed : null,
    invoice: operationCurrency === instrument ? null : { sum: signed, instrument: operationCurrency },
    fee: commission === 0 ? 0 : -commission
  }
}

function needsTransferDetails (raw: JsonObject, graph: AccountGraph): boolean {
  if (amount(get(raw, 'operationAmount.amount')) === 0) return false
  if (raw.form === 'UfsDepositClose' && raw.toResource == null) return true
  if (raw.form === 'UfsDepositOpen' && getOptString(raw, 'billingAmount.id') == null) return true
  return isCurrencyTransfer(raw, graph)
}

function isCurrencyTransfer (raw: JsonObject, graph: AccountGraph): boolean {
  if (!['UfsTransferSelf', 'UfsDepositOpen', 'UfsDepositClose'].includes(String(raw.form)) || amount(get(raw, 'operationAmount.amount')) === 0) return false
  const source = resourceAccount(raw.fromResource, graph)
  const destination = resourceAccount(raw.toResource, graph)
  if (source == null && destination == null) return false
  const operationCurrency = currency(get(raw, 'operationAmount.currencyCode'))
  return (source != null && destination != null && source.instrument !== destination.instrument) ||
    [source, destination].some(account => account != null && account.instrument !== operationCurrency) ||
    currency(get(raw, 'billingAmount.currencyCode')) !== operationCurrency ||
    ((source == null || destination == null) && raw.nationalAmount != null && currency(get(raw, 'nationalAmount.currencyCode')) !== operationCurrency)
}

function detailAccount (detail: JsonObject | undefined, name: string, graph: AccountGraph, instrument: string): AccountOrCard | undefined {
  if (detail == null) return undefined
  const fields = array(detail.fields, 'operation detail fields').filter(field => get(field, 'name') === name && get(field, 'type') === 'resource')
  if (fields.length !== 1) throw new Error('Missing or ambiguous own transfer account')
  const resource = object(get(fields[0], 'value'), 'own transfer resource')
  const known = resourceAccount(resource, graph)
  if (known != null) return known
  const suffix = getOptString(resource, 'displayedValue')?.match(/[•*]{2,}\s*(\d{4})\s*$/)?.[1]
  const matches = suffix == null ? [] : graph.accounts.filter(account => account.instrument === instrument && account.syncIds.some(number => /^\d{20}$/.test(number) && number.endsWith(suffix)))
  if (matches.length !== 1) throw new Error('Own transfer detail account is unresolved')
  return matches[0]
}

export function getRequiredOperationDetails (
  records: unknown[], graph: AccountGraph, fromDate: Date, toDate?: Date | null,
  isSkipped: (id: string) => boolean = () => false
): string[] {
  return records.flatMap(record => {
    const raw = object(record, 'history operation')
    if (raw.isFinancial !== true || get(raw, 'state.category') !== 'executed') return []
    const date = parseBankDate(raw.date)
    if (date < fromDate || (toDate != null && date > toDate) || !needsTransferDetails(raw, graph)) return []
    const represented = [resourceAccount(raw.fromResource, graph), resourceAccount(raw.toResource, graph)].filter((a): a is AccountOrCard => a != null)
    return represented.every(account => isSkipped(account.id)) ? [] : [string(raw.uohId, 'unified operation ID')]
  })
}

function convertDetailedTransfer (raw: JsonObject, detail: JsonObject, graph: AccountGraph): [Movement, Movement] {
  if (detail.uohId !== raw.uohId || detail.form !== raw.form || get(detail, 'state.category') !== 'executed') throw new Error('Transfer details do not match history')
  const fields = array(detail.fields, 'transfer detail fields').map(field => object(field, 'transfer detail field'))
  const field = (name: string, type: string, required = true): JsonObject | null => {
    const matches = fields.filter(f => f.name === name && f.type === type)
    if (matches.length > 1 || (required && matches.length === 0)) throw new Error('Missing or ambiguous transfer detail field')
    return matches.length === 0 ? null : object(matches[0].value, 'transfer detail value')
  }
  const sourceResource = field('Счёт списания', 'resource') as JsonObject
  const destinationResource = field('Счёт зачисления', 'resource') as JsonObject
  const operationCurrency = currency(get(raw, 'operationAmount.currencyCode'))
  const principal = Math.abs(amount(get(raw, 'operationAmount.amount')))
  if (amount(get(raw, 'operationAmount.amount')) >= 0) throw new Error('Unsupported transfer principal direction')
  if (currency(get(detail, 'header.operationAmount.currencyCode')) !== operationCurrency || amount(get(detail, 'header.operationAmount.amount')) !== principal) throw new Error('Transfer principal differs from history')
  const debit = field('Сумма в валюте списания', 'amount', false)
  const credit = field('Сумма в валюте зачисления', 'amount', false)
  if (debit != null && credit != null) throw new Error('Unexpected dual conversion amounts')
  const sourceCurrency = debit != null ? currency(debit.currencyCode) : operationCurrency
  const destinationCurrency = credit != null ? currency(credit.currencyCode) : operationCurrency
  const debitAmount = debit != null ? amount(debit.amount) : principal
  const creditAmount = credit != null ? amount(credit.amount) : principal
  if (debitAmount <= 0 || creditAmount <= 0) throw new Error('Invalid transfer amounts')
  const source = resourceAccount(raw.fromResource, graph) ?? resourceAccount(sourceResource, graph)
  const destination = resourceAccount(raw.toResource, graph) ?? resourceAccount(destinationResource, graph)
  if ((source != null && source.instrument !== sourceCurrency) || (destination != null && destination.instrument !== destinationCurrency)) throw new Error('Transfer currencies differ from account currencies')
  if (source == null && destination == null) throw new Error('Transfer has no represented account')
  if (source != null && source.id === destination?.id) throw new Error('Transfer resolves to one account')
  const account = (known: AccountOrCard | undefined, resource: JsonObject, instrument: string): Movement['account'] => {
    if (known != null) return { id: known.id }
    const suffix = getOptString(resource, 'displayedValue')?.match(/[•*]{2,}\s*(\d{4})\s*$/)?.[1]
    // Keep bank-provided matching data for an unrepresented historical side.
    // Never manufacture its current balance, account number or contract terms.
    return { type: null, instrument, company: { id: '4624' }, syncIds: suffix != null ? [suffix] : null }
  }
  const commission = raw.commission == null ? 0 : amount(get(raw, 'commission.amount'))
  if (commission < 0 || (commission !== 0 && currency(get(raw, 'commission.currencyCode')) !== sourceCurrency)) throw new Error('Transfer commission needs a confirmed debit-currency amount')
  const id = string(raw.uohId, 'unified operation ID')
  return [
    { id: source != null ? `${id}:out` : null, account: account(source, sourceResource, sourceCurrency), sum: -debitAmount, invoice: sourceCurrency === operationCurrency ? null : { sum: -principal, instrument: operationCurrency }, fee: commission === 0 ? 0 : -commission },
    { id: destination != null ? `${id}:in` : null, account: account(destination, destinationResource, destinationCurrency), sum: creditAmount, invoice: destinationCurrency === operationCurrency ? null : { sum: principal, instrument: operationCurrency }, fee: 0 }
  ]
}

export function convertModernTransactions (
  records: unknown[], graph: AccountGraph, fromDate: Date, toDate?: Date | null,
  isSkipped: (id: string) => boolean = () => false,
  details: Map<string, JsonObject> = new Map()
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
    if (!['AUTHORIZATION', 'FINANCIAL', 'EXECUTED', 'SUCCESSED'].includes(String(state))) throw new Error('Unknown financial operation state')
    const date = parseBankDate(raw.date)
    if (date < fromDate || (toDate != null && date > toDate)) continue
    const id = string(raw.uohId, 'unified operation ID')
    if (seen.has(id)) throw new Error('Duplicate unified operation ID')
    seen.add(id)
    if (needsTransferDetails(raw, graph)) {
      const represented = [resourceAccount(raw.fromResource, graph), resourceAccount(raw.toResource, graph)].filter((a): a is AccountOrCard => a != null)
      if (represented.every(account => isSkipped(account.id))) continue
      const detail = details.get(id)
      if (detail == null) throw new Error('Currency transfer needs confirmed operation details')
      transactions.push({ date, hold: state === 'AUTHORIZATION', movements: convertDetailedTransfer(raw, detail, graph), merchant: null, comment: null })
      continue
    }
    const signed = amount(get(raw, 'operationAmount.amount'))
    const operationCurrency = currency(get(raw, 'operationAmount.currencyCode'))
    const source = resourceAccount(raw.fromResource, graph)
    const detail = details.get(id)
    if (detail != null && (detail.uohId !== raw.uohId || detail.form !== raw.form || get(detail, 'state.category') !== 'executed')) throw new Error('Operation details differ from history')
    const destination = resourceAccount(raw.toResource, graph) ?? (raw.form === 'UfsDepositClose' && signed !== 0 ? detailAccount(detail, 'Счёт зачисления', graph, operationCurrency) : undefined)
    const billing = raw.billingAmount == null ? null : object(raw.billingAmount, 'account operation amount')
    const account = billing != null ? graph.byBankId.get(identifier(billing.id)) : signed <= 0 ? source : destination
    if (account == null) throw new Error('History references an undiscovered account')
    const internal = signed !== 0 && source != null && destination != null && source.id !== destination.id
    if (internal ? isSkipped(source.id) && isSkipped(destination.id) : isSkipped(account.id)) continue
    const billingCurrency = billing != null ? currency(billing.currencyCode) : operationCurrency
    if (billingCurrency !== account.instrument) throw new Error('Billing currency differs from account currency')
    const { sum, invoice, fee } = convertOperationAmounts(raw, account.instrument)
    let movements: Transaction['movements']
    if (internal) {
      if (account.id !== source.id && account.id !== destination.id) throw new Error('Transfer billing account does not match either side')
      if (source.instrument !== destination.instrument || invoice != null || sum == null) throw new Error('Cross-currency transfer needs both posted account amounts')
      const base = Math.abs(signed)
      movements = [
        { id: `${id}:out`, account: { id: source.id }, sum: -base, invoice: null, fee: account.id === source.id ? fee : 0 },
        { id: `${id}:in`, account: { id: destination.id }, sum: base, invoice: null, fee: account.id === destination.id ? fee : 0 }
      ]
    } else {
      const movement: Movement = { id, account: { id: account.id }, sum, invoice, fee }
      if (['ExtCardCashIn', 'ExtCardCashOut'].includes(String(raw.form)) && signed !== 0) {
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
