import type { HomeCreditLocale, ParsedHeader, StatementTransactionRaw } from './models'
import { detectDepositLocale, parseDepositStatement } from './deposit-parser'

export type { HomeCreditLocale, ParsedHeader, StatementTransactionRaw } from './models'

const DATE_LINE = /^(\d{2})\.(\d{2})\.(\d{4})$/
const TIME_LINE = /^(\d{2}):(\d{2})$/
const AMOUNT_MAIN = /^([-+])\s*((?:\d\s*)+,\d{2})\s*₸/
const MCC_LINE = /^\d{4}$/

interface LocalePatterns {
  operationsSingle: Set<string>
  rewardCashbackLine: string
  bonusesConvertedLine: string
  statementDate: RegExp
  balance: RegExp
  cardNumber: RegExp
}

const LOCALE: Record<HomeCreditLocale, LocalePatterns> = {
  en: {
    operationsSingle: new Set([
      'Purchases and spending',
      'Refills',
      'Outgoing transfers',
      'Refund'
    ]),
    rewardCashbackLine: 'Reward Cash back/Money back',
    bonusesConvertedLine: 'Bonuses converted to Tenge',
    statementDate: /Statement date:\s*(\d{2})\.(\d{2})\.(\d{4})/,
    balance: /Available balance at the time of statement\s*\(\d{2}\.\d{2}\.\d{4}\)\s*[\u2014—-]\s*([\d\s]+,\d{2})\s*₸/i,
    cardNumber: /Card number:\s*(\d{6})\*+(\d{4})/i
  },
  kz: {
    operationsSingle: new Set([
      'Сатып алулар мен шығындар',
      'Толықтыру',
      'Шығыс аударымдар',
      'Refund',
      'Қайтару'
    ]),
    rewardCashbackLine: 'Бонустар Кэшбек/Манибек',
    bonusesConvertedLine: 'Теңгеге аударылған бонустар',
    statementDate: /Үзінді көшірме күні:\s*(\d{2})\.(\d{2})\.(\d{4})/,
    balance: /Үзінді көшірме берілген күн\s*\(\d{2}\.\d{2}\.\d{4}\)\s*бойынша қолжетімді қалдық\s*[\u2014—-]\s*([\d\s]+,\d{2})\s*₸/i,
    cardNumber: /Карточка нөмірі:\s*(\d{6})\*+(\d{4})/i
  },
  ru: {
    operationsSingle: new Set([
      'Покупки и траты',
      'Пополнения',
      'Исходящие переводы',
      'Refund',
      'Возврат'
    ]),
    rewardCashbackLine: 'Зачисление бонусов',
    bonusesConvertedLine: 'Переведённые в тенге бонусы',
    statementDate: /Дата выписки:\s*(\d{2})\.(\d{2})\.(\d{4})/,
    balance: /Доступный остаток на момент выписки\s*\(\d{2}\.\d{2}\.\d{4}\)\s*[\u2014—-]\s*([\d\s]+,\d{2})\s*₸/i,
    cardNumber: /Номер карточки:\s*(\d{6})\*+(\d{4})/i
  }
}

export function detectLocale (text: string): HomeCreditLocale {
  if (/Келісімшарт нөмірі:\s*\d/i.test(text) || /дебет картасы бойынша\s+\d{2}\.\d{2}\.\d{4}/i.test(text)) {
    return 'kz'
  }
  if (/Номер договора:\s*\d/i.test(text) && /по дебетовой карте за период с/i.test(text)) {
    return 'ru'
  }
  return 'en'
}

export function detectStatementKind (text: string): 'card' | 'deposit' {
  if (/Выписка по банковскому счету/i.test(text)) {
    return 'deposit'
  }
  if (/Банктік шот бойынша/i.test(text) && !/дебет картасы бойынша/i.test(text)) {
    return 'deposit'
  }
  if (/Капитализация по вкладу|Депозит бойынша капиталдандыру/i.test(text)) {
    return 'deposit'
  }
  return 'card'
}

