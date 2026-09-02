import * as XLSX from 'xlsx'
import { AccountOrCard, AccountType, Amount, ExtendedTransaction, Merchant } from '../../types/zenmoney'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { TemporaryError } from '../../errors'
import { ConvertResult } from './models'

// Банк пишет рубль как RUR, а турецкую лиру как TLY — оба кода нестандартные,
// и без подмены ZenMoney заведёт под них отдельные несуществующие валюты
const BANK_CURRENCY: Record<string, string> = { RUR: 'RUB', TLY: 'TRY' }

export function parseInstrument (code: string): string {
  const trimmed = code.trim()
  return BANK_CURRENCY[trimmed] ?? codeToCurrencyLookup[trimmed] ?? trimmed
}

// Колонки грида на странице accounts. Банк отдаёт их под безымянными c1..c13,
// а соответствие объявляет рядом, в columns
const ACCOUNT_FIELD = {
  number: 'c1',
  currency: 'c8',
  card: 'c3',
  balance: 'c4',
  available: 'c6',
  state: 'c9'
}

// Колонки грида на странице карт. Банк держит там остаток с учётом
// авторизованных, но ещё не проведённых операций и неснижаемого остатка
const CARD_FIELD = {
  accountNumber: 'c4',
  balance: 'c6'
}

// Записи лежат в объекте w2ui как javascript, а не json: ключи без кавычек,
// значения в одинарных. Разбираем их сами, JSON.parse тут не годится
export function parseGridRecords (html: string): Array<Record<string, string>> {
  const start = html.indexOf('records:')
  if (start < 0) {
    return []
  }
  const end = html.indexOf(']', start)
  const records: Array<Record<string, string>> = []
  for (const block of html.slice(start, end < 0 ? undefined : end).matchAll(/\{[^{}]*\}/g)) {
    const record: Record<string, string> = {}
    for (const field of block[0].matchAll(/(\w+)\s*:\s*'([^']*)'/g)) {
      record[field[1]] = field[2]
    }
    if (Object.keys(record).length > 0) {
      records.push(record)
    }
  }
  return records
}

export function convertAccounts (html: string, cardsHtml = ''): ConvertResult[] {
  const cardBalances = parseCardBalances(cardsHtml)
  return parseGridRecords(html)
    .filter(record => (record[ACCOUNT_FIELD.number] ?? '') !== '')
    .map(record => convertAccount(record, cardBalances))
}

// Остаток по счёту и остаток по карте расходятся на две величины: банк держит
// неснижаемый остаток (в гриде карт это своя колонка) и уже учитывает
// авторизации, которых в выписке нет — она отдаёт только проведённое
function parseCardBalances (cardsHtml: string): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const card of parseGridRecords(cardsHtml)) {
    const accountNumber = card[CARD_FIELD.accountNumber] ?? ''
    const balance = (card[CARD_FIELD.balance] ?? '').trim()
    // Карта без остатка (закрытая, перевыпущенная) не должна ронять всю
    // синхронизацию: доступные средства просто останутся неизвестными
    if (accountNumber !== '' && balance !== '' && !(accountNumber in balances)) {
      balances[accountNumber] = parseDecimal(balance)
    }
  }
  return balances
}

function convertAccount (record: Record<string, string>, cardBalances: Record<string, number>): ConvertResult {
  const accountNumber = record[ACCOUNT_FIELD.number]
  const instrument = record[ACCOUNT_FIELD.currency] ?? ''
  const card = record[ACCOUNT_FIELD.card] ?? ''
  const cardNumber = parseCardNumber(card)

  return {
    accountNumber,
    account: {
      id: accountNumber,
      // Счёт с привязанной картой пользователь воспринимает как карточный
      type: card !== '' ? AccountType.ccard : AccountType.checking,
      title: getTitle(card, accountNumber, instrument),
      instrument: parseInstrument(instrument),
      // В balance идёт остаток счёта: только он сходится с суммой операций из
      // выписки, а разницу ZenMoney иначе припишет корректировкой. Доступные
      // средства банк считает по карте — их человек и видит в приложении
      balance: parseDecimal(record[ACCOUNT_FIELD.balance]),
      available: cardBalances[accountNumber],
      syncIds: cardNumber != null ? [accountNumber, cardNumber] : [accountNumber]
    }
  }
}

// В колонке карты слиты номер и название продукта одной строкой,
// без разделителя: '544906xxxx1234MasterCard MC STANDARD'
const CARD_NUMBER = /^(\d[\dx*]{10,17}\d)/i

