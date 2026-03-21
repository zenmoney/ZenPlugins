import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { CardTransactionRow, ParsedAccountRow } from './models'

function uniqueStrings (values: Array<string | undefined>): string[] {
  const out: string[] = []
  for (const value of values) {
    if (value == null) {
      continue
    }
    const normalized = value.trim()
    if (normalized === '' || out.includes(normalized)) {
      continue
    }
    out.push(normalized)
  }
  return out
}

function parseNumber (value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const compact = value
      .replace(/\u00a0/g, '')
      .replace(/\s/g, '')
      .replace(/[^\d,().+-]/g, '')

    if (compact === '') {
      return null
    }

    let normalized = compact
    const wrappedInBrackets = normalized.startsWith('(') && normalized.endsWith(')')
    if (wrappedInBrackets) {
      normalized = `-${normalized.slice(1, -1)}`
    }

    const commaIndex = normalized.lastIndexOf(',')
    const dotIndex = normalized.lastIndexOf('.')
    normalized = commaIndex > dotIndex
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '')

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function parseDateFromParts (
  dayRaw: string,
  monthRaw: string,
  yearRaw: string,
  hourRaw?: string,
  minuteRaw?: string,
  secondRaw?: string
): Date | null {
  const day = Number(dayRaw)
  const month = Number(monthRaw)
  const year = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw)
  const hour = Number(hourRaw ?? '0')
  const minute = Number(minuteRaw ?? '0')
  const second = Number(secondRaw ?? '0')

  const date = new Date(year, month - 1, day, hour, minute, second, 0)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

function parseTransactionDate (value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value !== 'string') {
    return null
  }

  const raw = value.replace(/\u00a0/g, ' ').trim()
  if (raw === '') {
    return null
  }

  const msSinceEpoch = raw.match(/^\/Date\((\d+)\)\/$/)
  if (msSinceEpoch != null) {
    const date = new Date(Number(msSinceEpoch[1]))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const withTime = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (withTime != null) {
    return parseDateFromParts(withTime[1], withTime[2], withTime[3], withTime[4], withTime[5], withTime[6])
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function trimOrUndefined (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function toMovementId (value: unknown): string | null {
  if (value == null) {
    return null
  }
  const asString = String(value).trim()
  return asString === '' ? null : asString
}

function buildAccountIndex (accounts: AccountOrCard[]): Map<string, AccountOrCard> {
  const map = new Map<string, AccountOrCard>()
  for (const account of accounts) {
    const keys = [account.id, ...account.syncIds]
    for (const key of keys) {
      const normalized = key.trim()
      if (normalized === '') {
        continue
      }
      map.set(normalized, account)
      map.set(normalized.toUpperCase(), account)
    }
  }
  return map
}

export function convertAccount (row: ParsedAccountRow): AccountOrCard {
  const instrument = trimOrUndefined(row.instrument) ?? 'GEL'
  const accountType = row.isCard ? AccountType.ccard : AccountType.checking

  return {
    id: row.id,
    type: accountType,
    title: trimOrUndefined(row.title) ?? row.id,
    instrument,
    syncIds: uniqueStrings([row.id, row.iban, ...row.syncIds]),
    balance: row.balance,
    available: row.available
  }
}

export function convertAccounts (rows: ParsedAccountRow[]): AccountOrCard[] {
  const byId = new Map<string, AccountOrCard>()
  for (const row of rows) {
    const converted = convertAccount(row)
    byId.set(converted.id, converted)
  }
  return [...byId.values()]
}

function convertTransaction (
  row: CardTransactionRow,
  hold: boolean,
  accountIndex: Map<string, AccountOrCard>
): Transaction | null {
  const accountIban = trimOrUndefined(row.AccountIban)
  if (accountIban == null) {
    return null
  }

  const account = accountIndex.get(accountIban) ?? accountIndex.get(accountIban.toUpperCase())
  if (account == null || ZenMoney.isAccountSkipped(account.id)) {
    return null
  }

  const amount = parseNumber(row.Amount)
  if (amount == null) {
    return null
  }
  // ZenMoney requires at least one non-zero side (income/outcome); skip zero-sum bank rows.
  if (amount === 0) {
    return null
  }

  const date = parseTransactionDate(row.DocDate)
  if (date == null) {
    return null
  }

  const instrument = trimOrUndefined(row.Ccy) ?? account.instrument
  const movementId = toMovementId(row.TransactionID) ??
    toMovementId(row.TransferID) ??
    trimOrUndefined(row.TransactionReference) ??
    null

  return {
    hold,
    date,
    movements: [
      {
        id: movementId,
        account: { id: account.id },
        invoice: instrument === account.instrument ? null : { sum: amount, instrument },
        sum: amount,
        fee: 0
      }
    ],
    merchant: null,
    comment: trimOrUndefined(row.Description) ?? null
  }
}

export function convertTransactions (
  booked: CardTransactionRow[],
  pending: CardTransactionRow[],
  accounts: AccountOrCard[]
): Transaction[] {
  const accountIndex = buildAccountIndex(accounts)
  const out: Transaction[] = []
  const dedupe = new Set<string>()

  for (const [rows, hold] of [[booked, false], [pending, true]] as const) {
    for (const row of rows) {
      const converted = convertTransaction(row, hold, accountIndex)
      if (converted == null) {
        continue
      }

      const movement = converted.movements[0]
      const movementAccountId = typeof movement.account === 'object' && movement.account != null && 'id' in movement.account
        ? String(movement.account.id)
        : ''
      const movementSum = movement.sum == null ? '' : String(movement.sum)
      const dedupeKey = `${movement.id ?? ''}|${movementAccountId}|${movementSum}|${converted.date.toISOString()}|${String(hold)}`
      if (dedupe.has(dedupeKey)) {
        continue
      }

      dedupe.add(dedupeKey)
      out.push(converted)
    }
  }

  out.sort((left, right) => left.date.getTime() - right.date.getTime())
  return out
}