export function isHomeCreditStatement (text: string): boolean {
  const n = text.replace(/\s+/g, ' ')
  if (!/IBAN:\s*KZ/i.test(n)) {
    return false
  }
  const enStmt = /Contract number:/i.test(n) && /from debit card for the period/i.test(n)
  const kzStmt = /Келісімшарт нөмірі:/i.test(n) && /дебет картасы бойынша/i.test(n)
  const ruStmt = /Номер договора:/i.test(n) && /по дебетовой карте за период с/i.test(n)
  const depositRu = /Выписка по банковскому счету/i.test(n)
  const depositKz = /Банктік шот бойынша/i.test(n) && !/дебет картасы бойынша/i.test(n)
  const depositStmt = depositRu || depositKz || /Капитализация по вкладу/i.test(n)
  if (!enStmt && !kzStmt && !ruStmt && !depositStmt) {
    return false
  }
  const bankOk = /Home Credit Bank|INLMKZKA|ForteBank|«Home Credit Bank»\s+АҚ|БСК|ДБ АО/i.test(n)
  const cardOk = /Card number:\s*\d{6}\*+|Карточка нөмірі:\s*\d{6}\*+|Номер карточки:\s*\d{6}\*+/i.test(n)
  return bankOk || cardOk
}

export function stripPdfNoise (text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.includes('Deprecated API usage:'))
    .join('\n')
}

function isFooterLine (line: string): boolean {
  return /«Home Credit Bank»|Home Credit Bank.*ForteBank|BIC INLMKZKA|БИК\s*INLMKZKA|БСК\s*INLMKZKA|The operation is in the block/i.test(line)
}

export function findFirstTransactionLineIndex (lines: string[]): number {
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i].trim()
    const b = lines[i + 1].trim()
    if (DATE_LINE.test(a) && TIME_LINE.test(b)) {
      return i
    }
  }
  return -1
}

function skipUntilNextDate (lines: string[], i: number): number {
  while (i < lines.length && !DATE_LINE.test(lines[i].trim())) {
    i++
  }
  return i
}

function parseMerchantAndOperation (
  lines: string[],
  start: number,
  locale: HomeCreditLocale
): { operation: string, nextIndex: number, merchantLines: string[] } {
  const loc = LOCALE[locale]
  const merchantLines: string[] = []
  let i = start
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line === '') {
      i++
      continue
    }
    if (DATE_LINE.test(line)) {
      break
    }
    if (isFooterLine(line)) {
      i++
      continue
    }
    if (line === loc.rewardCashbackLine) {
      merchantLines.push(line)
      i++
      if (i < lines.length && lines[i].trim() === loc.bonusesConvertedLine) {
        return { operation: loc.bonusesConvertedLine, nextIndex: i + 1, merchantLines }
      }
      continue
    }
    if (line === loc.bonusesConvertedLine) {
      return { operation: loc.bonusesConvertedLine, nextIndex: i + 1, merchantLines }
    }
    if (loc.operationsSingle.has(line)) {
      return { operation: line, nextIndex: i + 1, merchantLines }
    }
    merchantLines.push(line)
    i++
  }
  assert(false, 'Home Credit statement: expected operation type (Purchases and spending, Refills, …)', lines.slice(start, start + 8).join('\n'))
  throw new Error('Unreachable')
}

export function parseMainAmountFromLine (line: string): string {
  const m = line.match(AMOUNT_MAIN)
  assert(m != null, 'Home Credit statement: can not parse amount', line)
  return `${m[1]} ${m[2].replace(/\s/g, ' ').trim()} ₸`
}

function toIsoDate (dd: string, mm: string, yyyy: string): string {
  return `${yyyy}-${mm}-${dd}T00:00:00.000`
}

