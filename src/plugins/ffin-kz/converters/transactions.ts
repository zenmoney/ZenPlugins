import { flatten } from 'lodash'
import { Movement, AccountType, Merchant, NonParsedMerchant } from '../../../types/zenmoney'
import { ConvertedTransaction, StatementTransaction } from '../models'
import { ExchangeRate } from '../api'
import { createHash } from 'crypto'

export const transactionType = {
  INCOME: 'income',
  OUTCOME: 'outcome',
  TRANSFER: 'transfer',
  CASH: 'cash'
}

const transactionTypeStrings = {
  TRANSFER: ['Перевод', 'Между своими счетами', 'С карты другого банка', 'Выплата вклада по Договору', 'Со счета другого банка', 'Прием вклада по договору', 'Басқа банктің шотынан', 'Другое Исполнение', 'Другое номер', 'по договору'],
  INCOME: ['Пополнение', 'Вознаграждение', 'Replenishment', 'Толықтыру', 'Выплата процентов по вкладу'],
  OUTCOME: ['Покупка', 'Платеж', 'Сумма в обработке'],
  CASH: ['Снятие', 'Withdrawals', 'Ақша алу']
}

function parseTransactionType (text: string): string | null {
  if (transactionTypeStrings.OUTCOME.some(str => text.includes(str))) {
    return transactionType.OUTCOME
  }
  if (transactionTypeStrings.TRANSFER.some(str => text.includes(str)) || /(\w|[^\d\s])+\s[^\d\s]\./.test(text)) {
    return transactionType.TRANSFER
  }
  if (transactionTypeStrings.CASH.some(str => text.includes(str)) || /анкомат|atm/i.test(text)) {
    return transactionType.CASH
  }
  if (transactionTypeStrings.INCOME.some(str => text.includes(str))) {
    return transactionType.INCOME
  }
  return null
}

function cleanMerchantTitle (text: string | null): string | null {
  if (text == null || text.trim() === '') return null

  // Отбрасываем "Банк ожидает подтверждения..." хвосты
  const awaitingTail = /\.\s*банк\s+ожидает\s+подтверждения.*$/i
  text = text.replace(awaitingTail, '')

  // Удаляем сообщения типа "Другое Плательщик:... Получатель:... Назначение: ..."
  if (/^Другое\s+Плательщик:.*Получатель:.*Назначение:/i.test(text)) {
    return null
  }
  if (/^с карты на карту/i.test(text)) {
    return null
  }
  if (/^Принят.*/i.test(text)) {
    return null
  }
  if (/ETN_SUPERAPP продажа ЦБ/i.test(text)) {
    return null
  }

  const keywordsToRemove = [...flatten(Object.values(transactionTypeStrings)), '₸']
  keywordsToRemove.push('Сумма в обработке')
  let cleanedText = text

  for (const keyword of keywordsToRemove) {
    cleanedText = cleanedText.replace(new RegExp(keyword, 'gi'), '')
  }

  cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim() // Убираем лишние пробелы

  return cleanedText.length > 0 ? cleanedText : null
}

function convertCurrency (currencyRates: Record<string, ExchangeRate>, amount: number, fromCurrency: string, toCurrency: string): number {
  const rates: Record<string, ExchangeRate> = currencyRates
  if (fromCurrency === toCurrency) {
    return amount
  }
  const key = `${fromCurrency}_${toCurrency}`
  const reverseKey = `${toCurrency}_${fromCurrency}`

  if (Object.prototype.hasOwnProperty.call(rates, key) && rates[key] !== undefined) {
    // Покупаем toCurrency за fromCurrency, используем sellRate
    return amount * rates[key].sellRate
  }
  if (Object.prototype.hasOwnProperty.call(rates, reverseKey) && rates[reverseKey] !== undefined) {
    // Продаём toCurrency за fromCurrency, используем buyRate
    return amount / rates[reverseKey].buyRate
  }
  throw new Error(`Нет курса для конвертации из ${fromCurrency} в ${toCurrency}`)
}

function generateTransactionId (date: string, sum: string | null, description: string | null): string {
  const hash = createHash('sha1')
  hash.update(`${date}_${sum ?? ''}_${description ?? ''}`)
  return hash.digest('hex').slice(0, 12)
}

function parseNumber (value: string): number {
  return parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''))
}

function detectInstrument (rawTransaction: StatementTransaction, rawAccount: { id: string, instrument: string }): string {
  if (rawTransaction.originalAmount !== null) {
    return rawTransaction.originalAmount.match(/[A-Z]{3}/)?.[0] ?? 'KZT'
  }
  return rawAccount.instrument ?? 'KZT'
}

