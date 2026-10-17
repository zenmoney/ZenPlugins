import get from '../../../types/get'
import { Account, Transaction } from '../../../types/zenmoney'
import { array, number, text } from '../parse'
import { OnlineSource, OnlineOperation } from '../models'

/** Saved identity and initiation date for an authorization that became booked history. */
interface HistoryAlias {
  readonly id: string
  readonly date: string
}

/** Previously emitted authorizations support identity matching without replaying absent entries. */
interface OnlineState {
  readonly imported: readonly OnlineOperation[]
  readonly historyAliases: Readonly<Record<string, HistoryAlias>>
}

/** Combine approved history with current authorizations, retaining identities across settlement. */
export function combineOnlineTransactions (
  history: readonly unknown[],
  transactions: readonly Transaction[],
  sources: readonly OnlineSource[],
  accounts: readonly Account[],
  fromDate: Date,
  toDate?: Date,
  saved?: unknown
): { transactions: Transaction[], state: OnlineState } {
  const previous = savedState(saved)
  const aliases = { ...previous.historyAliases }
  const current = sources.flatMap(source => source.entries.map(record => ({ accountId: source.accountId, cardId: source.cardId, record })))
  const imported = new Map(previous.imported.map(operation => [operationId(operation), operation]))
  const seen = new Map<string, string>()
  const additions: Transaction[] = []
  const candidates = new Map([...previous.imported, ...current].map(operation => [operationId(operation), operation]))
  const uniqueHistory = [...new Map(history.map(record => [text(record, 'transactionId'), record])).values()]
  const linked = new Set<string>()
  for (const operation of candidates.values()) {
    const matches = uniqueHistory.filter(record => matchingHistory(operation, record))
    const wasImported = imported.has(operationId(operation))
    if (matches.length === 1 && [...candidates.values()].filter(candidate => matchingHistory(candidate, matches[0])).length === 1) {
      linked.add(operationId(operation))
      const id = text(matches[0], 'transactionId')
      if (aliases[id] === undefined && (wasImported || operationDate(operation).getTime() !== number(matches[0], 'transactionDate'))) {
        aliases[id] = { id: wasImported ? operationId(operation) : id, date: text(operation.record, 'operationDate') }
      }
      imported.delete(operationId(operation))
    }
  }
  for (const operation of current) {
    const state = text(operation.record, 'state')
    console.assert(state === 'AUTHORIZED' || state === 'SETTLED', 'Unsupported MyAmeria online transaction state', { state })
    if (state === 'SETTLED') continue
    const date = operationDate(operation)
    if (date < fromDate || (toDate != null && date > toDate)) continue
    if (linked.has(operationId(operation))) continue
    const id = operationId(operation)
    const transaction = onlineTransaction(operation, accounts, date)
    const signature = JSON.stringify(transaction)
    console.assert(!seen.has(id) || seen.get(id) === signature, 'Conflicting MyAmeria online transaction identity')
    if (seen.has(id)) continue
    seen.set(id, signature)
    imported.set(id, operation)
    additions.push(transaction)
  }
  const combined = transactions.map(transaction => aliasedTransaction(transaction, aliases))
    .filter(transaction => transaction.date >= fromDate && (toDate == null || transaction.date <= toDate))
  return { transactions: [...combined, ...additions], state: { imported: [...imported.values()], historyAliases: aliases } }
}

/** Validate persisted financial identity metadata without trusting stored bank payloads. */
function savedState (saved: unknown): OnlineState {
  if (saved === undefined || saved === null) return { imported: [], historyAliases: {} }
  const imported = array(saved, 'imported').map(item => ({ accountId: text(item, 'accountId'), cardId: text(item, 'cardId'), record: get(item, 'record') }))
  const rawAliases = get(saved, 'historyAliases')
  console.assert(rawAliases !== null && typeof rawAliases === 'object' && !Array.isArray(rawAliases), 'Invalid MyAmeria online identity state')
  const historyAliases = Object.fromEntries(Object.entries(rawAliases as Record<string, unknown>).map(([key, value]) => {
    const alias = { id: text(value, 'id'), date: text(value, 'date') }
    console.assert(Number.isFinite(new Date(alias.date).getTime()), 'Invalid MyAmeria saved operation date')
    return [key, alias]
  }))
  return { imported, historyAliases }
}

