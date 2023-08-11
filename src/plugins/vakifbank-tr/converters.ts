import { groupBy, maxBy, minBy } from 'lodash'

import { Amount, AccountType, NonParsedMerchant, AccountOrCard } from '../../types/zenmoney'
import { TransactionWithId, VakifStatementAccount, VakifStatementTransaction } from './models'

export function parseFormattedNumber (value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.'))
}

export function parseAmount (amount: string): Amount {
  // 5.401,09
  return {
    sum: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
    instrument: 'TL'
  }
}

export function parseDateFromPdfText (text: string): string {
  const match = text.match(/^(\d{2}).(\d{2}).(\d{2,4})/)
  assert(match !== null, 'Can\'t parse date from pdf string', text)
  return `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2]}-${match[1]}T00:00:00.000`
}

export function parseDateAndTimeFromPdfText (dateStr: string, timeStr: string): string {
  const match = dateStr.match(/^(\d{2}).(\d{2}).(\d{2,4})/)
  assert(match !== null, 'Can\'t parse date from pdf string', dateStr)
  return `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2]}-${match[1]}T${timeStr}:00.500`
}

export function convertVakifPdfStatementTransaction (accountId: string, rawTransaction: VakifStatementTransaction[]): TransactionWithId[] {
  const result: TransactionWithId[] = []

  const chunks = chunksByStatementUid(rawTransaction)
  for (const transactions of chunks) {
    if (transactions.length === 1 || transactions.length === 2) {
      const mainTransaction = maxBy(transactions, x => Math.abs(parseFormattedNumber(x.amount)))
      const feeTransaction = transactions.length === 1 ? null : minBy(transactions, x => Math.abs(parseFormattedNumber(x.amount)))
      const transaction = mainTransaction
      if (transaction == null) { throw new Error('InvalidState') }
      let merchant: NonParsedMerchant | null = null
      let comment: string | null = null

      const merchanTitleRegEx = /ISLEM NO :\s*(\d{4})?-(.*?)\s\s(.*?)\*\*\*\*/
      const merchantMccRegEx = /Mcc: (\d{4})/
      const merchanTitleMatch = merchanTitleRegEx.exec(transaction.description2 ?? '')
      const merchantMccMatch = merchantMccRegEx.exec(transaction.description2 ?? '')

      if (merchanTitleMatch != null || merchantMccMatch != null) {
        merchant = {
          location: null,
          fullTitle: merchanTitleMatch?.[2] ?? '',
          mcc: merchantMccMatch == null ? null : parseInt(merchantMccMatch[1], 10)
        }
      } else {
        comment = (transaction.description1 ?? '') + ': ' + (transaction.description2 ?? '')
      }

      result.push({
        statementUid: transaction.statementUid,
        transaction: {
          comment,
          date: new Date(transaction.date),
          hold: false,
          merchant,
          movements: [
            {
              account: { id: accountId },
              fee: feeTransaction == null ? 0 : (parseFormattedNumber(feeTransaction.amount) * -1),
              id: transaction.statementUid,
              sum: parseFormattedNumber(transaction.amount),
              invoice: null
            }
          ]
        }
      })
      if (transaction.description1 === 'ATM Withdrawal') {
        result[0].transaction.comment = transaction.description2
        result[0].transaction.movements.push({
          account: {
            company: null,
            instrument: 'TL',
            syncIds: null,
            type: AccountType.cash
          },
          fee: 0,
          id: transaction.statementUid,
          sum: parseFormattedNumber(transaction.amount) * -1,
          invoice: null
        })
      }
    }
  }

  return result
}

export function convertPdfStatementAccount (rawAccount: VakifStatementAccount): AccountOrCard {
  const account: AccountOrCard = {
    id: rawAccount.id,
    balance: rawAccount.balance,
    instrument: rawAccount.instrument,
    syncIds: [rawAccount.id],
    title: rawAccount.title,
    type: AccountType.ccard
  }
  return account
}

function chunksByStatementUid (transactions: VakifStatementTransaction[]): VakifStatementTransaction[][] {
  const result = []
  const usedStatementUid = new Set<string>()
  const groped = groupBy(transactions, x => x.statementUid)
  for (let i = 0; i <= transactions.length - 1; i++) {
    if (!usedStatementUid.has(transactions[i].statementUid)) {
      result.push(groped[transactions[i].statementUid])
      usedStatementUid.add(transactions[i].statementUid)
    }
  }
  return result
}
