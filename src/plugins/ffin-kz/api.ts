import { generateUUID } from '../../common/utils'
import { StatementTransaction, ObjectWithAnyProps } from './models'
import { AccountOrCard, AccountType } from '../../types/zenmoney'
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

export async function getMobileExchangeRates (): Promise<Record<string, ExchangeRate>> {
  const mobileRatesMap: Record<string, ExchangeRate> = {}

  const response = await fetch('https://bankffin.kz/api/exchange-rates/getRates')
  if (!response.ok) {
    return mobileRatesMap
  }
  const json: ExchangeRatesResponse = await response.json()
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
    syncIds: [parseCardNumber(text)]
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

export async function parsePdfStatements (): Promise<null | Array<{ account: AccountOrCard, transactions: StatementTransaction[] }>> {
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

    // Разделяем на части: Дата Сумма Валюта Операция Детали
    // Ищем первую строку, где начинается таблица с транзакциями (по заголовку "Дата Сумма Валюта Операция Детали")
    const splitPoint = text.search(/^Дата\s+Сумма\s+Валюта\s+Операция\s+Детали/m)
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
  }))
  const result = []
  for (const textItem of pdfStrings) {
    if (!/Фридом Банк Казахстан/i.test(textItem)) {
      throw new TemporaryError('Похоже, это не выписка Freedom Bank KZ')
    }
    result.push(parseSinglePdfString(textItem))
  }
  return result
}
