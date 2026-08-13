import { SimbankStatementAccount, SimbankStatementTransaction } from './models'
import { makeTransactionUid, parseFormattedNumber, parseSimbankDate } from './converters'
import { assert } from './lib/assert'

const DATE_RE = /^\d{2}-\d{2}-\d{4}$/
const TIME_RE = /^\d{2}:\d{2}:\d{2}$/

/**
 * The final line of a row is space-separated as
 *   "<description> <signed Сумма> <Плата за кредит> <Баланс после операции>"
 * "Плата за кредит" is usually "-" (no credit fee) but carries a number when the
 * balance is in credit ("Эльвира М. -7 416,00 216,00 -54 169,93"). That fee does
 * NOT move the running balance (balance = previous + Сумма), so it is informational.
 * Balances may be negative. Amounts use space thousands separators.
 *   "SB061-BBCC (LALA P -579,48 - 47 090,52" → desc, "-579,48", fee "-", "47 090,52"
 *   "-100,00 - 46 520,01"                    → (no desc), "-100,00", fee "-", "46 520,01"
 *
 * The "Сумма" column is ALWAYS signed; requiring a leading sign on the amount group
 * fixes the description→amount boundary even when the description itself contains a
 * money-shaped token ("Fuel 35,50 -100,00 - 900,00" → desc "Fuel 35,50").
 */
const ROW_TAIL_RE = /^(.*?)([+-]\d[\d ]*,\d{2})\s+(-|[+-]?\d[\d ]*,\d{2})\s+([+-]?\d[\d ]*,\d{2})$/

/**
 * pdfjs emits exotic Unicode spaces \u2014 notably U+202F (narrow no-break space) as the
 * thousands separator and U+00A0 \u2014 which simple ` `-based char classes miss. Fold
 * them all to a plain space, and any minus-like glyph (U+2212 etc.) to ASCII "-", so the
 * amount/balance regexes and sign detection are reliable (newlines preserved).
 */
function normalizeSpaces (text: string): string {
  return text
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/g, ' ')
    .replace(/[\u2012\u2013\u2014\u2015\u2212]/g, '-')
}

// Repeated per-page table-header captions (split across lines by pdfjs) to ignore
// while scanning rows — Russian and Kyrgyz column titles.
const HEADER_NOISE_LINES = [
  'Дата Детали операции Сумма', 'Плата за', 'кредит', 'Баланс после', 'операции', // ru
  'Дата Операциянын деталдары Сумма', 'Кредит', 'үчүн', 'төлөм', 'Операциядан', 'кийинки', 'баланс' // ky
]
const HEADER_NOISE_RE = new RegExp(`^(?:${HEADER_NOISE_LINES.join('|')})$`)

const WORD_GAP = '\uffff'

/**
 * pdfjs renders some glyph runs letter-spaced ("G r a b", "K G S"): every glyph is
 * separated by a single space and the original word gaps become runs of 2+ spaces.
 * Detect that shape and collapse it, while leaving normal text (single spaces
 * between real words, e.g. "SB061-BBCC (LALA P") untouched.
 */
export function collapseLetterSpacing (raw: string): string {
  const parts = raw.split(' ').filter(t => t !== '')
  if (parts.length === 0) {
    return ''
  }
  // Genuine letter-spacing splits EVERY glyph (word gaps become 2+ spaces, which drop
  // out as empty tokens). So treat it as letter-spaced only when every token is a
  // single character — otherwise it's normal text ("K F C BISHKEK" stays intact rather
  // than collapsing to "KFCBISHKEK").
  const letterSpaced = parts.every(t => t.length === 1)
  if (!letterSpaced) {
    return raw.replace(/\s+/g, ' ').trim()
  }
  return raw
    .replace(/ {2,}/g, WORD_GAP) // original word gaps → marker
    .replace(/ /g, '') // drop inter-glyph single spaces
    .split(WORD_GAP).join(' ')
    .trim()
}

/** Read the rest of the line printed after a "Label : value" prefix. */
function findField (text: string, label: RegExp): string | null {
  // Wrap the label in a non-capturing group: a multilingual label like "Валюта|Currency"
  // is a top-level alternation, so without grouping the ":\s*(...)" binds to the last
  // alternative only.
  const m = text.match(new RegExp(`(?:${label.source})\\s*:\\s*([^\\n]+)`, label.flags))
  return m != null ? m[1].trim() : null
}