function buildCounterMovement (parsedType: string, rawTransaction: StatementTransaction, instrument: string, sum: number): Movement {
  let type
  let syncIds = null

  if (parsedType === transactionType.CASH) {
    type = AccountType.cash
  } else if (parsedType === transactionType.TRANSFER && rawTransaction.description !== null && rawTransaction.description.includes('KZ')) {
    type = AccountType.deposit
    const syncIdMatch = rawTransaction.description.match(/KZ[A-Z0-9]{15}/)
    if (syncIdMatch != null) {
      syncIds = [syncIdMatch[0]]
    }
  } else {
    type = AccountType.ccard
  }

  return {
    id: null,
    account: {
      type,
      instrument,
      company: null,
      syncIds
    },
    invoice: null,
    sum: -sum,
    fee: 0
  }
}

export function detectCityCountryLocation (text: string | null): { city?: string | null, country?: string | null, locationPoint: string } | null {
  if (text == null) return null
  const upper = text.toUpperCase()

  const countryByCode: Record<string, string> = {
    KZ: 'Kazakhstan',
    CN: 'China',
    BY: 'Belarus',
    GB: 'United Kingdom',
    PL: 'Poland',
    UZ: 'Uzbekistan',
    NL: 'Netherlands',
    SE: 'Sweden'
  }

  const cityMatchers: Array<{ marker: RegExp, city: string, country?: string }> = [
    { marker: /ALMATY/, city: 'Almaty', country: 'Kazakhstan' },
    { marker: /BAITEREK/, city: 'Baiterek', country: 'Kazakhstan' },
    { marker: /CHUNJA/, city: 'Chunja', country: 'Kazakhstan' },
    { marker: /SHANGHAI/, city: 'Shanghai', country: 'China' },
    { marker: /MINSK(?:IY)?/, city: 'Minsk', country: 'Belarus' },
    { marker: /STOCKHOLM/, city: 'Stockholm', country: 'Sweden' },
    { marker: /TAS?HKENT/, city: 'Tashkent', country: 'Uzbekistan' },
    { marker: /TOSHKENT/, city: 'Tashkent', country: 'Uzbekistan' },
    { marker: /YUNUSOBOD/, city: 'Tashkent', country: 'Uzbekistan' }
  ]

  let country: string | null = null
  const codeMatch = upper.match(/([A-Z]{2,3})\s*$/)
  if (codeMatch?.[1] != null && countryByCode[codeMatch[1]] != null) {
    country = countryByCode[codeMatch[1]]
  }

  let city: string | null = null
  let cityCountry: string | undefined
  for (const matcher of cityMatchers) {
    if (matcher.marker.test(upper)) {
      city = matcher.city
      cityCountry = matcher.country
      break
    }
  }

  const hasLocation = city !== null || country !== null
  const locationPoint = cleanLocationPoint(text, hasLocation)

  if (!hasLocation) {
    return { locationPoint }
  }

  return { city, country: cityCountry ?? country, locationPoint }
}

function cleanLocationPoint (text: string, hasLocation: boolean): string {
  let result = text
  result = result.replace(/^\s*IP\s+/i, '')
  result = result.replace(/^YUG\s+/i, 'UG ')
  // Cut off bracketed details
  result = result.split('(')[0]

  const markers = ['ALMATY', 'BAITEREK', 'CHUNJA', 'SHANGHAI', 'MINSK', 'MINSKIY R-N', 'STOCKHOLM', 'TASHKENT', 'TOSHKENT', 'YUNUSOBOD', 'KZKZ', 'KZ', 'NL', 'GB', 'UZ', 'PL', 'SE']
  for (const marker of markers) {
    result = result.replace(new RegExp(`\\b${marker}\\b`, 'ig'), '')
  }
  if (hasLocation) {
    // remove trailing country codes only when separated by space
    result = result.replace(/\s+(KZ|CN|BY|SE|PL|NL|GB|UZ)\s*$/ig, '')
    result = result.replace(/\bG\.?\b/ig, '')
  }

  const cutKeywords = [/ИСПОЛНЕНИЕ/i, /ЗА ОПЛАТУ/i, /ОТМЕНА/i, /ЗАКАЗ/i, /НОМЕР/i]
  for (const kw of cutKeywords) {
    const match = result.search(kw)
    if (match > -1) {
      result = result.slice(0, match)
      break
    }
  }

  result = result.replace(/\s{2,}/g, ' ').trim()
  result = result.replace(/\.+$/, '').trim()
  return result
}