/** Card identity, authorization code and initiation time distinguish repeated authorization codes. */
function operationId (operation: OnlineOperation): string {
  return `online:${operation.cardId}:${text(operation.record, 'id')}:${text(operation.record, 'operationDate')}`
}

/** Validate the bank's explicit timestamp independently of the local time zone. */
function operationDate (operation: OnlineOperation): Date {
  const date = new Date(text(operation.record, 'operationDate'))
  console.assert(Number.isFinite(date.getTime()), 'Invalid MyAmeria online operation date')
  return date
}

/** Require direction, account, currency and amount plus a bank reference or exact transfer timestamp. */
function matchingHistory (operation: OnlineOperation, history: unknown): boolean {
  const record = operation.record
  const debit = text(record, 'accountingType') === 'DEBIT'
  const account = text(history, debit ? 'debitAccountNumber' : 'creditAccountNumber')
  if (account !== operation.accountId || text(history, 'flowDirection') !== (debit ? 'EXPENSE' : 'INCOME')) return false
  if (text(record, 'amount.currency') !== text(history, 'transactionAmount.currency') || number(record, 'amount.amount') !== number(history, 'transactionAmount.value')) return false
  const elapsed = number(history, 'transactionDate') - operationDate(operation).getTime()
  if (text(history, 'transactionType') !== 'card') return elapsed === 0
  if (elapsed < 0 || elapsed > 7 * 86400000) return false
  const descriptor = text(history, 'details').replace(/^Ք: /, '')
  const reference = descriptor.match(/ (\d+)$/)?.[1]
  const merchant = text(record, 'details').trim().split(/\s+/)[0]
  return reference !== undefined && text(record, 'id').startsWith(reference) && descriptor.startsWith(`${merchant} `)
}

/** Authorizations are ordinary transactions by explicit user choice; bank ambiguities remain distinct. */
function onlineTransaction (operation: OnlineOperation, accounts: readonly Account[], date: Date): Transaction {
  const record = operation.record
  const account = accounts.find(account => account.id === operation.accountId)
  if (account === undefined) throw new Error('MyAmeria online account is missing')
  console.assert(text(record, 'correspondentAccountNumber') === account.id, 'MyAmeria online account mismatch')
  const direction = text(record, 'accountingType')
  console.assert(direction === 'DEBIT' || direction === 'CREDIT', 'Unknown MyAmeria online accounting direction')
  const value = number(record, 'amount.amount')
  console.assert(value >= 0, 'Negative MyAmeria online amount')
  const sum = (direction === 'DEBIT' ? -1 : 1) * value
  const currency = text(record, 'amount.currency')
  return {
    date,
    hold: false,
    movements: [{ id: `${operationId(operation)}:${account.id}`, account: { id: account.id }, sum: currency === account.instrument ? sum : null, fee: 0, invoice: currency === account.instrument ? null : { sum, instrument: currency } }],
    merchant: { fullTitle: text(record, 'details').trim(), mcc: null, location: null },
    comment: null
  }
}

/** Preserve prior online identities and initiation dates when the corresponding history arrives. */
function aliasedTransaction (transaction: Transaction, aliases: Readonly<Record<string, HistoryAlias>>): Transaction {
  const matched = transaction.movements.flatMap(movement => {
    if (movement.id === null || !('id' in movement.account)) return []
    const suffix = `:${movement.account.id}`
    const id = movement.id.endsWith(suffix) ? movement.id.slice(0, -suffix.length) : movement.id
    const alias = aliases[id]
    return alias === undefined ? [] : [alias]
  })
  if (matched.length === 0) return transaction
  const alias = matched[0]
  return {
    ...transaction,
    date: new Date(alias.date),
    movements: transaction.movements.map(movement => ({ ...movement, id: movement.id !== null && 'id' in movement.account ? `${alias.id}:${movement.account.id}` : movement.id })) as Transaction['movements']
  }
}