export function parseStatementDate (text: string, locale: HomeCreditLocale): string {
  const m = text.match(LOCALE[locale].statementDate)
  assert(m != null, 'Home Credit statement: can not parse statement date')
  return toIsoDate(m[1], m[2], m[3])
}

export function parseIban (text: string): string {
  const m = text.match(/IBAN:\s*([A-Z0-9]+)/i)
  assert(m != null, 'Home Credit statement: can not parse IBAN')
  return m[1].replace(/\s/g, '')
}

export function parseCardLast4 (text: string, locale: HomeCreditLocale): string {
  const m = text.match(LOCALE[locale].cardNumber)
  assert(m != null, 'Home Credit statement: can not parse card number')
  return m[2]
}

export function parseBalance (text: string, locale: HomeCreditLocale): number {
  const m = text.match(LOCALE[locale].balance)
  assert(m != null, 'Home Credit statement: can not parse balance')
  return parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
}

export function parseHeader (text: string, locale: HomeCreditLocale): ParsedHeader {
  return {
    iban: parseIban(text),
    cardLast4: parseCardLast4(text, locale),
    statementDateIso: parseStatementDate(text, locale),
    balance: parseBalance(text, locale),
    locale,
    statementKind: 'card'
  }
}

export function parseTransactionsFromLines (lines: string[], statementUid: string, locale: HomeCreditLocale): StatementTransactionRaw[] {
  const start = findFirstTransactionLineIndex(lines)
  assert(start >= 0, 'Home Credit statement: no transactions block found')

  const out: StatementTransactionRaw[] = []
  let i = start
  while (i < lines.length) {
    let line = lines[i].trim()
    if (isFooterLine(line)) {
      i = skipUntilNextDate(lines, i + 1)
      continue
    }
    if (!DATE_LINE.test(line)) {
      i++
      continue
    }
    const dm = line.match(DATE_LINE)
    assert(dm != null)
    const dateIso = toIsoDate(dm[1], dm[2], dm[3])
    i++
    if (i >= lines.length) {
      break
    }
    line = lines[i].trim()
    if (TIME_LINE.test(line)) {
      i++
    }
    const { operation, nextIndex, merchantLines } = parseMerchantAndOperation(lines, i, locale)
    i = nextIndex
    if (i >= lines.length) {
      break
    }
    const amountLine = lines[i].trim()
    assert(AMOUNT_MAIN.test(amountLine), 'Home Credit statement: expected amount line', amountLine)
    const amountStr = parseMainAmountFromLine(amountLine)
    i++

    if (i < lines.length && MCC_LINE.test(lines[i].trim())) {
      i++
    }

    while (i < lines.length) {
      const cur = lines[i].trim()
      if (DATE_LINE.test(cur)) {
        break
      }
      if (isFooterLine(cur)) {
        i = skipUntilNextDate(lines, i + 1)
        break
      }
      i++
    }

    const merchantTitle = merchantLines.join(' ').trim()
    const description = [merchantTitle, operation].filter((s) => s !== '').join(' — ')
    const originString = [dateIso, merchantTitle, operation, amountLine].join('\n')

    out.push({
      hold: false,
      date: dateIso,
      originalAmount: null,
      amount: amountStr,
      description,
      statementUid,
      originString,
      operation
    })
  }

  return out
}

export function parseStatementText (text: string, statementUid: string): { header: ParsedHeader, transactions: StatementTransactionRaw[] } {
  const cleaned = stripPdfNoise(text)
  if (detectStatementKind(cleaned) === 'deposit') {
    const depLocale = detectDepositLocale(cleaned)
    return parseDepositStatement(cleaned, statementUid, depLocale)
  }
  const lines = cleaned.split('\n').map((l) => l.trimEnd())
  const locale = detectLocale(cleaned)
  const header = parseHeader(cleaned, locale)
  const transactions = parseTransactionsFromLines(lines, statementUid, locale)
  return {
    header,
    transactions
  }
}
