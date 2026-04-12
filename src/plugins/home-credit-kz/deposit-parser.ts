import type { HomeCreditLocale, ParsedHeader, StatementTransactionRaw } from './models'

const DATE_LINE = /^(\d{2})\.(\d{2})\.(\d{4})$/

function toIsoDate (dd: string, mm: string, yyyy: string): string {
  return `${yyyy}-${mm}-${dd}T00:00:00.000`
}

function parseMoneyToken (s: string): number {
  const t = s.replace(/\s/g, '')
  if (t === '' || t === '-') {
    return 0
  }
  if (t.includes(',')) {
    return parseFloat(t.replace(/,/g, ''))
  }
  return parseFloat(t)
}

function parseFourNumberLine (line: string): [number, number, number, number] | null {
  const m = line.trim().match(/^([\d\s,.-]+)\s+([\d\s,.-]+)\s+([\d\s,.-]+)\s+([\d\s,.-]+)$/)
  if (m == null) {
    return null
  }
  return [parseMoneyToken(m[1]), parseMoneyToken(m[2]), parseMoneyToken(m[3]), parseMoneyToken(m[4])]
}

function tryParseSingleLineDeposit (line: string): { dateIso: string, description: string, expense: number, income: number } | null {
  const four = line.match(/\s+([\d\s,.-]+)\s+([\d\s,.-]+)\s+([\d\s,.-]+)\s+([\d\s,.-]+)\s*$/)
  if (four == null) {
    return null
  }
  const rest = line.slice(0, four.index).trim()
  const dm = rest.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(.+)$/)
  if (dm == null) {
    return null
  }
  return {
    dateIso: toIsoDate(dm[1], dm[2], dm[3]),
    description: dm[4].trim(),
    expense: parseMoneyToken(four[1]),
    income: parseMoneyToken(four[2])
  }
}

