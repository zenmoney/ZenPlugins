import * as XLSX from 'xlsx'

import { MBankStatementAccount, MBankStatementTransaction } from './models'
import { makeTransactionUid, parseFormattedNumber, parseMBankDate } from './converters'
import { assert } from './lib/assert'

const norm = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** A transaction row starts with a "DD.MM.YYYY HH:mm" value in column A. */
const DATE_TIME_RE = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/

/** Read the inline capture group from the first cell matching the label. */
function findLabelValue (rows: string[][], label: RegExp): string | null {
  for (const row of rows) {
    for (const cell of row) {
      const m = norm(cell).match(label)
      if (m != null) {
        return m[1].trim()
      }
    }
  }
  return null
}

/**
 * Find a numeric amount printed for a label, whether it sits inline in the same
 * cell ("Текущий остаток средств: 1 540 069,11") or in a separate column of the
 * same row ("Средства на конец периода:" | "" | "1 540 069,11").
 */
function findAmountByLabel (rows: string[][], label: RegExp): number | null {
  for (const row of rows) {
    const idx = row.findIndex(c => label.test(norm(c)))
    if (idx === -1) continue
    // Prefer a number in a later column (footer split-cell layout).
    for (let j = idx + 1; j < row.length; j++) {
      const v = norm(row[j])
      if (v !== '' && /\d/.test(v)) {
        const n = parseFormattedNumber(v)
        if (!isNaN(n)) {
          return n
        }
      }
    }
    // Otherwise an inline trailing number in the label cell.
    const inline = norm(row[idx]).match(/(-?[\d\s.,]+)\s*$/)
    if (inline != null && /\d/.test(inline[1])) {
      const n = parseFormattedNumber(inline[1])
      if (!isNaN(n)) {
        return n
      }
    }
  }
  return null
}

export function looksLikeMBankStatement (rows: string[][]): boolean {
  return rows.some(row => row.some(cell => /М[Бб]анк/.test(norm(cell)))) &&
    rows.some(row => row.some(cell => /Лицевой счет/i.test(norm(cell))))
}

/** Extract the account (id, currency, balance, date) from the label-based header/footer. */
function parseAccountHeader (rows: string[][]): MBankStatementAccount {
  const accountId = (findLabelValue(rows, /Лицевой счет:\s*(\d[\d\s]*)/i) ?? '').replace(/\s/g, '')
  assert(/^\d{6,}$/.test(accountId), 'Не удалось определить номер лицевого счёта')

  const instrument = findLabelValue(rows, /Валюта:\s*([A-Za-z]{3})/i)?.toUpperCase() ?? 'KGS'

  const balance =
    findAmountByLabel(rows, /Средства на конец периода/i) ??
    findAmountByLabel(rows, /Текущий остаток средств/i) ??
    0

  const statementDateText = findLabelValue(rows, /Состояние счета на:\s*(\d{2}\.\d{2}\.\d{4})/i) ??
    findLabelValue(rows, /Дата:\s*(\d{2}\.\d{2}\.\d{4})/i)

  return {
    id: accountId,
    title: 'MBank *' + accountId.slice(-4),
    balance,
    instrument,
    date: statementDateText != null ? parseMBankDate(statementDateText) : ''
  }
}

/** Parse the transaction table; identical rows get a per-statement occurrence index. */
function parseTransactionRows (rows: string[][], accountId: string): MBankStatementTransaction[] {
  // Locate the transaction header row (column A === "Дата").
  const headerRowIdx = rows.findIndex(row => norm(row[0]) === 'Дата' && /Дебет/i.test(row.join(' ')))
  assert(headerRowIdx !== -1, 'Не найдена таблица операций в выписке')

  const transactions: MBankStatementTransaction[] = []
  const seen = new Map<string, number>()
  for (const row of rows.slice(headerRowIdx + 1)) {
    const dateCell = norm(row[0])
    if (!DATE_TIME_RE.test(dateCell)) {
      // Footer rows ("Средства на начало периода:" etc.) and blanks → stop scanning.
      if (dateCell !== '' && /Средства на начало периода/i.test(dateCell)) break
      continue
    }
    const debit = norm(row[2])
    const credit = norm(row[3])
    const description = norm(row[4])
    const payeeRaw = norm(row[1])

    const dupKey = `${dateCell}|${payeeRaw}|${debit}|${credit}|${description}`
    const occurrence = seen.get(dupKey) ?? 0
    seen.set(dupKey, occurrence + 1)

    transactions.push({
      date: parseMBankDate(dateCell),
      debit,
      credit,
      payee: payeeRaw !== '' ? payeeRaw : null,
      description,
      uid: makeTransactionUid(accountId, dateCell, payeeRaw, debit, credit, description, occurrence)
    })
  }
  return transactions
}

/**
 * Pure parser: turns the raw sheet (2-D string array) into an account and its
 * transactions. Kept free of the `xlsx` binary layer so it can be unit-tested
 * with an inline fixture.
 */
export function parseStatementRows (rows: string[][]): { account: MBankStatementAccount, transactions: MBankStatementTransaction[] } {
  assert(looksLikeMBankStatement(rows), 'Похоже, это не выписка MBank')
  const account = parseAccountHeader(rows)
  const transactions = parseTransactionRows(rows, account.id)
  return { account, transactions }
}

/** Binary entry point: parse one or more .xls/.xlsx buffers. */
export function parseXlsStatements (buffers: ArrayBuffer[]): Array<{ account: MBankStatementAccount, transactions: MBankStatementTransaction[] }> {
  const out = []
  let lastError: unknown = null
  for (const buf of buffers) {
    try {
      const wb = XLSX.read(buf, { type: 'array', cellDates: false })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, raw: false, defval: '' })
      out.push(parseStatementRows(rows))
    } catch (e) {
      // Isolate a single bad file so the rest still import.
      console.error('[mbank-kg] failed to parse a statement file', e)
      lastError = e
    }
  }
  // If every file failed, surface the error (e.g. "not an MBank statement").
  if (out.length === 0 && lastError != null) {
    throw lastError
  }
  return out
}
