import { Account, AccountType, Amount, ExtendedTransaction, NonParsedMerchant } from '../../types/zenmoney'
import get, { getNumber, getOptArray, getOptString, getString } from '../../types/get'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { ConvertResult } from './models'

// Банк отдаёт время Еревана, часовой пояс Армении не меняется с 2012 года
const ARMENIA_UTC_OFFSET = '+04:00'

// AccountCategory карточного счёта
const CARD_ACCOUNT_CATEGORY = '19'

export function convertAccounts (apiAccounts: unknown[], apiCards: unknown[]): ConvertResult[] {
  const cardsByAccount = groupCardsByAccount(apiCards)
  return apiAccounts.map(apiAccount => convertAccount(apiAccount, cardsByAccount))
}

function groupCardsByAccount (apiCards: unknown[]): Record<string, unknown[] | undefined> {
  const cardsByAccount: Record<string, unknown[] | undefined> = {}
  for (const apiCard of apiCards) {
    const account = getString(apiCard, 'Account')
    const cards = cardsByAccount[account] ?? []
    cards.push(apiCard)
    cardsByAccount[account] = cards
  }
  return cardsByAccount
}

function convertAccount (apiAccount: unknown, cardsByAccount: Record<string, unknown[] | undefined>): ConvertResult {
  const accountNumber = getString(apiAccount, 'AccountNumber')
  const instrument = parseInstrument(getString(apiAccount, 'CodeCurrency'))
  const cards = cardsByAccount[accountNumber] ?? []
  // Признаки сверяем строками: код результата банк уже шлёт то числом, то строкой
  const isCardAccount = String(get(apiAccount, 'AccountCategory')) === CARD_ACCOUNT_CATEGORY
  // Закрытый счёт архивируем, а не выбрасываем: иначе пользователь потеряет его историю.
  // Выписку по нему не просим — банк отдаёт операции только по действующим счетам
  const isOpen = String(get(apiAccount, 'IsOpen')) === '1'

  return {
    accountNumber: isOpen ? accountNumber : null,
    account: {
      id: accountNumber,
      type: isCardAccount ? AccountType.ccard : AccountType.checking,
      title: getAccountTitle(apiAccount, cards, instrument),
      instrument,
      balance: parseDecimal(get(apiAccount, 'Balance')),
      syncIds: [accountNumber, ...cards.map(apiCard => getString(apiCard, 'Number'))],
      archived: !isOpen
    }
  }
}

function getAccountTitle (apiAccount: unknown, cards: unknown[], instrument: string): string {
  const accountNumber = getString(apiAccount, 'AccountNumber')
  const suffix = `${instrument} *${accountNumber.slice(-4)}`
  if (cards.length > 0) {
    const apiCard = cards[0]
    return `${getOptString(apiCard, 'Ctype') ?? ''} ${getOptString(apiCard, 'Description') ?? ''} ${suffix}`.replace(/\s+/g, ' ').trim()
  }
  const category = getLocalizedName(apiAccount, 'AccountCategoryName')
  return category != null ? `${category} ${suffix}` : `${accountNumber} ${instrument}`
}

// Названия приходят списком переводов, порядок языков в нём не гарантирован
function getLocalizedName (apiAccount: unknown, path: string): string | null {
  const translations = getOptArray(apiAccount, `${path}.Translation`) ?? []
  for (const translation of translations) {
    if (getOptString(translation, 'lang') === 'en') {
      return getOptString(translation, 'value') ?? null
    }
  }
  return null
}

export function convertTransaction (apiTransaction: unknown, account: Account, instrumentsByAccount: Record<string, string | undefined> = {}): ExtendedTransaction {
  const isOutcome = getString(apiTransaction, 'Coper') === 'DB'
  const sum = parseDecimal(get(apiTransaction, isOutcome ? 'DbAmount' : 'CrAmount'))
  const reference = String(getNumber(apiTransaction, 'Refnum'))

  return {
    hold: false,
    date: parseDate(getString(apiTransaction, 'ValueDate')),
    movements: [
      {
        id: reference,
        account: { id: account.id },
        invoice: parseInvoice(apiTransaction, account.instrument, isOutcome, instrumentsByAccount),
        sum: isOutcome ? -sum : sum,
        fee: 0
      }
    ],
    merchant: parseMerchant(apiTransaction),
    comment: parseComment(apiTransaction),
    // Перевод между своими счетами приходит дважды с одним Refnum,
    // по нему обе стороны сходятся в одну операцию
    groupKeys: [reference]
  }
}

