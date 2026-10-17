import cheerio from 'cheerio'
import { AccountInfo, AccountTransaction } from './models'
import { isValidDate } from '../../common/dateUtils'

const exchangeRateRegex = /\d+\.\d+ \w{3} Kurs:.+/

const months: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, maj: 4, jun: 5, jul: 6, avg: 7, sep: 8, okt: 9, nov: 10, dec: 11
}

export function parseHiddenFields (body: string): Record<string, string> {
  const html = cheerio.load(body)
  const fields: Record<string, string> = {}
  html('input[type="hidden"]').each((_, element) => {
    const name = html(element).attr('name')
    if (name !== undefined && name !== '') {
      fields[name] = html(element).attr('value') ?? ''
    }
  })
  return fields
}

export type LoginStep =
  | { kind: 'credentials' }
  | { kind: 'devices' }
  | { kind: 'waiting', workItemId?: string }
  | { kind: 'unknown' }

// Where the push login is after a form was posted: still asking for the
// credentials (they were refused), offering the mToken device to push to, or
// waiting for the push to be confirmed.
export function parseLoginStep (body: string): LoginStep {
  const html = cheerio.load(body)
  const waiting = html('[data-utility="checkCallbackStatus"]')
  if (waiting.length > 0) {
    return { kind: 'waiting', workItemId: waiting.attr('data-work-item-id') }
  }
  if (html('#Devices_Id').length > 0) {
    return { kind: 'devices' }
  }
  if (html('#Password_ID').length > 0) {
    return { kind: 'credentials' }
  }
  return { kind: 'unknown' }
}

function parseAmount (text: string): number {
  return parseFloat(text.trim().replace(/\./g, '').replace(',', '.'))
}

export function parseAccountInfo (body: string): AccountInfo[] {
  const html = cheerio.load(body)
  const accounts = new Map<string, AccountInfo>()

  // The accounts carousel repeats its slides, so an account is kept once.
  html('.slide[data-accountnumber]').each((_, accountHtml) => {
    const $ = cheerio.load(accountHtml)
    const accountNumber = (accountHtml as cheerio.TagElement).attribs['data-accountnumber']?.trim() ?? ''
    const cardNumber = (accountHtml as cheerio.TagElement).attribs['data-cardnumber']?.trim() ??
      (accountHtml as cheerio.TagElement).attribs['data-cardno']?.trim() ?? ''

    // Each currency shows its available funds and then its reserved funds;
    // both options carry the currency.
    const byCurrency = new Map<string, number>()
    $('option[data-amount]').each((_, element) => {
      const currency = $(element).attr('value')?.trim() ?? $(element).text().trim()
      if (!byCurrency.has(currency)) {
        byCurrency.set(currency, parseAmount($(element).attr('data-amount') ?? '0'))
      }
    })

    for (const [currency, balance] of byCurrency) {
      const id = byCurrency.size > 1 ? accountNumber + currency : accountNumber
      const key = id + '|' + cardNumber
      if (accounts.has(key)) {
        continue
      }
      accounts.set(key, {
        id,
        cardNumber,
        accountNumber,
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        name: $('.acc-name').first().text().trim() || $('.acc-nr').first().text().trim(),
        currency,
        balance
      })
    }
  })
  return [...accounts.values()]
}

export function parseRequestVerificationToken (body: string): string {
  const html = cheerio.load(body)
  const token = html('input[name="__RequestVerificationToken"]').val()

  return token
}

// A row shows a day and a month, not a year ("16 okt"); the list is newest
// first and never reaches past toDate, so a date after it is last year's.
function parseRowDate (day: string, month: string, toDate: Date): Date | null {
  const monthIndex = months[month.trim().toLowerCase().slice(0, 3)]
  const dayNumber = parseInt(day, 10)
  if (monthIndex === undefined || isNaN(dayNumber)) {
    return null
  }
  const date = new Date(toDate.getFullYear(), monthIndex, dayNumber)
  if (date.getTime() > toDate.getTime()) {
    date.setFullYear(toDate.getFullYear() - 1)
  }
  return date
}

export function parseTransactions (body: string, fromDate: Date, toDate: Date = new Date()): AccountTransaction[] {
  const html = cheerio.load(body)
  const transactions: AccountTransaction[] = []

  html('.transaction-list-item').each((_, transactionHtml) => {
    const $ = cheerio.load(transactionHtml)
    const status = $('.status-span').first().text().trim().toLowerCase()
    if (status !== '' && !status.startsWith('izvr')) {
      return
    }

    const id = $('.text-holder').attr('id')?.trim() ?? ''
    const day = $('.date-holder .date-num').text()
    const month = $('.date-holder span').not('.date-num').first().text()
    const date = parseRowDate(day, month, toDate)

    const lines = $('.transaction-list-item-desc').toArray()
      .map(element => $(element).text().replace(/\s+/g, ' ').trim())
      .filter(line => line !== '')
    // The card number, and the accounts of an internal transfer, are not what
    // the row was: the remaining line names the merchant or says what it was.
    const named = lines.filter(line => !/^(Broj kartice|Kartica|Od|Za):/i.test(line))
    const joined = lines.join(' ')
    const description = joined.match(exchangeRateRegex)?.[0] ?? ''
    const address = (named[named.length - 1] ?? lines[lines.length - 1] ?? '').replace(description, '').trim()

    const amountElement = $('.main-amount').first()
    // An amount is printed unsigned, its direction in the class. A minus in the
    // text marks a reversal: a duplicate card charge came back as "-855,00 EUR"
    // in a negative row, and only read as money in does the balance add up.
    const [amountText, currency] = amountElement.text().trim().replace(/^-\s*/, '-').split(/\s+/)
    const reversal = (amountText ?? '').startsWith('-') ? -1 : 1
    const direction = (amountElement.hasClass('negative-amount') ? -1 : 1) * reversal

    transactions.push({
      id: 'id_' + id,
      date: date !== null && isValidDate(date) ? date : fromDate,
      address,
      amount: direction * Math.abs(parseAmount(amountText ?? '0')),
      currency,
      description
    })
  })
  return transactions
}
