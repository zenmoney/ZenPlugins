import { uniqBy } from 'lodash'

import { Account, AccountOrCard, AccountType, Amount, NonParsedMerchant, Transaction } from '../../types/zenmoney'
import { MBankStatementAccount, MBankStatementTransaction, RawAccountAndTransactions, TransactionWithId } from './models'
import { assert } from './lib/assert'

/**
 * Parse a number that may be printed either in the KGS locale of the statement
 * ("1 805 735,73" — space thousands, comma decimal) or in the US locale used
 * inside descriptions ("1,008.75" — comma thousands, dot decimal). The "keep
 * only the last separator as decimal" rule handles both.
 */
export function parseFormattedNumber (value: string): number {
  const cleaned = value
    .trim()
    .replace(/[-–−]/g, '-') // all minus-like chars → ASCII -
    .replace(/[^\d,.-]/g, '') // strip everything except digits, dot, comma, minus
    .replace(/[.,](?=.*[.,])/g, '') // drop every thousands sep → leave last one as decimal
    .replace(',', '.') // decimal comma → dot

  if (cleaned === '' || cleaned === '-' || cleaned === '.') {
    return NaN
  }
  return parseFloat(cleaned)
}

/** "28.05.2026 20:42" (or "28.05.2026") → ISO local string. */
export function parseMBankDate (value: string): string {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/)
  assert(match !== null, 'Can\'t parse date from MBank statement', value)
  const [, dd, mm, yyyy, hh, mi] = match
  return `${yyyy}-${mm}-${dd}T${hh ?? '00'}:${mi ?? '00'}:00.000`
}

/**
 * Deterministic, re-export-stable hash (cyrb53). Built from the RAW row so the
 * id never changes when the merchant/comment parser changes.
 */
