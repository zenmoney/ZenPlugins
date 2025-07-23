import { AccountType, Transaction, Account } from '../../types/zenmoney'
import { AccountDetails } from './models'
import moment from 'moment'

function accountDetailsToId (account: AccountDetails): string {
  return `${account.id}${account.type}`
}

function parseSum (s: string): number {
  return parseFloat(s.replace(' ', '').replace('.', '').replace(',', '.'))
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

export function convertAccount (account: AccountDetails, data: string): Account {
  const id = accountDetailsToId(account)

  const descriptionPattern = /<td>([\w\s]+):<\/td>\s+<td>\d+<\/td>/
  const description = descriptionPattern.exec(data)

  const balancePattern = /<td>Balance for currency (\w+) \d+:<\/td>\s+<td>([\d.,]+)\s+<\/table>/
  const balance = balancePattern.exec(data)

  return {
    id,
    type: AccountType.ccard,
    title: (description != null) ? description[1] : id,
    instrument: (balance != null) ? balance[1] : 'RSD',
    balance: (balance != null) ? parseSum(balance[2]) : 0,
    creditLimit: 0,
    syncIds: [id]
  }
}

export function convertTransactions (account: AccountDetails, data: string): Transaction[] {
  const transactions: Transaction[] = []

  const regexp = /<tr>\s+<td[^>]+>([\d.]+)<\/td>\s+<td[^>]+>([^<]+)<\/td>\s+<td[^>]+>(\w+)\s\d+<\/td>\s+<td[^>]+>\+?([-\d,.]+)<\/td>/g
  const matches = data.matchAll(regexp)

  for (const t of matches) {
    const [, date, desc, , sum] = t

    transactions.push({
      hold: false,
      date: moment(date, 'DD.MM.YYYY').toDate(),
      movements: [
        {
          id: null,
          account: { id: accountDetailsToId(account) },
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