export function convertPdfStatementTransaction (rawTransaction: StatementTransaction, rawAccount: { id: string, instrument: string }, currencyRates: Record<string, ExchangeRate>): ConvertedTransaction | null {
  let sum = parseNumber(rawTransaction.amount)
  if (sum === 0.0) {
    return null
  }
  const instrument = detectInstrument(rawTransaction, rawAccount)

  let invoice = rawTransaction.originalAmount !== null
    ? { sum: parseNumber(rawTransaction.originalAmount), instrument }
    : null

  if (invoice !== null && invoice.instrument === rawAccount.instrument) {
    // Amount already in account currency; keep as-is and drop invoice
    sum = invoice.sum
    invoice = null
  } else if (invoice !== null) {
    sum = convertCurrency(currencyRates, sum, invoice.instrument, 'KZT')
  }

  if ((invoice != null) && invoice.sum === sum && instrument === rawAccount.instrument) {
    invoice = null
  }

  const merchantFullTitle = cleanMerchantTitle(rawTransaction.description)
  const baseMovement: Movement = {
    id: generateTransactionId(rawTransaction.date, rawTransaction.originalAmount, merchantFullTitle),
    account: { id: rawAccount.id },
    invoice,
    sum,
    fee: 0
  }
  console.log('ID транзакции:', baseMovement.id, 'Исходная сумма:', rawTransaction.originalAmount, 'Описание:', merchantFullTitle)

  const parsedType = parseTransactionType(rawTransaction.originString)
  if (parsedType === null) {
    console.warn('Unknown transaction type for', rawTransaction.originString)
  }
  let movements: [Movement] | [Movement, Movement]

  if (parsedType !== null && [transactionType.CASH, transactionType.TRANSFER].includes(parsedType)) {
    movements = [baseMovement, buildCounterMovement(parsedType, rawTransaction, instrument, sum)]
  } else {
    movements = [baseMovement]
  }

  let comment = null

  if (merchantFullTitle !== null) {
    const commentStrs = ['по номеру счета', 'by account number']
    for (const commentStr of commentStrs) {
      if (merchantFullTitle.includes(commentStr)) {
        comment = commentStr
        break
      }
    }
  }

  const hold = rawTransaction.originString.includes('Сумма в обработке')

  let merchant: Merchant | NonParsedMerchant | null = null
  const isCashOperation = parsedType === transactionType.CASH
  const isInterestPayout = ((rawTransaction.description ?? '').toLowerCase().includes('выплата процентов по вкладу') ||
    rawTransaction.originString.toLowerCase().includes('выплата процентов по вкладу'))

  if (isCashOperation) {
    merchant = null
  } else if (isInterestPayout) {
    comment = 'Выплата процентов по вкладу'
    merchant = null
  } else if (merchantFullTitle !== null) {
    const loc = detectCityCountryLocation(merchantFullTitle)
    if (loc != null && (loc.city != null || loc.country != null)) {
      const titleCandidate = cleanLocationPoint(loc.locationPoint ?? merchantFullTitle, true)
      const title = (titleCandidate !== '') ? titleCandidate : merchantFullTitle
      merchant = {
        title,
        city: loc.city ?? null,
        country: loc.country ?? null,
        mcc: null,
        location: null,
        category: null
      } as unknown as Merchant
    } else if (loc != null) {
      const titleCandidate = cleanLocationPoint(loc.locationPoint ?? merchantFullTitle, true)
      const title = (titleCandidate !== '') ? titleCandidate : merchantFullTitle
      merchant = {
        title,
        city: null,
        country: null,
        mcc: null,
        location: null,
        category: null
      } as unknown as Merchant
    } else {
      const title = cleanLocationPoint(merchantFullTitle, false)
      merchant = {
        title: (title !== null && title !== '') ? title : merchantFullTitle,
        city: null,
        country: null,
        mcc: null,
        location: null,
        category: null
      } as unknown as Merchant
    }
  } else if (rawTransaction.originString != null) {
    const { location, title, comment: originComment } = parseMerchantFromOrigin(rawTransaction.originString)
    if (originComment != null) {
      comment = originComment
    }
    merchant = {
      title: title ?? null as unknown as string,
      city: null,
      country: null,
      mcc: null,
      location: (location ?? null) as unknown as Location | null,
      category: null
    } as unknown as Merchant
  }

  return {
    statementUid: rawTransaction.statementUid,
    transaction: {
      comment,
      movements,
      hold,
      date: new Date(rawTransaction.date),
      merchant
    }
  }
}

function parseMerchantFromOrigin (origin: string): { location: string | null, title: string | null, comment: string | null } {
  let text = origin.replace(/^\d{2}\.\d{2}\.\d{4}\s+/, '').trim()

  text = text.replace(/[-+]?[\s\d.,]+\s*(₸|USD|EUR|\$)\s*$/i, '').trim()

  let title: string | null = null
  let comment: string | null = null
  const orderMatch = text.match(/(?:^|\s)заказ\s.+$/i)
  if (orderMatch != null) {
    const orderText = orderMatch[0].trim()
    title = null
    comment = orderText
    text = text.replace(orderMatch[0], '').trim()
  }

  const base = cleanLocationPoint(text, true)
  title = (title != null) ? title : (base === '' ? null : base)

  return { location: null, title, comment }
}