function formatKztAmount (signed: number): string {
  const sign = signed >= 0 ? '+' : '-'
  const abs = Math.abs(signed)
  const parts = abs.toFixed(2).split('.')
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${sign} ${intPart},${parts[1]} ₸`
}

function isFooterOrTotalLine (line: string): boolean {
  const t = line.trim()
  return /^Итог:|^Барлығы:|^Удержание|^Усталған|^Төлем|^Возврат|^0\s*$/i.test(t) ||
    t.includes('ИПН') ||
    t.includes('ЖТС')
}

export function detectDepositLocale (text: string): 'ru' | 'kz' {
  if (/Выписка по банковскому счету|Капитализация по вкладу/i.test(text)) {
    return 'ru'
  }
  return 'kz'
}

export function parseDepositIban (text: string): string {
  const m = text.match(/\b(KZ[A-Z0-9]{18})\b/)
  assert(m != null, 'Home Credit deposit: IBAN not found')
  return m[1]
}

function parseDdMmYyyyToIso (d: string): string {
  return toIsoDate(d.slice(0, 2), d.slice(3, 5), d.slice(6, 10))
}

function parseDepositHeaderRu (text: string): {
  productTitle: string
  balance: number
  statementDateIso: string
  periodStartIso: string
  periodEndIso: string
} {
  const block = text.match(
    /(?:IBAN:\s*)?(KZ[A-Z0-9]{18})\s*\n([^\n]+)\n([\d\s,.]+)\nKZT\n(\d{2}\.\d{2}\.\d{4})\n(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})/m
  )
  assert(block != null, 'Home Credit deposit (ru): header block not found')
  const productTitle = block[2].trim()
  const balance = parseMoneyToken(block[3])
  const statementDateIso = parseDdMmYyyyToIso(block[4])
  const periodStartIso = parseDdMmYyyyToIso(block[5])
  const periodEndIso = parseDdMmYyyyToIso(block[6])
  return { productTitle, balance, statementDateIso, periodStartIso, periodEndIso }
}

/** Dates after KZT: statement, then period start + end on the next line (common KZ layout). */
function parseKztHeaderDates (text: string): { statement: string, periodStart: string, periodEnd: string } | null {
  const m = text.match(/KZT\s*\n(\d{2}\.\d{2}\.\d{4})\s*\n(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})/m)
  if (m != null) {
    return { statement: m[1], periodStart: m[2], periodEnd: m[3] }
  }
  return null
}

/** Period in header: before first operation line (avoids picking dates from the table). */
function depositHeaderSlice (text: string): string {
  const m = text.match(/(?:Капитализация по вкладу|Депозит бойынша капиталдандыру)/i)
  const idx = m?.index
  return (idx != null && idx > 0) ? text.slice(0, idx) : text
}

/** Period as "DD.MM.YYYY - DD.MM.YYYY" or two dates on one line (Kazakh/Russian header). */
function parsePeriodFromText (text: string): { start: string, end: string } | null {
  const head = depositHeaderSlice(text)
  const kzPeriod = head.match(/(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})\s*аралығындағы/i)
  if (kzPeriod != null) {
    return { start: kzPeriod[1], end: kzPeriod[2] }
  }
  const ruPeriod = head.match(/период\s+с\s+(\d{2}\.\d{2}\.\d{4})\s+по\s+(\d{2}\.\d{2}\.\d{4})/i)
  if (ruPeriod != null) {
    return { start: ruPeriod[1], end: ruPeriod[2] }
  }
  const dash = head.match(/(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})/)
  if (dash != null) {
    return { start: dash[1], end: dash[2] }
  }
  const pair = head.match(/(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})/)
  if (pair != null) {
    return { start: pair[1], end: pair[2] }
  }
  return null
}

function parseDepositHeaderKz (text: string): {
  productTitle: string
  balance: number
  statementDateIso: string
  periodStartIso: string
  periodEndIso: string
} {
  const block = text.match(
    /(?:IBAN:\s*)?(KZ[A-Z0-9]{18})\s*\n([^\n]+)\n([\d\s,.]+)\nKZT\n(\d{2}\.\d{2}\.\d{4})\n(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})/m
  )
  if (block != null) {
    const productTitle = block[2].trim()
    const balance = parseMoneyToken(block[3])
    const statementDateIso = parseDdMmYyyyToIso(block[4])
    const periodStartIso = parseDdMmYyyyToIso(block[5])
    const periodEndIso = parseDdMmYyyyToIso(block[6])
    return { productTitle, balance, statementDateIso, periodStartIso, periodEndIso }
  }
  const balanceM = text.match(/Күні\s*\n\s*([\d\s,.]+)/m) ??
    text.match(/\n([\d\s,.]+)\s*\n\s*Ағымдағы қалдық/m)
  assert(balanceM != null, 'Home Credit deposit (kz): balance not found')
  const balance = parseMoneyToken(balanceM[1])

  const kztTriple = parseKztHeaderDates(text)
  const stmtOnly = text.match(/KZT\s*\n(\d{2}\.\d{2}\.\d{4})/m)
  const period = parsePeriodFromText(text)

  assert(
    kztTriple != null || (stmtOnly != null && period != null),
    'Home Credit deposit (kz): can not parse statement / period dates'
  )

  let statementD: string
  let periodStartD: string
  let periodEndD: string
  if (kztTriple != null) {
    statementD = kztTriple.statement
    periodStartD = kztTriple.periodStart
    periodEndD = kztTriple.periodEnd
  } else if (stmtOnly != null && period != null) {
    statementD = stmtOnly[1]
    periodStartD = period.start
    periodEndD = period.end
  } else {
    assert(false, 'Home Credit deposit (kz): can not parse statement / period dates')
    throw new Error('Unreachable')
  }

  const productTitle = /\bПростой\b/.test(text) ? 'Простой' : 'Депозит'
  return {
    productTitle,
    balance,
    statementDateIso: parseDdMmYyyyToIso(statementD),
    periodStartIso: parseDdMmYyyyToIso(periodStartD),
    periodEndIso: parseDdMmYyyyToIso(periodEndD)
  }
}

export function parseDepositTransactions (lines: string[], statementUid: string): StatementTransactionRaw[] {
  const out: StatementTransactionRaw[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line === '' || isFooterOrTotalLine(line)) {
      i++
      continue
    }
    if (DATE_LINE.test(line) && line.length === 10 && lines[i + 1]?.trim() === 'Кезең') {
      i += 2
      const skipFrom = i
      while (i < lines.length && i - skipFrom < 120) {
        const t = lines[i].trim()
        if (t === '') {
          i++
          continue
        }
        if (tryParseSingleLineDeposit(t) != null) {
          break
        }
        if (DATE_LINE.test(t) && t.length === 10 && lines[i + 1]?.trim() !== 'Кезең') {
          break
        }
        i++
      }
      continue
    }
    const single = tryParseSingleLineDeposit(line)
    if (single != null) {
      const signed = single.income - single.expense
      if (signed !== 0 || single.description.length > 0) {
        out.push({
          hold: false,
          date: single.dateIso,
          originalAmount: null,
          amount: formatKztAmount(signed),
          description: single.description,
          statementUid,
          originString: line,
          operation: single.description
        })
      }
      i++
      continue
    }
    if (!DATE_LINE.test(line)) {
      i++
      continue
    }
    if (line.length === 10 && DATE_LINE.test(line)) {
      const dateIso = toIsoDate(line.slice(0, 2), line.slice(3, 5), line.slice(6, 10))
      i++
      const descParts: string[] = []
      while (i < lines.length) {
        const L = lines[i].trim()
        if (L === '') {
          i++
          continue
        }
        if (DATE_LINE.test(L) && L.length === 10) {
          break
        }
        const four = parseFourNumberLine(L)
        if (four != null) {
          const signed = four[1] - four[0]
          const description = descParts.join(' ').trim()
          out.push({
            hold: false,
            date: dateIso,
            originalAmount: null,
            amount: formatKztAmount(signed),
            description,
            statementUid,
            originString: [dateIso, description, L].join('\n'),
            operation: description
          })
          i++
          break
        }
        descParts.push(L)
        i++
      }
      continue
    }
    i++
  }
  return out
}

export function findDepositTableStart (lines: string[]): number {
  const multiline = lines.findIndex((l, idx) => {
    const t = l.trim()
    return DATE_LINE.test(t) && t.length === 10 && /Депозит|капиталдандыру/i.test(lines[idx + 1] ?? '')
  })
  if (multiline >= 0) {
    return multiline
  }
  const single = lines.findIndex((l) => {
    const t = l.trim()
    return /^\d{2}\.\d{2}\.\d{4}\s+/.test(t) &&
      (/Капитализация|Перевод|Пополнение/i.test(t) || /\d[\d\s,.]+\s+\d[\d\s,.]+\s+\d[\d\s,.]+\s+\d[\d\s,.]+\s*$/.test(t))
  })
  return single >= 0 ? single : 0
}

export function parseDepositStatement (
  text: string,
  statementUid: string,
  locale: 'ru' | 'kz'
): { header: ParsedHeader, transactions: StatementTransactionRaw[] } {
  const cleaned = text.split('\n').filter((ln) => !ln.includes('Deprecated API usage:')).join('\n')
  const iban = parseDepositIban(cleaned)
  const lines = cleaned.split('\n').map((l) => l.trimEnd())
  const headerInner = locale === 'ru' ? parseDepositHeaderRu(cleaned) : parseDepositHeaderKz(cleaned)
  const start = findDepositTableStart(lines)
  const slice = start >= 0 ? lines.slice(start) : lines
  const transactions = parseDepositTransactions(slice, statementUid)
  const hcLocale: HomeCreditLocale = locale
  const header: ParsedHeader = {
    iban,
    cardLast4: iban.slice(-4),
    statementDateIso: headerInner.statementDateIso,
    balance: headerInner.balance,
    locale: hcLocale,
    statementKind: 'deposit',
    productTitle: headerInner.productTitle,
    depositPeriodStart: headerInner.periodStartIso,
    depositPeriodEnd: headerInner.periodEndIso
  }
  return { header, transactions }
}