/** Read a money amount printed after a header label, NaN if absent/unparsable. */
function parseHeaderAmount (text: string, label: RegExp): number {
  const field = (findField(text, label) ?? '').replace(/\s+/g, '')
  const m = field.match(/-?\d[\d.,]*/)
  return m != null ? parseFormattedNumber(m[0]) : NaN
}

// A masked card PAN ("402183****0412", also X/•/space-masked) — same shape in every
// statement language.
const MASKED_PAN_RE = /\d{4,6}\s*[*X•·]{2,}\s*\d{4}/i

// Header labels, accepting Russian / Kyrgyz / English wording.
const CARD_LABEL = /Номер карты клиента|Кардардын картасынын номери|Client's Card Number/i
const CREDIT_LIMIT_LABEL = /Сумма установленного лимита|Белгиленген лимиттин суммасы|The amount of the set credit limit/i
const USED_LIMIT_LABEL = /Сумма использованного лимита|Пайдаланылган лимиттин суммасы|The amount of the used credit limit/i
const CURRENCY_LABEL = /Валюта|Currency/i
const PERIOD_LABEL = /(?:Период|Мезгил|Period)/i

export function looksLikeSimbankStatement (text: string): boolean {
  // Identify by the bank brand (present in every language) plus a card number (masked
  // PAN or the labeled card field), rather than the localized "ВЫПИСКА ПО КАРТЕ" title —
  // so ru/ky/en all match.
  const isSimbank = /Simbank/i.test(text) || /Дос-?Кредобанк|Dos-?Credobank/i.test(text)
  return isSimbank && (MASKED_PAN_RE.test(text) || CARD_LABEL.test(text))
}

/**
 * Prefer the labeled card field (avoids grabbing some other masked number, e.g. a
 * sender card); fall back to the first masked-PAN-shaped token in the document.
 */
function parseMaskedPan (text: string): string {
  const cardField = (findField(text, CARD_LABEL) ?? '').replace(/\s+/g, '')
  const fromLabel = cardField.match(MASKED_PAN_RE)?.[0]?.replace(/\s+/g, '') ?? (cardField !== '' ? cardField : null)
  const fromBody = text.match(MASKED_PAN_RE)?.[0]?.replace(/\s+/g, '')
  return fromLabel ?? fromBody ?? ''
}

/**
 * Scan the transaction table: a "DD-MM-YYYY" + "HH:MM:SS" pair starts a row; the
 * lines that follow are its (possibly wrapped) description until the amount/balance
 * tail line. A dated row whose tail can't be read is recorded and then asserted on,
 * so a layout change aborts the import rather than silently dropping a transaction.
 */
function parseTransactionRows (lines: string[], maskedPan: string): SimbankStatementTransaction[] {
  const transactions: SimbankStatementTransaction[] = []
  const seen = new Map<string, number>()
  const skipped: string[] = []

  for (let i = 0; i < lines.length; i++) {
    if (!DATE_RE.test(lines[i]) || i + 1 >= lines.length || !TIME_RE.test(lines[i + 1])) {
      continue
    }
    const date = lines[i]
    const time = lines[i + 1]

    const descParts: string[] = []
    let tail: RegExpMatchArray | null = null
    let j = i + 2
    for (; j < lines.length; j++) {
      const cur = lines[j]
      if (HEADER_NOISE_RE.test(cur)) {
        continue
      }
      // A new row started before we found a tail — give up on this malformed row.
      if (DATE_RE.test(cur) && j + 1 < lines.length && TIME_RE.test(lines[j + 1])) {
        break
      }
      const m = cur.match(ROW_TAIL_RE)
      if (m != null) {
        tail = m
        const descTail = collapseLetterSpacing(m[1])
        if (descTail !== '') {
          descParts.push(descTail)
        }
        break
      }
      descParts.push(collapseLetterSpacing(cur))
    }

    if (tail == null) {
      skipped.push(`${date} ${time}`)
      continue
    }

    const amount = tail[2].replace(/\s+/g, '')
    const balance = tail[4].replace(/\s+/g, '')
    const description = descParts.filter(p => p !== '').join(' ')
    const dateTime = `${date} ${time}`

    // Dedup key excludes the description (the bank localizes it) so the same operation
    // gets the same id across ru/ky/en statements.
    const dupKey = `${dateTime}|${amount}|${balance}`
    const occurrence = seen.get(dupKey) ?? 0
    seen.set(dupKey, occurrence + 1)

    transactions.push({
      date: parseSimbankDate(date, time),
      amount,
      balance,
      description,
      uid: makeTransactionUid(maskedPan, dateTime, amount, balance, occurrence),
      originString: `${dateTime} | ${description} | ${amount} | ${balance}`
    })

    i = j // resume scanning right after this row's tail line
  }

  assert(skipped.length === 0, `Не удалось разобрать ${skipped.length} операц. в выписке Simbank`, skipped)
  assert(transactions.length > 0, 'В выписке Simbank не найдено ни одной операции')
  return transactions
}