// Сумма в валюте операции, если конвертация действительно была
function parseInvoice (apiTransaction: unknown, accountInstrument: string, isOutcome: boolean, instrumentsByAccount: Record<string, string | undefined>): Amount | null {
  const instrument = parseInstrument(getOptString(apiTransaction, 'TransCurr') ?? accountInstrument)
  if (instrument === accountInstrument) {
    return null
  }
  // У перевода между своими счетами в Equivalent лежит учётная сумма в драмах,
  // хотя обе стороны в одной валюте и никакой конвертации не происходило
  const counterpart = getOptString(apiTransaction, 'Coracnt')
  if (counterpart != null && instrumentsByAccount[counterpart] === accountInstrument) {
    return null
  }
  const sum = getNumber(apiTransaction, 'Equivalent')
  return { sum: isOutcome ? -sum : sum, instrument }
}

function parseMerchant (apiTransaction: unknown): NonParsedMerchant | null {
  const mcc = parseMcc(getOptString(apiTransaction, 'Mcc'))
  if (mcc == null) {
    return null
  }
  const title = getOptString(apiTransaction, 'CustomerName')?.trim() ?? ''
  const place = parseMerchantPlace(getOptString(apiTransaction, 'Details'))
  const fullTitle = place != null ? `${place} ${title}`.trim() : title
  return fullTitle !== '' ? { fullTitle, mcc, location: null } : null
}

// В Details карточной операции место зашито между кодом валюты и названием:
// '...900920 10375766\784\Springfield\EXAMPLE HOTEL'
function parseMerchantPlace (details?: string): string | null {
  const match = details != null ? /\\\d{3}\\([^\\]+)\\/.exec(details) : null
  return match != null ? match[1].trim() : null
}

function parseComment (apiTransaction: unknown): string | null {
  if (parseMcc(getOptString(apiTransaction, 'Mcc')) != null) {
    return null
  }
  // Details карточной операции начинается с номера карты — в комментарий ему нельзя
  const details = getOptString(apiTransaction, 'Details')?.replace(/\b\d{13,19}\b/g, '').replace(/\s+/g, ' ').trim()
  return details != null && details !== '' ? details : null
}

function parseMcc (mcc?: string): number | null {
  if (mcc == null || mcc.trim() === '') {
    return null
  }
  const parsed = Number(mcc)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// Валюта приходит либо буквенным кодом, либо числовым по ISO 4217.
// Коды меньше сотни лежат в справочнике строками с ведущими нулями: '051' — AMD
export function parseInstrument (code: string): string {
  const instrument = codeToCurrencyLookup[code] ?? codeToCurrencyLookup[Number(code)]
  if (instrument != null) {
    return instrument
  }
  return code === 'RUR' ? 'RUB' : code
}

// Числа приходят строкой с разделителем тысяч: '1,234.50'.
// Пустое значение не превращаем в ноль: молчаливый ноль в балансе или сумме
// операции ZenMoney примет за правду и подгонит счёт корректировкой
export function parseDecimal (value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, ''))
  console.assert(typeof value === 'number' || (typeof value === 'string' && value !== ''), 'missing number', value)
  console.assert(!isNaN(parsed), 'unexpected number format', value)
  return parsed
}

// Дата приходит в формате 'DD/MM/YYYY HH:mm:ss'
export function parseDate (value: string): Date {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/.exec(value.trim())
  console.assert(match != null, 'unexpected date format', value)
  const [, day, month, year, hours, minutes, seconds] = match as RegExpExecArray
  const time = hours != null ? `${hours}:${minutes}:${seconds}` : '00:00:00'
  return new Date(`${year}-${month}-${day}T${time}${ARMENIA_UTC_OFFSET}`)
}
