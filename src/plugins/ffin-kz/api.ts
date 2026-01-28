import { generateUUID } from '../../common/utils'
import { StatementTransaction, ObjectWithAnyProps } from './models'
import { Account, AccountOrCard, AccountType, DepositOrLoan } from '../../types/zenmoney'
import { openWebViewAndInterceptRequest } from '../../common/network'
import { TemporaryError } from '../../errors'
import { parsePdf } from '../../common/pdfUtils'

function getRegexpMatch (regExps: RegExp[], text: string, flags?: string): RegExpMatchArray | null {
  let match = null
  regExps.find((regExp: RegExp) => {
    match = text.match(new RegExp(regExp, flags))
    return match !== null
  })
  return match
}

function parseAccountIdAndBalance (text: string): { accountId: string, balance: number } {
  // Валюта счета:KZT, USD, EUR, RUB, CNY, TRY, AED Дата:01.01.2025 Номер счётаВалютаОстаток KZ123456789012345KZTKZT19,455.00 ₸
  const match = getRegexpMatch([
    /([A-Z]{2}\d{2}[A-Z0-9]{13})KZT\s+KZT\s+([0-9,.\s]+)/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse accountId from account statement')
  assert(typeof match?.[2] === 'string', 'Can\'t parse balance from account statement')
  return {
    accountId: match[1],
    balance: parseFloat(match[2].replace(/\s/g, '').replace(',', ''))
  } // KZ123456789012345, 19,455.00 ₸
}

function parseDateFromPdfText (text: string): string {
  const match = text.match(/^(\d{2}).(\d{2}).(\d{2,4})/)
  assert(match !== null, 'Can\'t parse date from pdf string', text)
  return `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2]}-${match[1]}T00:00:00.000`
}

function normalizeNumber (value: string | null | undefined): number | null {
  if (value == null) return null
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  return normalized === '' ? null : parseFloat(normalized)
}

function parseAccountTitle (text: string): string {
  // Пример: Выписка по карте Deposit Card
  return text.match(/Выписка по карте (.*)/)?.[1] ?? ''
}

function parseCardNumber (text: string): string {
  // Пример: Номер карты:**1234
  return text.match(/Номер карты:\s*\*\*(\d{4})/)?.[1] ?? ''
}

function parseTransactions (text: string, statementUid: string): StatementTransaction[] {
  // Регулярка для строк транзакций: дата, сумма (с + или -), валюта (символ и/или код), далее описание
  const baseRegexp = /^(\d{2}\.\d{2}\.\d{4}\s*[+-]\s*[\d.,]+\s*[₸$€£¥₺₽]?\s*[A-Z]{3} .+)$/gm

  const transactionStrings = text.match(baseRegexp)

  if ((transactionStrings == null) || transactionStrings.length === 0) {
    return []
  }

  return transactionStrings.map((str) => {
    const match = str.match(/^(\d{2}\.\d{2}\.\d{4})\s?([-+]\s?[\d.,]+)\s?([₸$€£¥₺₽])?\s?([A-Z]{3})\s?([а-яА-ЯA-Za-z\s"“”'‘’]+)?\s?(.+)?$/)
    // const currency = match?.[3] ?? ''
    const currencyCode = match?.[4] ?? ''

    assert(match !== null, `Can't parse transaction: ${str}`)

    const date = parseDateFromPdfText(match[1])
    const amount = match[2] !== undefined ? match[2].replace(/\s/g, '').replace(',', '') : '' // Убираем пробелы и запятые
    let description = `${match[5] !== undefined ? match[5] : ''}${match[6] !== undefined ? match[6] : ''}`.trim() // Объединение полей для полного описания

    // Удаление ключевых слов, таких как "Покупка", и всех кавычек
    description = description.replace(/(Покупка|Пополнение|Перевод|Возврат)/gi, '').replace(/["'“”‘’]/g, '').trim()

    const originString = match[0]

    return {
      hold: false,
      date,
      originalAmount: amount + ' ' + currencyCode,
      amount,
      description,
      statementUid,
      originString
    }
  })
}

export interface ExchangeRate {
  buyRate: number
  sellRate: number
}

interface ExchangeRatesResponse {
  success: boolean
  message: string | null
  data: {
    cash: Array<Omit<ExchangeRate, 'buyRate' | 'sellRate'> & { buyRate: string, sellRate: string, buyCode: string, sellCode: string }>
    mobile: Array<Omit<ExchangeRate, 'buyRate' | 'sellRate'> & { buyRate: string, sellRate: string, buyCode: string, sellCode: string }>
    non_cash: Array<Omit<ExchangeRate, 'buyRate' | 'sellRate'> & { buyRate: string, sellRate: string, buyCode: string, sellCode: string }>
  }
  status: number
}

async function parseJsonResponse (response: Response): Promise<ExchangeRatesResponse | null> {
  try {
    if (typeof (response as unknown as { json?: unknown }).json === 'function') {
      return await (response as unknown as { json: () => Promise<ExchangeRatesResponse> }).json()
    }
  } catch (e) {}
  try {
    const text = typeof (response as unknown as { text?: unknown }).text === 'function'
      ? await (response as unknown as { text: () => Promise<string> }).text()
      : (response as unknown as { text?: unknown }).text
    if (typeof text === 'string' && text.trim() !== '') {
      return JSON.parse(text) as ExchangeRatesResponse
    }
  } catch (e) {}
  const body = (response as unknown as { body?: unknown }).body
  if (body !== null && body !== undefined && typeof body === 'object') {
    return body as ExchangeRatesResponse
  }
  return null
}

export async function getMobileExchangeRates (): Promise<Record<string, ExchangeRate>> {
  const mobileRatesMap: Record<string, ExchangeRate> = {}

  const response = await fetch('https://bankffin.kz/api/exchange-rates/getRates')
  if (!response.ok) {
    return mobileRatesMap
  }
  const json = await parseJsonResponse(response)
  if (json == null) {
    return mobileRatesMap
  }
  if (!json.success || !Array.isArray(json.data?.mobile) || json.data.mobile.length === 0) {
    return mobileRatesMap
  }

  for (const rate of json.data.mobile) {
    const key = `${rate.buyCode}_${rate.sellCode}`
    mobileRatesMap[key] = {
      buyRate: parseFloat(rate.buyRate.replace(',', '.')),
      sellRate: parseFloat(rate.sellRate.replace(',', '.'))
    }
  }

  return mobileRatesMap
}

export function parseSinglePdfString (text: string, statementUid?: string): { account: AccountOrCard, transactions: StatementTransaction[] } {
  const { accountId, balance } = parseAccountIdAndBalance(text)
  const rawAccount: AccountOrCard = {
    balance,
    id: accountId,
    instrument: 'KZT',
    title: parseAccountTitle(text),
    type: AccountType.ccard,
    savings: false,
    syncIds: parseCardNumber(text) !== '' ? [parseCardNumber(text)] : [accountId]
  }
  const rawTransactions = parseTransactions(text, statementUid ?? generateUUID())
  const parsedContent = {
    account: rawAccount,
    transactions: rawTransactions
  }
  if (typeof statementUid !== 'string') {
    console.log('PDF successfully parsed', parsedContent)
  }
  return parsedContent
}

function prepareCardStatementText (text: string): string {
  // Разделяем на части: Дата Сумма Валюта Операция Детали
  // Ищем первую строку, где начинается таблица с транзакциями (по заголовку "Дата Сумма Валюта Операция Детали")
  const splitPoint = text.search(/^Дата\s+Сумма\s+Валюта\s+Операция\s+Детали/m)
  if (splitPoint === -1) {
    return text
  }
  const header = text.slice(0, splitPoint).trim()
  const transactions = text.slice(splitPoint).trim()

  // Обработка транзакций
  // Cначала разбиваем на строки по датам, затем чистим каждую строку отдельно
  // Удаляем служебный текст и заголовок таблицы
  const cleanedTransactions = transactions
    .replace(/Подлинность справки можете проверить\nпросканировав QR-код или перейдите по ссылке:\nhttps:\/\/bankffin\.kz\/ru\/check-receipt.*/g, '')
    .replace(/^Дата\s+Сумма\s+Валюта\s+Операция\s+Детали\s*/gm, '')

  const transactionLines = cleanedTransactions
    .split(/(?=\d{2}\.\d{2}\.\d{4}\s*[-+]\s*[\d.,]+\s*[₸$€£¥₺₽]?)/) // Разделяем по дате и сумме
    .map(line =>
      line
        .replace(/([а-яА-Яa-zA-Z.,])\n([а-яА-Яa-zA-Z])/g, '$1 $2') // Удаление переносов строк внутри деталей
        .replace(/-\n\s*/g, '-') // Удаление переноса строки после дефиса
        .replace(/\n(?=(Плательщик:|Получатель:|Назначение:|Вкладчик:))/g, ' ') // Объединение строк, если следующая строка начинается с ключевым словом
        .replace(/\n/g, ' ') // Удаление всех остальных переносов строк
        .replace(/\s{2,}/g, ' ') // Удаление двойных пробелов
        .trim()
    )
    .filter(line => line.length > 0)
  const transactionsText = transactionLines.join('\n')

  return `${header}\n\n${transactionsText}`
}

function calculateEndDateOffset (startDate: Date | null, endDate: Date | null): { interval: 'day' | 'month' | 'year', offset: number } {
  if (startDate == null || endDate == null) {
    return { interval: 'month', offset: 12 }
  }
  const diffMs = endDate.getTime() - startDate.getTime()
  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
  const diffMonths = Math.max(1, Math.round(diffDays / 30.44))
  const diffYears = Math.max(1, Math.round(diffDays / 365.25))

  if (diffYears >= 1 && Math.abs(diffYears - diffDays / 365.25) < 0.2) {
    return { interval: 'year', offset: diffYears }
  }
  if (diffMonths >= 1) {
    return { interval: 'month', offset: diffMonths }
  }
  return { interval: 'day', offset: diffDays }
}

export function parseDepositPdfString (text: string, statementUid?: string): { account: DepositOrLoan, transactions: StatementTransaction[] } {
  const uid = statementUid ?? generateUUID()
  const accountIdMatch = text.match(/Номер счета:\s*([A-Z0-9]+)/i)
  assert(accountIdMatch?.[1] != null, 'Не удалось найти номер счета во выписке по депозиту')
  const accountId = accountIdMatch[1]

  const instrumentFromId = accountId.match(/([A-Z]{3})$/)?.[1]
  const instrumentFromLine = text.match(/Валюта счета:\s*([A-Z]{3})/i)?.[1]
  const instrument = (instrumentFromId ?? instrumentFromLine ?? 'KZT').toUpperCase()

  const endOfMonthBalance = normalizeNumber(text.match(/Остаток на конец месяца:\s*([\d\s.,]+)/i)?.[1])
  const currentBalance = normalizeNumber(text.match(/Текущий остаток:\s*([\d\s.,]+)/i)?.[1])
  const balance = endOfMonthBalance ?? currentBalance ?? null
  const startBalance = normalizeNumber(text.match(/Остаток на начало периода:\s*([\d\s.,]+)/i)?.[1]) ?? balance ?? 0

  const titleMatch = text.match(/Выписка по депозиту\s+["“]?([^"\n]+)["”]?\s+за период/i)
  const title = titleMatch?.[1]?.trim() ?? 'Deposit'

  const percent = normalizeNumber(text.match(/Эффективная ставка:\s*([\d.,]+)/i)?.[1])

  const startDateStr = text.match(/Дата открытия:\s*(\d{2}\.\d{2}\.\d{4})/i)?.[1]
  const endDateStr = text.match(/Дата завершения:\s*(\d{2}\.\d{2}\.\d{4})/i)?.[1]
  const startDate = startDateStr != null ? new Date(parseDateFromPdfText(startDateStr)) : null
  const endDate = endDateStr != null ? new Date(parseDateFromPdfText(endDateStr)) : null
  const { interval: endDateOffsetInterval, offset: endDateOffset } = calculateEndDateOffset(startDate, endDate)

  const depositAccount: DepositOrLoan = {
    id: accountId,
    type: AccountType.deposit,
    title,
    instrument,
    syncIds: [accountId],
    balance,
    startDate: startDate ?? new Date(),
    startBalance,
    capitalization: true,
    percent,
    endDateOffsetInterval,
    endDateOffset,
    payoffInterval: 'month',
    payoffStep: 1
  }

  const tableHeader = /Дата[\s\r\n]+Описание\s+операции[\s\r\n]+Сумма[\s\r\n]+Эквивалент\s+в\s+KZT/i
  const headerMatch = tableHeader.exec(text)
  const equivalentHeaderIndex = text.search(/Эквивалент\s+в\s+KZT/i)
  const tableStartIndex = headerMatch?.index ?? equivalentHeaderIndex
  const tableText = tableStartIndex >= 0 ? text.slice(tableStartIndex + (headerMatch?.[0].length ?? 0)) : text
  const transactions: StatementTransaction[] = []
  const cleanedTableText = tableText
    .replace(tableHeader, '')
    .replace(/Дата\s+Описание\s+операции\s+Сумма\s+Эквивалент\s+в\s+KZT/gi, '')
    .trim()
  const rowRegexp = /(?:^|\n)(\d{2}\.\d{2}\.\d{4})\s+([\s\S]*?)(?=(?:\n\d{2}\.\d{2}\.\d{4}\b)|$)/g
  for (const match of cleanedTableText.matchAll(rowRegexp)) {
    const [, dateStr, body] = match
    const normalizedBody = body
      .replace(/Подлинность справки можете проверить[\s\S]*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
    const sanitizedBody = normalizedBody
      .replace(/[−–—]/g, '-')
      .replace(/[＋]/g, '+')
    const amountMatches = [...sanitizedBody.matchAll(/(?:^|\s)([+-]?\s*[\d\s.,]+)\s*(\$|€|₸|т|[A-Z]{3})/gi)]
    if (amountMatches.length === 0) {
      console.warn('Не удалось распарсить строку депозита', `${dateStr} ${normalizedBody}`)
      continue
    }
    const currencyToInstrument = (currency: string): string => {
      const upper = currency.toUpperCase()
      if (upper === '₸' || upper === 'Т' || upper === 'KZT') return 'KZT'
      if (upper === '$' || upper === 'USD') return 'USD'
      if (upper === '€' || upper === 'EUR') return 'EUR'
      return upper
    }
    const amountMatch = [...amountMatches].reverse()
      .find((amountMatch) => currencyToInstrument(amountMatch[2]) === instrument) ??
      amountMatches[amountMatches.length - 1]
    const amountStr = amountMatch[1]
    const normalizedAmount = amountStr.replace(/\s/g, '').replace(',', '.')
    let description = sanitizedBody
    for (let i = 0; i < 2; i += 1) {
      const trailingAmount = description.match(/(?:^|\s)([+-]?\s*[\d\s.,]+)\s*(\$|€|₸|т|[A-Z]{3})\s*$/i)
      if (trailingAmount == null) break
      description = description.slice(0, trailingAmount.index).trim()
    }
    description = description.replace(/\s+/g, ' ').trim()
    transactions.push({
      hold: false,
      date: parseDateFromPdfText(dateStr),
      originalAmount: `${normalizedAmount} ${instrument}`,
      amount: normalizedAmount,
      description: description === '' ? null : description,
      statementUid: uid,
      originString: `${dateStr} ${normalizedBody}`
    })
  }

  return {
    account: depositAccount,
    transactions
  }
}

async function showHowTo (): Promise<ObjectWithAnyProps> {
  let result
  if (ZenMoney.getData('showHowTo') !== false) {
    const url = 'https://api.zenmoney.app/plugins/ffin-kz/how-to/'
    try {
      result = await openWebViewAndInterceptRequest({
        url,
        intercept: (request) => {
          console.log('Intercepted url: ', request.url)
          return request.url.includes('plugins/ffin-kz/callback/')
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

export async function parsePdfStatements (): Promise<null | Array<{ account: Account, transactions: StatementTransaction[] }>> {
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
  const pdfStrings = await Promise.all(blob.map(async (blob) => {
    const { text } = await parsePdf(blob)
    return text
  }))
  const result = []
  for (const textItem of pdfStrings) {
    if (!/Фридом Банк Казахстан/i.test(textItem)) {
      throw new TemporaryError('Похоже, это не выписка Freedom Bank KZ')
    }
    if (/Выписка по депозиту/i.test(textItem)) {
      result.push(parseDepositPdfString(textItem))
      continue
    }
    result.push(parseSinglePdfString(prepareCardStatementText(textItem)))
  }
  return result
}
