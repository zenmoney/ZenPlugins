import { generateUUID } from '../../common/utils'
import {
  StatementAccount,
  StatementTransaction,
  ObjectWithAnyProps
} from './models'
import { openWebViewAndInterceptRequest } from '../../common/network'
import { TemporaryError } from '../../errors'
import { parsePdf } from '../../common/pdfUtils'

export async function readPdfTextsSequentially (
  blobs: Blob[],
  readPdf: typeof parsePdf = parsePdf
): Promise<string[]> {
  const pdfStrings: string[] = []
  for (const blob of blobs) {
    const { text } = await readPdf(blob)
    pdfStrings.push(text)
  }
  return pdfStrings
}

async function showHowTo (): Promise<ObjectWithAnyProps> {
  let result
  if (ZenMoney.getData('showHowTo') !== false) {
    const url = 'https://api.zenmoney.app/plugins/eubank/how-to/'
    try {
      result = await openWebViewAndInterceptRequest({
        url,
        intercept: (request) => {
          console.log('Intercepted url: ', request.url)
          return request.url.includes('plugins/eubank/callback/')
        }
      })
      ZenMoney.setData('showHowTo', false)
      ZenMoney.saveData()
    } catch (e) {
      console.debug(e)
    }
  }
  return { shouldPickDocs: result }
}

function isSpacedText (text: string): boolean {
  const sample = text.slice(0, 500)
  const spacedPairs = (sample.match(/\S \S/g) ?? []).length
  const directPairs = (sample.match(/\S\S/g) ?? []).length
  return spacedPairs > directPairs * 2
}

export function normalizeSpacedText (text: string): string {
  if (!isSpacedText(text)) return text
  const placeholder = '<<SEP>>'
  return text.split('\n').map(line => {
    return line
      .replace(/ {2,}/g, placeholder)
      .replace(/ /g, '')
      .replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ')
  }).join('\n')
}

export function isEubankStatement (text: string): boolean {
  const normalized = normalizeSpacedText(text)
  return /Евразийский\s*Банк/i.test(normalized)
}

function cleanPdfText (text: string): string {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, '')
    .replace(/-+\s*\d+\s+из\s+\d+\s*-+/g, '')
    .trim()
}

function parseCardNumber (text: string): string | null {
  const match = text.match(/Номер\s*карты\s*:?\s*(\d{6}\*{6}\d{4})/)
  return match?.[1] ?? null
}

function parseAccountNumber (text: string): string {
  const match = text.match(/Номер\s*сч[её]та\s*:?\s*(KZ[A-Z0-9]+)/)
  assert(match?.[1] != null, 'Can\'t parse account number')
  return match[1]
}

export function parseAccounts (text: string): StatementAccount[] {
  const accountNumber = parseAccountNumber(text)
  const cardNumber = parseCardNumber(text)
  const accounts: StatementAccount[] = []

  const currencyBlocks = text.split(/Валюта\s*сч[её]та\s*:+\s*/)
  for (let i = 1; i < currencyBlocks.length; i++) {
    const block = currencyBlocks[i]
    const instrumentMatch = block.match(/^([A-Z]{3})/)
    if (instrumentMatch == null) continue
    const instrument = instrumentMatch[1]

    const balanceMatches = [...block.matchAll(/Доступно\s+на\s+\d{2}\.\d{2}\.\d{4}\s*([\d.,]+)\s*[₸$€]/g)]
    if (balanceMatches.length === 0) continue
    const lastBalance = balanceMatches.length > 1 ? balanceMatches[1] : balanceMatches[0]
    const balance = parseFloat(lastBalance[1].replace(/\s/g, '').replace(',', '.'))

    accounts.push({
      id: accountNumber,
      balance,
      instrument,
      cardNumber
    })
  }

  assert(accounts.length > 0, 'Can\'t parse any accounts from statement')
  return accounts
}

function parseStatementEndDate (text: string): string {
  const match = text.match(/Период\s*:[\s:]*\d{2}\.\d{2}\.\d{4}\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/)
  assert(match != null, 'Can\'t parse statement end date')
  return `${match[3]}-${match[2]}-${match[1]}T00:00:00.000`
}

const KNOWN_CATEGORIES = [
  'Здоровье и красота',
  'Кафе и рестораны',
  'Интернет покупки',
  'Финансы',
  'Продукты',
  'Путешествия',
  'Покупка',
  'Пополнение',
  'Развлечения',
  'Магазины',
  'Транспорт',
  'Образование',
  'Супермаркеты',
  'Авто',
  'Коммунальные услуги',
  'Связь',
  'Одежда и обувь',
  'Дом и ремонт',
  'Спорт',
  'Услуги'
]

const CURRENCY_PATTERN = '(KZT|USD|EUR|GBP|RUB|CNY|TRY|AED|GEL|THB|JPY|CHF|CAD|AUD)'