function parseCardNumber (card: string): string | null {
  const match = CARD_NUMBER.exec(card.trim())
  // Банк прячет цифры буквой x, а общий код репозитория узнаёт маску только по
  // звёздочке: sanitizeSyncId и trimSyncId сопоставляют карты по ней.
  // Так же поступает alfabank-ua
  return match != null ? match[1].replace(/x/gi, '*') : null
}

function getTitle (card: string, accountNumber: string, instrument: string): string {
  const name = card.replace(CARD_NUMBER, '').trim()
  return name !== '' ? name : `${accountNumber} ${instrument}`.trim()
}

// Пустое значение не превращаем в ноль: молчаливый ноль в балансе
// ZenMoney примет за правду и подгонит счёт корректировкой
export function parseDecimal (value?: string): number {
  const parsed = Number(String(value ?? '').replace(/[\s,]/g, ''))
  if (value == null || value.trim() === '' || isNaN(parsed)) {
    // Это испорченный ответ банка, а не наша ошибка: голое 'Assertion failed'
    // пользователю показывать незачем
    throw new TemporaryError('Банк отдал остаток в неожиданном виде. Повторите синхронизацию.')
  }
  return parsed
}

// Колонки листа выписки (нумерация с нуля). Банк отдаёт SpreadsheetML 2003
// с разреженными ячейками, поэтому позиции берём как есть, а не по порядку
const STATEMENT_COLUMN = {
  date: 0,
  originalAmount: 1,
  originalCurrency: 2,
  credit: 3,
  debit: 5,
  rate: 7,
  details: 13
}

// Курс банк печатает всегда больше единицы, а в какую сторону — зависит от пары:
// 650.95 лир к 13.87 доллара это 46.93, а 60 евро к 71.46 доллара это 1.19
const RATE_TOLERANCE = 0.02

// В файле три листа — армянский, русский и английский. Берём английский:
// в остальных описание операции приходит в национальной кодировке
const ENGLISH_SHEET = 'Account ENG'

// Перевод между своими счетами банк подписывает «своего счёта» в транслите:
// 'POPOLNENIE SVOEGO ScETA 22300100000001'
const OWN_TRANSFER = /\bSVOEGO\b/i

export function parseStatement (file: ArrayBuffer): unknown[][] {
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(file, { type: 'array' })
  } catch (e) {
    // Вместо файла банк мог отдать страницу с ошибкой или форму входа
    throw new TemporaryError('Банк отдал выписку в неожиданном виде. Повторите синхронизацию.')
  }
  const sheet = workbook.Sheets[ENGLISH_SHEET]
  if (sheet == null) {
    // Лист есть в любой настоящей выписке, даже пустой за период. Разбирать
    // вместо него первый попавшийся — это принять страницу ошибки за выписку
    // и отчитаться нулём операций
    throw new TemporaryError('В выписке нет английского листа. Повторите синхронизацию.')
  }
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: null, blankrows: false })
}

export function convertTransactions (rows: unknown[][], account: AccountOrCard): ExtendedTransaction[] {
  const transactions: ExtendedTransaction[] = []
  for (const row of rows) {
    const transaction = convertTransaction(row, account)
    if (transaction != null) {
      transactions.push(transaction)
    }
  }
  return transactions
}

function convertTransaction (row: unknown[], account: AccountOrCard): ExtendedTransaction | null {
  const date = parseStatementDate(cell(row, STATEMENT_COLUMN.date))
  if (date == null) {
    // Строки итогов по дню приходят без даты операции, суммы в них — остаток
    return null
  }
  const credit = parseSignedDecimal(cell(row, STATEMENT_COLUMN.credit))
  const debit = parseSignedDecimal(cell(row, STATEMENT_COLUMN.debit))
  const sum = credit ?? debit
  if (sum == null) {
    return null
  }
  const details = cell(row, STATEMENT_COLUMN.details) ?? ''
  const invoice = parseInvoice(row, account.instrument, sum)
  const transferAmount = invoice ?? { instrument: account.instrument, sum }

  return {
    // Банк прямо пишет, что непроведённых операций в выписке нет
    hold: false,
    date,
    movements: [{
      // Уникального номера операции в выписке нет: то, что похоже на ссылку,
      // на деле идентификатор терминала и повторяется у разных покупок
      id: null,
      account: { id: account.id },
      invoice,
      sum,
      // Комиссию банк выносит отдельной строкой со своей суммой, и она приходит
      // сюда самостоятельной операцией, а не довеском к покупке
      fee: 0
    }],
    merchant: parseMerchant(details),
    comment: parseComment(details),
    // Ключ склейки вешаем только на строки, которые банк сам назвал переводом
    // между своими счетами. Без этого условия любая пара «покупка на 100 и
    // приход на 100 в тот же день по разным счетам» слиплась бы в один перевод:
    // своего номера операции в выписке нет. Так же поступают apelsin-uz и bgpb
    ...OWN_TRANSFER.test(details) && {
      groupKeys: [`${localDay(date)}_${transferAmount.instrument}_${Math.abs(transferAmount.sum).toString()}`]
    }
  }
}