export function cyrb53 (str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function makeTransactionUid (
  accountId: string,
  dateTime: string,
  payee: string,
  debit: string,
  credit: string,
  description: string,
  occurrence = 0
): string {
  const parts = [accountId, dateTime, payee, debit, credit, description]
  // Disambiguate genuinely identical rows (same minute/amount/description) so
  // uniqBy() in index.ts doesn't collapse them. Order is deterministic, so the
  // Nth duplicate keeps the same id across re-exports.
  if (occurrence > 0) {
    parts.push('#' + String(occurrence))
  }
  return `${accountId}#${cyrb53(parts.join('|')).toString(16)}`
}

/** Credit is money in (positive), debit is money out (negative). */
export function signedSum (debit: string, credit: string): number {
  const d = parseFormattedNumber(debit)
  const c = parseFormattedNumber(credit)
  return (isNaN(c) ? 0 : c) - (isNaN(d) ? 0 : d)
}

const GENERIC_PAYEE_REGEX = /ОАО\s*"?\s*М[Бб]анк/i

function isGenericPayee (payee: string | null): boolean {
  return payee == null || payee.trim() === '' || GENERIC_PAYEE_REGEX.test(payee)
}

/** Remove the boilerplate tail banks append to every transfer description. */
function cleanComment (text: string): string {
  return text
    .replace(/Счет корреспондента.*$/i, '')
    .replace(/Сумма\s+[\d.,]+\s*[A-Z]{3}.*$/i, '')
    .replace(/Конвертация валют.*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[;.\s]+$/g, '')
    .trim()
}

function makeMerchant (fullTitle: string): NonParsedMerchant {
  return { fullTitle: fullTitle.trim(), mcc: null, location: null }
}

/**
 * Pick the merchant from a backslash-delimited card description. The layout
 * varies, so we take the segment with the most letters (e.g. "STEAMGAMES.COM",
 * "APPLE ONLINE MY") and strip a trailing reference number. Returns null when no
 * segment carries letters.
 */
function pickPosMerchant (description: string): string | null {
  let best = ''
  let bestLetters = 0
  for (const segment of description.split('\\')) {
    const letters = (segment.match(/[A-Za-zА-Яа-я]/g) ?? []).length
    if (letters > bestLetters) {
      bestLetters = letters
      best = segment
    }
  }
  return bestLetters > 0 ? best.replace(/\s+\d{4,}$/, '').trim() : null
}

interface ParsedOperation {
  merchant: NonParsedMerchant | null
  comment: string | null
  invoice: Amount | null
}

/** Best-effort classification of the free-text "Операция" column. */
export function parseOperation (description: string, payee: string | null, sum: number): ParsedOperation {
  const desc = description.trim()
  const sign = sum < 0 ? -1 : 1

  // Foreign-country transfer with currency conversion → fill invoice.
  if (/В другую страну/i.test(desc)) {
    const sumMatch = desc.match(/Сумма\s+([\d.,]+)\s*([A-Z]{3})/i)
    const invoice: Amount | null = sumMatch != null
      ? { sum: sign * Math.abs(parseFormattedNumber(sumMatch[1])), instrument: sumMatch[2].toUpperCase() }
      : null
    // The segment right before a UUID is the service/merchant (e.g. "TNG Digital").
    const svcMatch = desc.match(/([^/]+)\/[0-9a-f]{8}-[0-9a-f]{4}-/i)
    const merchant = svcMatch != null ? makeMerchant(svcMatch[1]) : null
    return { merchant, comment: merchant != null ? null : cleanComment(desc), invoice }
  }

  // Standalone currency exchange between own balances:
  // "Конвертация валют (из валюты 171.34 RUB в валюту 2.28 USD)".
  const convMatch = desc.match(/Конвертация валют\s*\(из валюты\s+([\d.,]+)\s+([A-Z]{3})\s+в валюту\s+([\d.,]+)\s+([A-Z]{3})\)/i)
  if (convMatch != null) {
    const [, srcRaw, srcCur, dstRaw, dstCur] = convMatch
    const src = parseFormattedNumber(srcRaw)
    const dst = parseFormattedNumber(dstRaw)
    const absSum = Math.abs(sum)
    // The side equal to |sum| is the account's own currency; the other side is
    // the foreign amount → invoice.
    let invoice: Amount | null = null
    if (srcCur.toUpperCase() !== dstCur.toUpperCase()) {
      if (Math.abs(dst - absSum) < 0.005) {
        invoice = { sum: sign * Math.abs(src), instrument: srcCur.toUpperCase() }
      } else if (Math.abs(src - absSum) < 0.005) {
        invoice = { sum: sign * Math.abs(dst), instrument: dstCur.toUpperCase() }
      }
    }
    return { merchant: null, comment: cleanComment(desc), invoice }
  }

  // QR payment: ".../phone/phone/NAME/amount uuid/..."
  const qrMatch = desc.match(/Перевод по QR\.\s*[^/]+\/[^/]+\/([^/]+)\//i)
  if (qrMatch != null) {
    return { merchant: makeMerchant(qrMatch[1]), comment: null, invoice: null }
  }

  // Phone transfer: "... phone/ NAME/ ..."
  const phoneMatch = desc.match(/Перевод по номеру телефона\.\s*[^/]+\/\s*([^/]+?)\s*\//i)
  if (phoneMatch != null) {
    const name = phoneMatch[1].trim()
    const title = name !== '' ? name : (isGenericPayee(payee) ? null : payee)
    return { merchant: title != null ? makeMerchant(title) : null, comment: null, invoice: null }
  }

  // Money envelope: "... phone / NAME / MESSAGE / ..."
  const envMatch = desc.match(/Перевод с денежным конвертом\.\s*[^/]+\/\s*([^/]+?)\s*\/\s*([^/]+?)\s*\//i)
  if (envMatch != null) {
    const message = envMatch[2].trim()
    return { merchant: makeMerchant(envMatch[1]), comment: message !== '' ? message : null, invoice: null }
  }

  // Card POS / e-commerce: backslash-delimited fields.
  if (desc.includes('\\')) {
    const title = pickPosMerchant(desc)
    if (title != null) {
      return { merchant: makeMerchant(title), comment: null, invoice: null }
    }
  }

  // Salary / accruals.
  if (/MBIZ_MBANK/i.test(desc)) {
    return { merchant: null, comment: cleanComment(desc.replace(/MBIZ_MBANK/i, '')), invoice: null }
  }

  // Everything else (refunds, cash-in, ...): keep cleaned text as comment.
  const payeeMerchant = isGenericPayee(payee) ? null : makeMerchant(payee as string)
  return { merchant: payeeMerchant, comment: cleanComment(desc), invoice: null }
}

export function convertAccount (raw: MBankStatementAccount): AccountOrCard {
  return {
    id: raw.id,
    type: AccountType.checking,
    title: raw.title,
    instrument: raw.instrument,
    balance: raw.balance,
    syncIds: [raw.id]
  }
}

export function convertTransaction (accountId: string, raw: MBankStatementTransaction): TransactionWithId {
  const sum = signedSum(raw.debit, raw.credit)
  const { merchant, comment, invoice } = parseOperation(raw.description, raw.payee, sum)

  const transaction: Transaction = {
    hold: false,
    date: new Date(raw.date),
    merchant,
    comment: comment === '' ? null : comment,
    movements: [
      {
        id: raw.uid,
        account: { id: accountId },
        invoice,
        sum,
        fee: 0
      }
    ]
  }

  return { uid: raw.uid, transaction }
}

export function convertTransactions (accountId: string, rawTransactions: MBankStatementTransaction[]): TransactionWithId[] {
  return rawTransactions.map(raw => convertTransaction(accountId, raw))
}

/**
 * Merge parsed statements into the ZenMoney result.
 *
 * Several picked files may belong to the same account (e.g. overlapping
 * periods), so accounts are merged by id (freshest balance wins) — emitting two
 * accounts with the same id would crash the app. Pooled rows then dedup by their
 * stable movement id, so re-importing the same or an overlapping file is safe.
 */
export function mergeStatements (statements: RawAccountAndTransactions): { accounts: Account[], transactions: Transaction[] } {
  const byAccountId = new Map<string, { account: MBankStatementAccount, transactions: MBankStatementTransaction[] }>()
  for (const { account, transactions: rows } of statements) {
    const existing = byAccountId.get(account.id)
    if (existing == null) {
      byAccountId.set(account.id, { account, transactions: [...rows] })
    } else {
      existing.transactions.push(...rows)
      if (account.date > existing.account.date) {
        existing.account = account
      }
    }
  }

  const accounts: Account[] = []
  const transactions: TransactionWithId[] = []
  for (const { account, transactions: rows } of byAccountId.values()) {
    accounts.push(convertAccount(account))
    transactions.push(...convertTransactions(account.id, rows))
  }

  return {
    accounts,
    transactions: uniqBy(transactions, x => x.uid).map(x => x.transaction)
  }
}
