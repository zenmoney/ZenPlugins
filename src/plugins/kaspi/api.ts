import { generateUUID } from '../../common/utils'
import {
  Auth,
  StatementAccount,
  StatementTransaction,
  ObjectWithAnyProps
} from './models'
import { parsePdfFromBlob } from './pdfToStr'
import { Amount } from '../../types/zenmoney'
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
  const match = getRegexpMatch([
    /Номер счета:\s?([A-Z0-9]+)/,
    /Account number:\s?([A-Z0-9]+)/,
    /Шот нөмірі:\s?([A-Z0-9]+)/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse accountId from account statement')
  return match[1]
}

function parseBalance (text: string): Amount {
  const match = getRegexpMatch([
    /Доступно на (\d\d\.?){3}:([\d\s,.]+)([^а-яА-Я]*)/,
    /Card balance (\d\d\.?){3}:([\d\s,.]+)([^a-zA-Z]*)/,
    /(\d\d\.?){3}ж. қолжетімді:([\d\s,.]+)([^а-яА-Я]*)/
  ], text)
  assert(typeof match?.[2] === 'string', 'Can\'t parse balance from account statement')
  return parseAmount([
    match[2].replace(',', '.').replace(/\s/g, ''),
    match[3].trim()
  ].filter(str => str !== '').join(' '))
}

function getStatementDate (text: string): Date {
  const match = getRegexpMatch([
    /Доступно на ((\d\d\.?){3}):/,
    /Card balance ((\d\d\.?){3}):/,
    /((\d\d\.?){3})ж. қолжетімді:/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse date from account statement')
  return parseDateFromPdfText(match[1])
}

function parseInstrument (text: string): string {
  const match = getRegexpMatch([
    /Валюта счета:\s?(\S+)/,
    /Шот валютасы:\s?(\S+)/,
    /Currency:\s?(\S+)/
  ], text)
  assert(match !== null, 'Can\'t parse instrument from account statement')
  if (['тенге', 'теңге', 'KZT'].includes(match[1])) {
    return 'KZT'
  }
  assert(false, 'found unknown instrument', match[1])
}

function getStatementLocale (text: string): string {
  if (text.includes('ҮЗІНДІ КӨШІРМЕ')) {
    return 'kz'
  } else if (text.includes('statement balance for the period')) {
    return 'en'
  } else if (text.includes('ВЫПИСКА')) {
    return 'ru'
  } else {
    return ''
  }
}

function parseDateFromPdfText (text: string): Date {
  const match = text.match(/^(\d{2}).(\d{2}).(\d{2})/)
  assert(match !== null, 'Can\'t parse date from pdf string', text)
  return new Date(parseInt(`20${match[3]}`), parseInt(match[2]) - 1, parseInt(match[1]))
}

function parseAccountTitle (text: string): string {
  let title = ''
  const matchType = getRegexpMatch([
    /по\s(.+) за период/,
    /кезеңге\s(.+) бойынша/,
    /www\.kaspi\.kz\s(.+)\s/
  ], text)
  if ((matchType?.[1]) != null) {
    title += matchType[1]
  }
  const matchAccountNumber = getRegexpMatch([
    /Номер карты:\s?(\*\d+)/,
    /Карта нөмірі:\s?(\*\d+)/,
    /Card number:\s?(\*\d+)/
  ], text)
  if ((matchAccountNumber?.[1]) != null) {
    title += ' ' + matchAccountNumber[1]
  }
  return title
}

function parseTransactions (text: string, statementUid: string): StatementTransaction[] {
  const locale = getStatementLocale(text)
  assert(locale !== '', 'Unknown statement locale')
  let baseRegexp: RegExp
  let originalAmountRegExpIndex = 5
  let descriptionRegExpIndex = 4
  if (locale === 'en') {
    baseRegexp = /(\d{2}\.?){3}([-+]\s?[\d\s.,]+)\W+(\w+)\s+(.+)\s?(\([-+]?[\d.,]+\s?[A-Z]{3}\))?/
  } else if (locale === 'ru') {
    baseRegexp = /(\d{2}\.?){3}([-+]\s?[\d\s.,]+)[^а-яА-Я]+([а-яА-Я]+)\s+(.+)\s?(\([-+]?[\d.,]+\s?[A-Z]{3}\))?/
  } else {
    baseRegexp = /(\d{2}\.?){3}([-+]\s?[\d\s.,]+)[^а-яА-Я\s]+\s{2,}((\S+\s)+)\s{2,}((\S+ {0,2})+)(\s\([^)]+\))?/
    originalAmountRegExpIndex = 7
    descriptionRegExpIndex = 5
  }
  const transactionStrings = text.match(new RegExp(baseRegexp, 'gm'))
  assert(transactionStrings !== null && transactionStrings?.length !== 0, 'No transactions found')
  return transactionStrings.map((str) => {
    const match = str.match(new RegExp(baseRegexp, 'm'))
    assert(match !== null, 'Can\'t parse transaction ', str)
    const rawTransaction = {
      hold: false,
      date: parseDateFromPdfText(str),
      originalAmount: [undefined, ''].includes(match[originalAmountRegExpIndex]) ? null : match[originalAmountRegExpIndex],
      amount: match[2],
      description: [undefined, ''].includes(match[descriptionRegExpIndex]) ? null : match[descriptionRegExpIndex],
      statementUid
    }
    return rawTransaction
  })
}

export function parseSinglePdfString (text: string, statementUid?: string): { account: StatementAccount, transactions: StatementTransaction[] } {
  const balanceAmount = parseBalance(text)
  const rawAccount: StatementAccount = {
    balance: balanceAmount.sum,
    id: parseAccountId(text),
    instrument: balanceAmount.instrument !== '' ? balanceAmount.instrument : parseInstrument(text),
    title: parseAccountTitle(text),
    date: getStatementDate(text)
  }
  const rawTransactions = parseTransactions(text, statementUid ?? generateUUID())
  const parsedContent = {
    account: rawAccount,
    transactions: rawTransactions
  }
  if (typeof statementUid !== 'string') {
    console.log(`Pdf succesfully parsed: ${JSON.stringify(parsedContent)}`)
  }
  return parsedContent
}

async function showHowTo (): Promise<ObjectWithAnyProps> {
  let result
  if (ZenMoney.getData('showHowTo') !== false) {
    const url = 'https://api.zenmoney.app/plugins/kaspi/how-to/'
    try {
      result = await openWebViewAndInterceptRequest({
        url,
        intercept: (request) => {
          console.log('Intercepted url: ', request.url)
          return request.url.includes('plugins/kaspi/callback/')
        }
      })
      ZenMoney.setData('showHowTo', false)
      console.log('>>>', typeof result, result)
    } catch (e) {
      console.debug(e)
    }
  }
  return { shouldPickDocs: result }
}

export async function parsePdfStatements (auth: Auth): Promise<null | Array<{ account: StatementAccount, transactions: StatementTransaction[] }>> {
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
    if (!/Kaspi Bank/i.test(textItem)) {
      throw new TemporaryError('Похоже, это не выписка Kaspi')
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
