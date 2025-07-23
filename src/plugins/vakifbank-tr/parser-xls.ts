import * as XLSX from 'xlsx'
import { assert } from './lib/assert'
import { RawAccountAndTransactions, VakifStatementAccount, VakifStatementTransaction } from './models'
import { parseDateAndTimeFromPdfText, parseDateFromPdfText, parseFormattedNumber } from './converters'

/** Normalise cell text for header matching */
const norm = (v: unknown): string =>
  (typeof v === 'string' ? v.trim().toLowerCase() : '')

/** Header keys we care about (support ENG + most common TR) */
const HEAD = {
  ACCOUNT_NO: ['account number', 'hesap no', 'account no'],
  TX_DATE: ['transaction date', 'i̇şlem tarihi', 'islem tarihi'],
  AMOUNT: ['amount', 'tutar'],
  BALANCE: ['balance', 'bakiye'],
  DESC1: ['transaction  name', 'i̇şlem adı', 'islem adi'],
  DESC2: ['narrative', 'açıklama', 'aciklama'],
  UID: [
    'transaction id',
    'referans',
    'reference number',
    'i̇şlem numarası',
    'islem numarasi'
  ]
}

export function parseXlsStatements (
  buffers: ArrayBuffer[]
): RawAccountAndTransactions {
  const out: RawAccountAndTransactions = []

  for (const buf of buffers) {
    const wb = XLSX.read(buf, { type: 'array', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false })

    // ---------- 1· Extract metadata (id / instrument / date) ----------------
    let accountId = ''
    let instrument = 'TL'
    let statementDate = ''

    for (const r of rows.slice(0, 30)) {
      const a = norm(r[0])
      if (accountId === '' && HEAD.ACCOUNT_NO.includes(a)) {
        const val = (r[1] ?? '').toString().replace(/\s/g, '')
        if (/^\d{17}$/.test(val)) accountId = val
      }
      if (instrument === 'TL' && a.startsWith('account type')) {
        const val = (r[1] ?? '').toString()
        const maybe = val.split(/\s+/).pop()
        if (maybe != null) instrument = maybe.toUpperCase()
      }
      if (statementDate === '' && /date range/i.test(a)) {
        const m = (r.join(' ')).match(/(\d{2}\.\d{2}\.\d{4})/)
        if (m != null) statementDate = parseDateFromPdfText(m[1])
      }
    }

    // Fallbacks if headers miss: grab from first tx row later.
    // Statement date fallback will be set after we parse txRows.

    // ---------- 2· Locate header row & map column indices -------------------
    const headerRowIdx = rows.findIndex((r) =>
      r.some((c) => HEAD.ACCOUNT_NO.includes(norm(c)))
    )
    assert(headerRowIdx !== -1, 'XLS parser: header row not found')

    const headerRow = rows[headerRowIdx]
    const colIdx = (keys: readonly string[]): number =>
      headerRow.findIndex((c) => keys.includes(norm(c)))

    const idxAccount = colIdx(HEAD.ACCOUNT_NO)
    const idxDateTime = colIdx(HEAD.TX_DATE)
    const idxAmount = colIdx(HEAD.AMOUNT)
    const idxBalance = colIdx(HEAD.BALANCE)
    const idxDesc1 = colIdx(HEAD.DESC1)
    const idxDesc2 = colIdx(HEAD.DESC2)
    const idxUid = colIdx(HEAD.UID)

    // We must have at least date+amount
    assert(idxDateTime !== -1 && idxAmount !== -1, 'XLS parser: essential columns missing')

    // ---------- 3· Parse transaction rows ----------------------------------
    const txRows = rows.slice(headerRowIdx + 1).filter((r) => {
      const v = r[idxDateTime]
      return typeof v === 'string' && /^\d{2}\.\d{2}\.\d{4}/.test(v)
    })

    if (txRows.length === 0) {
      console.warn('[Vakif XLS] no transactions detected — skipping file')
      continue
    }

    // If statementDate still empty → derive from first tx row
    if (statementDate === '') {
      const firstDate = (txRows[0][idxDateTime]).split(' ')[0]
      statementDate = parseDateFromPdfText(firstDate)
    }

    // accountId fallback → first tx cell
    if (accountId === '') {
      const maybe = (txRows[0][idxAccount] ?? '').toString().replace(/\s/g, '')
      if (/^\d{17}$/.test(maybe)) accountId = maybe
    }

    assert(accountId !== '', 'XLS parser: accountId not found')

    const transactions: VakifStatementTransaction[] = txRows.map((row) => {
      const dateTime = (row[idxDateTime]).trim()
      const [, dateStr, timeStr] =
        dateTime.match(/(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})/) ?? []

      return {
        date: parseDateAndTimeFromPdfText(dateStr, timeStr),
        amount: (row[idxAmount] ?? '0').toString(),
        balance: idxBalance !== -1 ? (row[idxBalance] ?? '0').toString() : '0',
        description1: idxDesc1 !== -1 ? (row[idxDesc1] ?? null)?.toString() ?? null : null,
        description2: idxDesc2 !== -1 ? (row[idxDesc2] ?? null)?.toString() ?? null : null,
        statementUid:
          idxUid !== -1 ? (row[idxUid] ?? '').toString() : dateTime + Math.random().toString(36).slice(2),
        originString: row.map((c) => (c ?? '')).join(' | ')
      }
    })

    // ---------- 4· Build account & push result ------------------------------
    const account: VakifStatementAccount = {
      id: accountId,
      title: 'Vakifbank *' + accountId.slice(-4),
      balance:
        idxBalance !== -1 ? parseFormattedNumber((txRows[txRows.length - 1][idxBalance] ?? '0').toString()) : 0,
      instrument,
      date: statementDate
    }

    out.push({ account, transactions })
  }

  return out
}
