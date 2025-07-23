import { groupBy, maxBy, minBy } from 'lodash'

import { Amount, AccountType, NonParsedMerchant, AccountOrCard, Transaction } from '../../types/zenmoney'
import { TransactionWithId, VakifStatementAccount, VakifStatementTransaction } from './models'

const MERCHANT_TITLE_REGEX = /ISLEM NO :\s*(\d{4})?-(.*?)\s\s(.*?)\*\*\*\*/
const MERCHANT_MCC_REGEX = /Mcc: (\d{4})/

// converters.ts
export function parseFormattedNumber (value: string): number {
  // 1. Trim & normalise minus sign variants (-, – , − → -)
  const cleaned = value
    .trim()
    .replace(/[-–−]/g, '-') // all minus‐like chars → ASCII -
    .replace(/[^\d,.-]/g, '') // strip everything except digits, dot, comma, minus
    .replace(/[.,](?=.*[.,])/g, '') // drop every thousands sep → leave last one as decimal
    .replace(',', '.') // decimal comma → dot

  if (cleaned === '' || cleaned === '-' || cleaned === '.') { return NaN } // caller can decide what to do with bad cells

  return parseFloat(cleaned)
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
    if (transactions.length !== 1 && transactions.length !== 2) continue

    const transaction = buildTransaction(accountId, transactions)
    result.push(transaction)
  }

  return result
}

function buildTransaction (accountId: string, transactions: VakifStatementTransaction[]): TransactionWithId {
  const mainTransaction = getMainTransaction(transactions)
  const feeAmount = getFeeAmount(transactions)
  const merchant = extractMerchantInfo(mainTransaction)
  const comment = (merchant != null) ? null : `${mainTransaction.description1 ?? ''}: ${mainTransaction.description2 ?? ''}`

  const transaction: Transaction = {
    comment,
    date: new Date(mainTransaction.date),
    hold: false,
    merchant,
    movements: [
      createMainMovement(accountId, mainTransaction, feeAmount)
    ]
  }

  if (mainTransaction.description1 === 'ATM Withdrawal' || mainTransaction.description1 === 'ATM QR Withdrawal') {
    transaction.comment = mainTransaction.description2
    transaction.movements.push(createOppositeMovement(mainTransaction, AccountType.cash))
  }

  return {
    statementUid: mainTransaction.statementUid,
    transaction
  }
}

function getMainTransaction (transactions: VakifStatementTransaction[]): VakifStatementTransaction {
  const mainTransaction = maxBy(transactions, x => Math.abs(parseFormattedNumber(x.amount)))
  if (mainTransaction == null) throw new Error('InvalidState')
  return mainTransaction
}

function getFeeAmount (transactions: VakifStatementTransaction[]): number {
  if (transactions.length !== 2) return 0

  const feeTransaction = minBy(transactions, x => Math.abs(parseFormattedNumber(x.amount)))
  return (feeTransaction != null) ? parseFormattedNumber(feeTransaction.amount) : 0
}

function createMainMovement (
  accountId: string,
  transaction: VakifStatementTransaction,
  feeAmount: number
): Transaction['movements'][number] {
  return {
    account: { id: accountId },
    fee: feeAmount,
    id: transaction.statementUid,
    sum: parseFormattedNumber(transaction.amount),
    invoice: null
  }
}

function createOppositeMovement (
  transaction: VakifStatementTransaction,
  accountType: AccountType
): Transaction['movements'][number] {
  return {
    account: {
      company: null,
      instrument: 'TL',
      syncIds: null,
      type: accountType
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

  if (merchanTitleMatch != null || merchantMccMatch != null) {
    return {
      location: null,
      fullTitle: merchanTitleMatch?.[2] ?? '',
      mcc: (merchantMccMatch != null) ? parseInt(merchantMccMatch[1], 10) : null
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
