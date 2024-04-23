import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { AccountDetails, CardTransaction, ExchangeRatesMap } from './models'
import moment from 'moment'

export function accountDetailsToId (account: AccountDetails): string {
  return `${account.id}${account.type}`
}

function parseSum (s: string): number {
  return parseFloat(s.replace(' ', '').replace('.', '').replace(',', '.'))
}

function parseDate (s: string): Date {
  return moment(s, 'DD.MM.YYYY').toDate()
}

function tableLineRegexp (columns: number, cellContentPattern?: string): RegExp {
  cellContentPattern = cellContentPattern ?? '([^<]+)'
  const cellPattern = `<td[^>]*>${cellContentPattern}<\\/td>\\s+`
  const regexStr = `<tr[^>]*>\\s+${cellPattern.repeat(columns)}<\\/tr>`
  return new RegExp(regexStr, 'g')
}

function descriptionCleanup (s: string): string {
  const substrToRemove = ['ISPLATA VISA', 'UPLATA VISA']

  const decode = function (str: string): string {
    return str.replace(/&#(\d+);/g, function (match: string, dec): string {
      return String.fromCharCode(dec)
    })
  }
  const decodedStr = decode(s).replace('&nbsp;', ' ').trim()
  const strWithoutGarbage = substrToRemove.reduce((acc, s) => acc.replace(s, ''), decodedStr).trim()

  return strWithoutGarbage.length > 0 ? strWithoutGarbage : decodedStr
}

// 'TRGOCENTAR DOO           BEOGR' -> 'TRGOCENTAR DOO'
function stripLocationSuffix (line: string): string {
  return line.slice(0, -5).trim()
}

export function convertAccount (account: AccountDetails, data: string): AccountOrCard {
  const id = accountDetailsToId(account)

  const descriptionPattern = /<td>([\w\s]+):<\/td>\s+<td>\d+<\/td>/
  const description = descriptionPattern.exec(data)

  const balancePattern = /<td>Balance for currency (\w+) \d+:<\/td>\s+<td>([\d.,]+)\s+<\/table>/
  const balance = balancePattern.exec(data)

  return {
    id,
    type: AccountType.ccard,
    title: description ? description[1] : id,
    instrument: balance ? balance[1] : 'RSD',
    balance: balance ? parseSum(balance[2]) : 0,
    creditLimit: 0,
    syncIds: [id]
  }
}

export function convertCardTransactions (data: string): CardTransaction[] {
  const transactions: CardTransaction[] = []

  const matches = data.matchAll(tableLineRegexp(6))

  for (const t of matches) {
    const [, date, sum, currency, authorizationDate, desc] = t

    const transaction: CardTransaction = {
      date: parseDate(date),
      authorizationDate: (authorizationDate.trim() !== '') ? parseDate(authorizationDate) : null,
      amount: {
        // Amount sign is not true for unauthorized transaction so ignore it.
        // We will restore the sign later according to a corresponding account transaction's sign
        sum: Math.abs(parseSum(sum)),
        instrument: currency
      },
      merchant: descriptionCleanup(stripLocationSuffix(desc))
    }

    transactions.push(transaction)
  }

  return transactions.reverse()
}

export function convertTransactions (accountId: string, data: string): Transaction[] {
  const transactions: Transaction[] = []

  const matches = data.matchAll(tableLineRegexp(6))

  for (const t of matches) {
    const [, date, desc, , sum] = t

    transactions.push({
      hold: false,
      date: parseDate(date),
      movements: [
        {
          id: null,
          account: { id: accountId },
          // TODO: parse from /kartizv.jsp
          invoice: null,
          sum: parseSum(sum),
          fee: 0
        }
      ],
      merchant: desc != null
        ? {
            fullTitle: descriptionCleanup(desc),
            mcc: null,
            location: null
          }
        : null,
      comment: null
    })
  }

  return transactions.reverse()
}

export function convertExchangeRates (data: string): ExchangeRatesMap {
  const exchangeRates: ExchangeRatesMap = new Map()

  const cellContentPattern = '(?:<img[^<]+/>)?([^<]+)(?:<br></br>)?'
  const matches = data.matchAll(tableLineRegexp(9, cellContentPattern))

  for (const t of matches) {
    // Currency code, Currency designation, Country, Unit, Buying rate, Middle rate, Selling rate, Buying rate (cash), Selling rate (cash)
    const [, , currency, , , , middleRate] = t
    exchangeRates.set(currency, parseFloat(middleRate.trim()))
  }

  return exchangeRates
}