function splitCategoryAndDetails (text: string): { category: string, details: string } {
  for (const cat of KNOWN_CATEGORIES) {
    if (text.startsWith(cat)) {
      const rest = text.slice(cat.length).trim()
      return { category: cat, details: rest }
    }
  }
  return { category: '', details: text }
}

export function parseTransactions (text: string, statementUid: string): StatementTransaction[] {
  const cleaned = cleanPdfText(text)

  const headerMatch = cleaned.match(/Номер\s*(?:сч[её]та\s*\/\s*карты|карты\s*\/\s*сч[её]та)/)
  if (headerMatch == null) return []
  const headerIndex = cleaned.indexOf(headerMatch[0])
  const afterHeader = cleaned.slice(headerIndex + headerMatch[0].length)

  const footerMatch = afterHeader.match(/Доступно\s+на\s+\d{2}\.\d{2}\.\d{4}\s*:/)
  const transactionsText = footerMatch != null
    ? afterHeader.slice(0, afterHeader.indexOf(footerMatch[0]))
    : afterHeader

  const joinedRegion = transactionsText.replace(/\s+/g, ' ').trim()

  // Each record: date, optional time (may be torn off by a page break),
  // category + details, operation amount, operation currency,
  // signed settled amount (sum in account currency), source.
  // Whitespace around amount/currency is optional: after normalizing
  // per-character-spaced PDFs these fields can become glued together.
  const txRegex = new RegExp(
    '(\\d{2}\\.\\d{2}\\.\\d{4})\\s+' +
    '(?:(\\d{2}:\\d{2}:\\d{2})\\s+)?' +
    '(.+?)' +
    '\\d[\\d.,]*\\s*' +
    CURRENCY_PATTERN + '\\s*' +
    '([+-][\\d.,]+)\\s*' +
    '(Карта|Счёт)\\s*:\\s*\\*\\*\\s*(\\d+)',
    'g'
  )

  const transactions: StatementTransaction[] = []
  let match: RegExpExecArray | null
  while ((match = txRegex.exec(joinedRegion)) != null) {
    const dateStr = match[1]
    const time = match[2] ?? '00:00:00'
    const categoryAndDetails = match[3].trim()
    const instrument = match[4]
    const signedAmount = match[5]
    const source = match[6]

    const amount = parseFloat(signedAmount.replace(/\s/g, '').replace(',', '.'))
    if (isNaN(amount)) continue

    const dateMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
    if (dateMatch == null) continue
    const isoDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T00:00:00.000`

    const { category, details } = splitCategoryAndDetails(categoryAndDetails)

    transactions.push({
      date: isoDate,
      time,
      category,
      details: details !== '' ? details : categoryAndDetails,
      amount,
      instrument,
      isCardOperation: source === 'Карта',
      originString: match[0],
      statementUid
    })
  }

  return transactions
}

export function parseSinglePdfString (text: string, statementUid?: string): {
  accounts: StatementAccount[]
  transactions: StatementTransaction[]
  statementDate: string
} {
  const uid = statementUid ?? generateUUID()
  const normalized = normalizeSpacedText(cleanPdfText(text))
  console.log('Normalized text:', normalized)
  const accounts = parseAccounts(normalized)
  const transactions = parseTransactions(normalized, uid)
  const statementDate = parseStatementEndDate(normalized)

  const parsedContent = {
    accounts,
    transactions,
    statementDate
  }

  if (typeof statementUid !== 'string') {
    console.log('Pdf successfully parsed', parsedContent)
  }

  return parsedContent
}

export async function parsePdfStatements (): Promise<null | {
  accounts: StatementAccount[]
  transactions: StatementTransaction[]
  statementDate: string
}> {
  await showHowTo()
  const blob = await ZenMoney.pickDocuments(['application/pdf'], true)
  if (blob.length === 0) {
    throw new TemporaryError('Выберите один или несколько файлов в формате .pdf')
  }
  for (const { size, type } of blob) {
    if (type !== 'application/pdf') {
      throw new TemporaryError('Выписка должна быть в расширении .pdf')
    } else if (size >= 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла - 1 мб')
    }
  }
  const pdfStrings = await readPdfTextsSequentially(blob)
  let allAccounts: StatementAccount[] = []
  let allTransactions: StatementTransaction[] = []
  let statementDate = ''

  for (const textItem of pdfStrings) {
    console.log('Raw PDF text:', textItem)
    if (!isEubankStatement(textItem)) {
      throw new TemporaryError('Похоже, это не выписка Евразийского Банка')
    }
    try {
      const parsed = parseSinglePdfString(textItem)
      allAccounts = allAccounts.concat(parsed.accounts)
      allTransactions = allTransactions.concat(parsed.transactions)
      if (parsed.statementDate > statementDate) {
        statementDate = parsed.statementDate
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }
  return { accounts: allAccounts, transactions: allTransactions, statementDate }
}
