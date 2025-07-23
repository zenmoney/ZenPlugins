import { generateUUID } from '../../common/utils'
import { chunk } from 'lodash'
import {
  StatementAccount,
  StatementTransaction,
  ObjectWithAnyProps, AccountTypeByLocale, AccountTypeHash
} from './models'
import { Amount } from '../../types/zenmoney'
import { parseAmount } from './converters/converterUtils'
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

function parseAccountId (text: string): string {
  const match = getRegexpMatch([
    /Номер счета:\s*([A-Z0-9]+)/,
    /Account number:\s?([A-Z0-9]+)/,
    /Шот нөмірі:\s?([A-Z0-9]+)/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse accountId from account statement')
  return match[1]
}

function parseBalance (text: string): Amount {
  let match = getRegexpMatch([
    /Доступно\s+на\s+(\d{2}[-./]\d{2}[-./]\d{2,4}):\s*(?:\+\s)?(-?[\d\s.,]*\d)\s*([а-яА-Яa-zA-Z]{1,3}|\W)/,
    /Card\s+balance\s+(\d{2}[-./]\d{2}[-./]\d{2,4}):\s*(?:\+\s)?(-?[\d\s.,]*\d)\s*([а-яА-Яa-zA-Z]{1,3}|\W)/,
    /(\d{2}[-./]\d{2}[-./]\d{2,4})ж. қолжетімді:\s*(?:\+\s)?(-?[\d\s.,]*\d)\s*([а-яА-Яa-zA-Z]{1,3}|\W)/,
    /На\s+Депозите\s*(\d{2}[-./]\d{2}[-./]\d{2,4}):\s*(?:\+\s)?(-?[\d\s.,]*\d)\s*([а-яА-Яa-zA-Z]{1,3}|\W)/
  ], text)
  if (match?.[2] !== undefined) {
    const amountStr = [
      match[2].replace(',', '.').replace(/\s/g, ''),
      match[3].trim()
    ].filter(str => str !== '').join(' ')
    return parseAmount(amountStr)
  }

  match = getRegexpMatch([
    /Доступно\s+на\s+(\d{2}[-./]\d{2}[-./]\d{2,4}):\s*(?:\+\s)?([а-яА-Яa-zA-Z]{1,3}|\W)\s*(-?[\d\s.,]*\d)/,
    /Card\s+balance\s+(\d{2}[-./]\d{2}[-./]\d{2,4}):\s*(?:\+\s)?([а-яА-Яa-zA-Z]{1,3}|\W)\s*(-?[\d\s.,]*\d)/,
    /(\d{2}[-./]\d{2}[-./]\d{2,4})ж. қолжетімді:\s*(?:\+\s)?([а-яА-Яa-zA-Z]{1,3}|\W)\s*(-?[\d\s.,]*\d)/,
    /На\s+Депозите\s*(\d{2}[-./]\d{2}[-./]\d{2,4}):\s*(?:\+\s)?([а-яА-Яa-zA-Z]{1,3}|\W)\s*(-?[\d\s.,]*\d)/
  ], text)
  if (match?.[3] !== undefined) {
    const amountStr = [
      match[3].replace(',', '.').replace(/\s/g, ''),
      match[2].trim()
    ].filter(str => str !== '').join(' ')
    return parseAmount(amountStr)
  }

  assert(false, 'Can\'t parse balance from account statement')
}

function getStatementDate (text: string): string {
  const match = getRegexpMatch([
    /Доступно на ((\d\d\.?){3}):/,
    /Card balance ((\d\d\.?){3}):/,
    /((\d\d\.?){3})ж. қолжетімді:/,
    /На Депозите ((\d\d\.?){3}):/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse date from account statement')
  return parseDateFromPdfText(match[1])
}

function getDepositStartDate (text: string): string {
  const match = getRegexpMatch([
    /Дата открытия:\s*(\d{2}.\d{2}.\d{4})/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse deposit start date from account statement')
  return parseDateFromPdfText(match[1])
}

function getDepositEndDate (text: string): string {
  const match = getRegexpMatch([
    /Дата пролонгации:\s*(\d{2}.\d{2}.\d{4})/
  ], text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse deposit end date from account statement')
  return parseDateFromPdfText(match[1])
}

function getDepositCapitalizationInfo (text: string): string {
  const match = getRegexpMatch([
    /вознаграждения:(\d+%)/
  ], text)
  return match?.[1] != null ? match?.[1] : ''
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

function parseDateFromPdfText (text: string): string {
  const match = text.match(/^(\d{2}).(\d{2}).(\d{2,4})/)
  assert(match !== null, 'Can\'t parse date from pdf string', text)
  return `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2]}-${match[1]}T00:00:00.000`
}

function parseAccountType (text: string): string {
  let type = ''
  const matchType = getRegexpMatch([
    /[Пп]о\s(.+) за период/,
    /кезеңге\s(.+) бойынша/,
    /www\.kaspi\.kz\s(.+)\s/
  ], text)
  if ((matchType?.[1]) != null) {
    type = matchType[1].toLowerCase()
  }
  if (type.includes('депозит') || type.includes('deposit')) {
    type = 'deposit'
  } else if (type.includes('gold')) {
    type = 'gold'
  }
  return type
}

function parseAccountTitle (text: string, type: string): string {
  const locale = getStatementLocale(text)
  const titleByTypeAndLocale: AccountTypeByLocale = {
    ru: {
      deposit: 'Депозит',
      gold: 'Kaspi Gold'
    },
    en: {
      deposit: 'Deposit',
      gold: 'Kaspi Gold'
    },
    kz: {
      deposit: 'Депозит',
      gold: 'Kaspi Gold'
    }
  }
  let title = titleByTypeAndLocale[locale as keyof AccountTypeByLocale][type as keyof AccountTypeHash]
  const matchAccountNumber = getRegexpMatch([
    /Номер карты:\s?(\*\d+)/,
    /Карта нөмірі:\s?(\*\d+)/,
    /Card number:\s?(\*\d+)/,
    /Номер счета:\s*([A-Z0-9]+)/
  ], text)
  if ((matchAccountNumber?.[1]) != null) {
    const number = matchAccountNumber[1].length > 5 ? `*${matchAccountNumber[1].slice(-4)}` : matchAccountNumber[1]
    title += ' ' + number
  }
  return title
}

function parseDepositTransactions (text: string, statementUid: string): StatementTransaction[] {
  const headerStringByLocale = {
    ru: /Дата\s?Сумма\s?Операция\s?Детали\s?На Депозите/
  }
  const headerMatch = text.match(headerStringByLocale.ru)
  assert(headerMatch?.[0] != null, 'Can\'t find header for deposit account')
  const startIndex = text.indexOf(headerMatch?.[0])
  assert(startIndex >= 0, 'Can\'t parse transactions for deposit account')
  text = text.slice(startIndex)
  const pages = text.split(headerStringByLocale.ru).filter(str => str !== '')
  const transactionRegExp = /^(\d{2}\.\d{2}\.\d{2})\s?([-+]\s?[$\d\s.,]+)?\s?([^а-яА-Я]*[^$\d]+)\s?((\$?\d{1,3}\s?){1}(\d{3}\s?)*,\d{2}(\s₸)?)?/
  const result: StatementTransaction[] = []
  for (const page of pages) {
    const transactionStrings = page.match(new RegExp(transactionRegExp, 'gm'))
    /*
    * Descriptions for transactions are separate and may be split into lines.
    * Should check the coincidence of the number of transactions and descriptions.
    * Otherwise do not parse description
    * */
    let commentStrings: string[] = []
    try {
      commentStrings = page
        .replace(headerStringByLocale.ru, '')
        .replace(new RegExp(transactionRegExp, 'gm'), '')
        .trim()
        .split('\n')
      if ((commentStrings.length > 0) && transactionStrings !== null && commentStrings.length === (2 * transactionStrings.length)) {
        const pairs = chunk(commentStrings, 2)
        commentStrings = pairs.map(pair => pair.join(' ').trim())
      } else {
        commentStrings = []
      }
    } catch (e) {
      console.log(e)
    }
    if ((transactionStrings?.length) != null) {
      transactionStrings.map((str, index) => {
        const match = str.match(new RegExp(transactionRegExp, 'm'))
        /*
        * some transactions in statement comes without sum, should skip it
        * */
        if (match?.[2] == null) {
          return str
        }
        const description = (match?.[3]) != null ? match[3] : null
        assert(match !== null, 'Can\'t parse transaction ', str)
        const item = {
          hold: false,
          date: parseDateFromPdfText(str),
          originalAmount: null,
          amount: match[2],
          description: description === null
            ? commentStrings.length > 0 && (!['', undefined, null].includes(commentStrings[index]))
              ? commentStrings[index]
              : null
            : description,
          statementUid,
          originString: match[0]
        }
        result.push(item)
        return item
      })
    }
  }
  return result
}

function parseTransactions (text: string, accountType: string, statementUid: string): StatementTransaction[] {
  const locale = getStatementLocale(text)
  assert(locale !== '', 'Unknown statement locale')
  if (accountType === 'deposit') {
    return parseDepositTransactions(text, statementUid)
  }
  let baseRegexp: RegExp
  let originalAmountRegExpIndex = 5
  let descriptionRegExpIndex = 4
  if (locale === 'en') {
    baseRegexp = /^(\d{2}\.\d{2}\.\d{2})\s*([+-]\s?[\d\s.,]+)\s*\W+(\w+)\s+(.+)\s?(\([-+]?[\d.,]+\s?[A-Z]{3}\))?/
  } else if (locale === 'ru') {
    baseRegexp = /^(\d{2}\.\d{2}\.\d{2})\s*([+-]\s?[\d\s.,]+)\s*[^а-яА-Я]+([а-яА-Я]+)\s+(.+)\s?(\([-+]?[\d.,]+\s?[A-Z]{3}\))?/
  } else {
    baseRegexp = /^(\d{2}\.\d{2}\.\d{2})\s*([+-]\s?[\d\s.,]+)\s*[^а-яА-Я\s]+\s{2,}((\S+\s)+)\s{2,}((\S+ {0,2})+)(\s\([^)]+\))?/
    originalAmountRegExpIndex = 7
    descriptionRegExpIndex = 5
  }
  const transactionStrings = text.match(new RegExp(baseRegexp, 'gm'))
  return transactionStrings !== null && transactionStrings?.length !== 0
    ? transactionStrings.map((str) => {
      const match = str.match(new RegExp(baseRegexp, 'm'))
      assert(match !== null, 'Can\'t parse transaction ', str)
      return {
        hold: false,
        date: parseDateFromPdfText(str),
        originalAmount: [undefined, ''].includes(match[originalAmountRegExpIndex]) ? null : match[originalAmountRegExpIndex],
        amount: match[2],
        description: [undefined, ''].includes(match[descriptionRegExpIndex]) ? null : match[descriptionRegExpIndex],
        statementUid,
        originString: match[0]
      }
    })
    : []
}

export function parseSinglePdfString (text: string, statementUid?: string): { account: StatementAccount, transactions: StatementTransaction[] } {
  const balanceAmount = parseBalance(text)
  const accountType = parseAccountType(text)
  const rawAccount: StatementAccount = {
    balance: balanceAmount.sum,
    id: parseAccountId(text),
    instrument: balanceAmount.instrument !== '' ? balanceAmount.instrument : parseInstrument(text),
    title: parseAccountTitle(text, accountType),
    date: getStatementDate(text),
    type: accountType,
    startDate: accountType === 'deposit' ? getDepositStartDate(text) : null,
    startBalance: accountType === 'deposit' ? 0 : null,
    capitalization: accountType === 'deposit' ? getDepositCapitalizationInfo(text) : null,
    endDate: accountType === 'deposit' ? getDepositEndDate(text) : null
  }
  const rawTransactions = parseTransactions(text, accountType, statementUid ?? generateUUID())
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
    } catch (e) {
      console.debug(e)
    }
  }
  return { shouldPickDocs: result }
}

export async function parsePdfStatements (): Promise<null | Array<{ account: StatementAccount, transactions: StatementTransaction[] }>> {
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
