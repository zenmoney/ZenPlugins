import { uniqBy } from 'lodash'

import { Account, AccountOrCard, AccountType, NonParsedMerchant, Transaction } from '../../types/zenmoney'
import { RawAccountAndTransactions, SimbankStatementAccount, SimbankStatementTransaction, TransactionWithId } from './models'
import { assert } from './lib/assert'

/**
 * Parse a number printed in the KGS locale of the statement ("47 090,52" — space
 * thousands, comma decimal). The leading sign (printed as "+"/"-") is preserved.
 */
export function parseFormattedNumber (value: string): number {
  // Treat any minus-like glyph (ASCII "-", U+2212, en/em dashes) as a sign.
  const normalized = value.replace(/[\u2012\u2013\u2014\u2015\u2212]/g, '-')
  const negative = normalized.includes('-')
  const cleaned = normalized
    .trim()
    .replace(/[^\d,.]/g, '') // strip everything except digits, dot, comma
    .replace(/[.,](?=.*[.,])/g, '') // drop every thousands sep → leave last one as decimal
    .replace(',', '.') // decimal comma → dot

  if (cleaned === '' || cleaned === '.') {
    return NaN
  }
  const n = parseFloat(cleaned)
  return negative ? -n : n
}

/** "21-12-2025" + "09:49:14" → ISO local string. Either part may be omitted. */
export function parseSimbankDate (date: string, time = ''): string {
  const match = date.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/)
  assert(match !== null, 'Can\'t parse date from Simbank statement', date)
  const [, dd, mm, yyyy] = match
  const timeMatch = time.trim().match(/^(\d{2}):(\d{2}):(\d{2})$/)
  const hh = timeMatch?.[1] ?? '00'
  const mi = timeMatch?.[2] ?? '00'
  const ss = timeMatch?.[3] ?? '00'
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}.000`
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
  amount: string,
  balance: string,
  occurrence = 0
): string {
  // The running "Баланс после операции" is a near-unique per-row fingerprint, so the id
  // is built from card + date-time + amount + balance and deliberately EXCLUDES the
  // description — which the bank localizes (Russian/Kyrgyz/English). That keeps the same
  // operation deduplicated even when the same statement is imported in two languages.
  const parts = [accountId, dateTime, amount, balance]
  // Disambiguate genuinely identical rows (same second/amount/balance) so uniqBy()
  // doesn't collapse them. Order is deterministic, so the Nth duplicate keeps the same
  // id across re-exports.
  if (occurrence > 0) {
    parts.push('#' + String(occurrence))
  }
  return `${accountId}#${cyrb53(parts.join('|')).toString(16)}`
}

/** The signed "Сумма" cell already carries its sign. */
export function signedSum (amount: string): number {
  const n = parseFormattedNumber(amount)
  return isNaN(n) ? 0 : n
}

function makeMerchant (fullTitle: string): NonParsedMerchant {
  return { fullTitle: fullTitle.trim(), mcc: null, location: null }
}

// Service / internal rows that are not a real merchant — kept as a comment.
// Anchored at the start so a real merchant merely containing one of these phrases
// isn't misclassified; "Simbank" must match the fee row exactly.
const SERVICE_DESCRIPTION_REGEX = /^Simbank$|^(?:Регулярный платеж|Округление баланса|Процент на остаток)/i

interface ParsedOperation {
  merchant: NonParsedMerchant | null
  comment: string | null
}

/** Classify the free-text "Детали операции" column. */
export function parseOperation (description: string): ParsedOperation {
  const desc = description.replace(/\s+/g, ' ').trim()
  if (desc === '') {
    return { merchant: null, comment: null }
  }
  if (SERVICE_DESCRIPTION_REGEX.test(desc)) {
    return { merchant: null, comment: desc }
  }
  return { merchant: makeMerchant(desc), comment: null }
}

/** Round to 2 decimals, killing float noise from the limit subtraction. */
function round2 (n: number): number {
  return Math.round(n * 100) / 100
}

export function convertAccount (raw: SimbankStatementAccount): AccountOrCard {
  // raw.balance is already the own-funds balance (negative = debt). When a credit
  // limit is set, report it as a credit card so Zenmoney shows
  // available = balance + creditLimit and the amount owed.
  const isCredit = raw.creditLimit != null && raw.creditLimit > 0
  const balance = round2(raw.balance)

  // Amount owed: prefer the bank's "Сумма использованного лимита", else the debt
  // implied by a negative own-funds balance. Only meaningful for a credit card.
  const totalAmountDue = isCredit
    ? round2(raw.usedLimit ?? Math.max(0, -balance))
    : undefined

  return {
    id: raw.id,
    type: isCredit ? AccountType.ccard : AccountType.checking,
    title: raw.title,
    instrument: raw.instrument,
    balance,
    creditLimit: isCredit ? raw.creditLimit : undefined,
    totalAmountDue,
    // Match on the full masked PAN, not just the last 4 — another card ending in the
    // same 4 digits would otherwise be merged into this account.
    syncIds: [raw.id]
  }
}

export function convertTransaction (accountId: string, raw: SimbankStatementTransaction): TransactionWithId {
  const sum = signedSum(raw.amount)
  const { merchant, comment } = parseOperation(raw.description)

  const transaction: Transaction = {
    hold: false,
    date: new Date(raw.date),
    merchant,
    comment,
    movements: [
      {
        id: raw.uid,
        account: { id: accountId },
        invoice: null,
        sum,
        fee: 0
      }
    ]
  }

  return { uid: raw.uid, transaction }
}

export function convertTransactions (accountId: string, rawTransactions: SimbankStatementTransaction[]): TransactionWithId[] {
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
export function mergeStatements (statements: RawAccountAndTransactions | null): { accounts: Account[], transactions: Transaction[] } {
  const accounts: Account[] = []
  const transactions: TransactionWithId[] = []

  if (statements !== null) {
    const byAccountId = new Map<string, { account: SimbankStatementAccount, transactions: SimbankStatementTransaction[] }>()
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

    for (const { account: rawAccount, transactions: rawTransactions } of byAccountId.values()) {
      accounts.push(convertAccount(rawAccount))
      transactions.push(...convertTransactions(rawAccount.id, rawTransactions))
    }
  }

  return {
    accounts,
    transactions: uniqBy(transactions, x => x.uid).map(x => x.transaction)
  }
}