// День берём по местному календарю, тем же, в котором построена дата операции
function localDay (date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Колонки 2 и 3 — сумма и валюта самой операции, а списание по счёту
// лежит отдельно. Для операции в валюте счёта показывать курс незачем
function parseInvoice (row: unknown[], accountInstrument: string, sum: number): Amount | null {
  const instrument = parseInstrument(cell(row, STATEMENT_COLUMN.originalCurrency) ?? '')
  const original = parseSignedDecimal(cell(row, STATEMENT_COLUMN.originalAmount))
  if (instrument === accountInstrument || instrument === '' || original == null) {
    return null
  }
  // В строке комиссии банк повторяет сумму исходной покупки, хотя списал свою.
  // Курс это выдаёт: он сходится только у настоящей валютной операции, а иначе
  // одна и та же сумма в лирах записалась бы дважды
  if (!isRateConsistent(parseSignedDecimal(cell(row, STATEMENT_COLUMN.rate)), sum, original)) {
    return null
  }
  return { sum: sum < 0 ? -Math.abs(original) : Math.abs(original), instrument }
}

function isRateConsistent (rate: number | null, sum: number, original: number): boolean {
  if (rate == null || rate === 0) {
    return true
  }
  const [account, foreign] = [Math.abs(sum), Math.abs(original)]
  return Math.abs(account * rate - foreign) <= foreign * RATE_TOLERANCE ||
    Math.abs(foreign * rate - account) <= account * RATE_TOLERANCE
}

// Описание карточной операции банк собирает через обратный слеш:
// '01324422\TUR\ISTANBUL\ASMA\CARREFOURSA' — ссылка, страна, город, продавец
function parseMerchant (details: string): Merchant | null {
  const parts = details.split('\\')
  if (parts.length < 3) {
    return null
  }
  const title = parts[parts.length - 1].trim()
  const country = parts[1].trim()
  const city = parts[2].trim()
  return title !== ''
    ? { country: country !== '' ? country : null, city: city !== '' ? city : null, title, mcc: null, location: null }
    : null
}

// У операции без продавца описание целиком идёт в комментарий, а у карточной
// туда попадает только то, что банк дописал перед ссылкой, например 'Commission'
function parseComment (details: string): string | null {
  const parts = details.split('\\')
  // Перед первой косой чертой банк держит ссылку операции, а осмысленное слово
  // вроде 'Commission' ставит перед ней. Ссылка бывает и без цифр ('PDGOUQZN'),
  // поэтому срезаем последний токен целиком, а не по виду
  const text = (parts.length < 3 ? details : parts[0].replace(/(^|\s)\S+\s*$/, '')).replace(/\s+/g, ' ').trim()
  return text !== '' ? text : null
}

function cell (row: unknown[], index: number): string | null {
  const value = row[index]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

// Суммы приходят со знаком и разделителем тысяч: '+1,205.71', '-54.66'
export function parseSignedDecimal (value: string | null): number | null {
  if (value == null) {
    return null
  }
  const parsed = Number(value.replace(/[\s,+]/g, ''))
  return isNaN(parsed) ? null : parsed
}

// Дата операции в выписке — 'dd.mm.yyyy', в отличие от 'dd/mm/yyyy' на страницах.
// Времени банк не даёт, поэтому строим дату в местном поясе устройства, как это
// делают inecobank-am, otpbank-rs и другие: привязка к поясу банка сдвигала бы
// календарный день у всех, кто западнее, и операция показывалась бы на день раньше
export function parseStatementDate (value: string | null): Date | null {
  const match = value != null ? /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value) : null
  if (match == null) {
    return null
  }
  const [, day, month, year] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}
