import { groupBy, maxBy, minBy } from 'lodash'

import { Amount, AccountType, NonParsedMerchant, AccountOrCard, Transaction } from '../../types/zenmoney'
import { TransactionWithId, VakifStatementAccount, VakifStatementTransaction } from './models'

const MERCHANT_TITLE_REGEX = /ISLEM NO :\s*(\d{4})?-(.*?)\s\s(.*?)\*\*\*\*/
const MERCHANT_MCC_REGEX = /Mcc: (\d{4})/

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
      if (mainTransaction == null) { throw new Error('InvalidState') }

      const merchant = extractMerchantInfo(mainTransaction)
      const comment = merchant ? null : `${mainTransaction.description1 ?? ''}: ${mainTransaction.description2 ?? ''}`

      const transaction: Transaction = {
        comment,
        date: new Date(mainTransaction.date),
        hold: false,
        merchant,
        movements: [
          {
            account: { id: accountId },
            fee: feeTransaction == null ? 0 : parseFormattedNumber(feeTransaction.amount),
            id: mainTransaction.statementUid,
            sum: parseFormattedNumber(mainTransaction.amount),
            invoice: null
          }
        ]
      }

      if (mainTransaction.description1 === 'ATM Withdrawal') {
        transaction.comment = mainTransaction.description2
        transaction.movements.push(createATMWithdrawalMovement(mainTransaction))
      }

      result.push({
        statementUid: mainTransaction.statementUid,
        transaction
      })
    }
  }

  return result
}

function createATMWithdrawalMovement (transaction: VakifStatementTransaction): Transaction['movements'][number] {
  return {
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
  }
}

function extractMerchantInfo (transaction: VakifStatementTransaction): NonParsedMerchant | null {
  const merchanTitleMatch = MERCHANT_TITLE_REGEX.exec(transaction.description2 ?? '')
  const merchantMccMatch = MERCHANT_MCC_REGEX.exec(transaction.description2 ?? '')

  if (merchanTitleMatch || merchantMccMatch) {
    return {
      location: null,
      fullTitle: merchanTitleMatch?.[2] ?? '',
      mcc: merchantMccMatch ? parseInt(merchantMccMatch[1], 10) : null
    }
  }
  return null
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