/**
 * Own-funds balance = "Баланс после операции" of the latest transaction (that table
 * column is own funds, negative = debt). Language-independent — no header label.
 */
function latestTransactionBalance (transactions: SimbankStatementTransaction[]): number {
  let latest = transactions[0]
  for (const t of transactions) {
    if (t.date >= latest.date) latest = t
  }
  const balance = parseFormattedNumber(latest.balance)
  assert(!isNaN(balance), 'Не удалось определить баланс счёта')
  return balance
}

/**
 * Pure parser: turns the extracted PDF text into an account and its transactions.
 * Kept free of the `pdfjs` binary layer so it can be unit-tested with an inline
 * fixture string.
 */
export function parseStatementText (rawText: string): { account: SimbankStatementAccount, transactions: SimbankStatementTransaction[] } {
  const text = normalizeSpaces(rawText)
  assert(looksLikeSimbankStatement(text), 'Похоже, это не выписка Simbank')

  const maskedPan = parseMaskedPan(text)
  assert(maskedPan !== '', 'Не удалось определить номер карты')

  const instrument = (findField(text, CURRENCY_LABEL) ?? '').replace(/\s+/g, '').match(/[A-Za-z]{3}/)?.[0].toUpperCase() ?? 'KGS'

  const limit = parseHeaderAmount(text, CREDIT_LIMIT_LABEL)
  const creditLimit = !isNaN(limit) && limit > 0 ? limit : null
  const used = parseHeaderAmount(text, USED_LIMIT_LABEL)
  const usedLimit = !isNaN(used) ? used : null

  const periodMatch = text.match(new RegExp(`${PERIOD_LABEL.source}\\s*:\\s*\\d{2}-\\d{2}-\\d{4}\\s*-\\s*(\\d{2}-\\d{2}-\\d{4})`, 'i'))
  const statementDate = periodMatch != null ? parseSimbankDate(periodMatch[1]) : ''

  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '')
  const transactions = parseTransactionRows(lines, maskedPan)

  const account: SimbankStatementAccount = {
    id: maskedPan,
    title: 'Simbank *' + maskedPan.slice(-4),
    balance: latestTransactionBalance(transactions),
    creditLimit,
    usedLimit,
    instrument,
    date: statementDate
  }

  return { account, transactions }
}

/** Parse one or more extracted PDF texts (one per picked file). */
export function parseSimbankStatements (texts: string[]): Array<{ account: SimbankStatementAccount, transactions: SimbankStatementTransaction[] }> {
  const out: Array<{ account: SimbankStatementAccount, transactions: SimbankStatementTransaction[] }> = []
  let lastError: unknown = null
  for (const text of texts) {
    try {
      out.push(parseStatementText(text))
    } catch (e) {
      // A file that IS a Simbank statement but failed to parse means we'd silently drop
      // its transactions — fail the whole import loudly instead. Only tolerate files
      // that simply aren't Simbank statements (so a stray PDF doesn't block the rest).
      if (looksLikeSimbankStatement(normalizeSpaces(text))) {
        throw e
      }
      console.error('[simbank-kg] skipping a file that is not a Simbank statement', e)
      lastError = e
    }
  }
  // If every file failed, surface the error (e.g. "not a Simbank statement").
  if (out.length === 0 && lastError != null) {
    throw lastError
  }
  return out
}
