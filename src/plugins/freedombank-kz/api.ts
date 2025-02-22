import { generateUUID } from '../../common/utils'
import { StatementTransaction, ObjectWithAnyProps } from './models'
import { parsePdfFromBlob } from './pdfToStr'
import { Amount, AccountOrCard, AccountType } from '../../types/zenmoney'
import { parseAmount } from './converters/converterUtils'
import { openWebViewAndInterceptRequest } from '../../common/network'
import { TemporaryError } from '../../errors'

function getRegexpMatch (regExps: RegExp[], text: string, flags?: string): RegExpMatchArray | null {
  let match = null
  regExps.find((regExp: RegExp) => {
    match = text.match(new RegExp(regExp, flags))
    return match !== null
  })
  return match
}

function parseAccountId (text: string): string {
  // Валюта счета:KZT, USD, EUR, RUB, CNY, TRY, AED Дата:01.01.2025 Номер счётаВалютаОстаток KZ123456789012345KZTKZT19,455.00 ₸
  const match = getRegexpMatch([
    /([A-Z]{2}\d{2}[A-Z0-9]{13})/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse accountId from account statement')
  return match[1] // KZ123456789012345
}

export function parseBalance (text: string): Amount {
  // Пример: Доступно на 02.01.202519,455.00₸
  const match = getRegexpMatch([
    /Доступно\s+на\s+(\d{2}[-./]\d{2}[-./]\d{4})\s?(\d{1,3}(?:[\s.,]\d{3})*(?:[.,]\d+)?)([₸])/
  ], text)
  if (match?.[2] !== undefined) {
    const amountStr = [
      match[2].replace(',', '').replace(/\s/g, ''),
      match[3].trim()
    ].filter(str => str !== '').join(' ')
    return parseAmount(amountStr)
  }

  assert(false, 'Can\'t parse balance from account statement')
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
  return text.match(/Номер карты:\*\*(\d{4})/)?.[1] ?? ''
}

function parseTransactions (text: string, statementUid: string): StatementTransaction[] {
  const baseRegexp = /^(\d{2}\.\d{2}\.\d{4})([-+]\s?[\d.,]+)\s?([₸$€£¥₺₽])\s?([A-Z]{3})([а-яА-ЯA-Za-z\s"“”'‘’]+)?\s?(.+)?$/gm

  const transactionStrings = text.match(baseRegexp)

  if (!transactionStrings || transactionStrings.length === 0) {
    return []
  }

  return transactionStrings.map((str) => {
    const match = str.match(/^(\d{2}\.\d{2}\.\d{4})([-+]\s?[\d.,]+)\s?([₸$€£¥₺₽])([A-Z]{3})([а-яА-ЯA-Za-z\s"“”'‘’]+)?\s?(.+)?$/)
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

export function parseSinglePdfString (text: string, statementUid?: string): { account: AccountOrCard, transactions: StatementTransaction[] } {
  const balanceAmount = parseBalance(text)
  const accountType = AccountType.ccard
  const rawAccount: AccountOrCard = {
    balance: balanceAmount.sum,
    id: parseAccountId(text),
    instrument: balanceAmount.instrument,
    title: parseAccountTitle(text),
    type: accountType,
    savings: false,
    syncIds: [parseCardNumber(text)]
  }
  const rawTransactions = parseTransactions(text, statementUid ?? generateUUID())
  const parsedContent = {
    account: rawAccount,
    transactions: rawTransactions
  }
  if (typeof statementUid !== 'string') {
    console.log('Pdf successfully parsed', parsedContent)
  }
  return parsedContent
}

async function showHowTo (): Promise<ObjectWithAnyProps> {
  let result
  if (ZenMoney.getData('showHowTo') !== false) {
    const url = 'https://api.zenmoney.app/plugins/freedombank-kz/how-to/'
    try {
      result = await openWebViewAndInterceptRequest({
        url,
        intercept: (request) => {
          console.log('Intercepted url: ', request.url)
          return request.url.includes('plugins/freedombank-kz/callback/')
        }
      })
      ZenMoney.setData('showHowTo', false)
    } catch (e) {
      console.debug(e)
    }
  }
  return { shouldPickDocs: result }
}

export async function parsePdfStatements (): Promise<null | Array<{ account: AccountOrCard, transactions: StatementTransaction[] }>> {
  await showHowTo()
  const blob = await ZenMoney.pickDocuments(['application/pdf'], true)
  if (!blob || !blob.length) {
    throw new TemporaryError('Выберите один или несколько файлов в формате .pdf')
  }
  for (const { size, type } of blob) {
    if (type !== 'application/pdf') {
      throw new TemporaryError('Выписка должна быть в расширении .pdf')
    } else if (size >= 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла - 1 мб')
    }
  }
  const pdfStrings = await parsePdfFromBlob({ blob })
  const result = []
  for (const textItem of pdfStrings) {
    console.log(textItem)
    if (!/Фридом Банк Казахстан/i.test(textItem)) {
      throw new TemporaryError('Похоже, это не выписка Freedom Bank KZ')
    }
    try {
      result.push(parseSinglePdfString(textItem))
    } catch (e) {
      console.error(e)
      throw e
    }
  }
  return result
}
