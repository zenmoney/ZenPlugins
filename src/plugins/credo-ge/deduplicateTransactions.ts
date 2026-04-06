import { ExtendedTransaction, Movement, Transaction } from '../../types/zenmoney'
import { Transaction as CredoTransaction } from './models'

interface TransactionEntry {
  apiTransaction: CredoTransaction
  transaction: ExtendedTransaction
}

function getOperationId (entry: TransactionEntry): string | null {
  const operationId = entry.apiTransaction.operationId?.trim()
  return operationId == null || operationId === '' ? null : operationId
}

function getStmtEntryId (entry: TransactionEntry): string | null {
  const stmtEntryId = entry.apiTransaction.stmtEntryId.trim()
  return stmtEntryId === '' ? null : stmtEntryId
}

function getFallbackFingerprint (transaction: ExtendedTransaction): string {
  const movement = transaction.movements[0]
  const accountId = getMovementAccountId(movement)
  const invoice = movement.invoice
  const invoiceSum = invoice == null ? '' : String(invoice.sum)
  const invoiceInstrument = invoice == null ? '' : invoice.instrument
  return [
    accountId,
    String(transaction.date.getTime()),
    String(movement.sum),
    invoiceSum,
    invoiceInstrument,
    normalizeText(getMerchantTitle(transaction)),
    normalizeText(transaction.comment)
  ].join('|')
}

function getMerchantTitle (transaction: ExtendedTransaction): string | null {
  const merchant = transaction.merchant
  if (merchant == null) {
    return null
  }
  if ('fullTitle' in merchant) {
    return merchant.fullTitle
  }
  return merchant.title
}

function getMovementAccountId (movement: Movement): string {
  const account = movement.account
  if ('id' in account) {
    return account.id
  }
  return [account.type, account.instrument, account.company?.id ?? '', (account.syncIds ?? []).join(',')].join('|')
}

function normalizeText (text: string | null): string {
  if (text == null) {
    return ''
  }
  return text.replace(/\s+/g, ' ').trim()
}

function shouldDedupe (transaction: ExtendedTransaction): boolean {
  if (transaction.movements.length !== 1) {
    return false
  }

  const groupKeys = transaction.groupKeys ?? []
  return !groupKeys.some(key => key !== null)
}

function shouldReplace (current: ExtendedTransaction, next: ExtendedTransaction): boolean {
  return current.hold !== false && next.hold === false
}

function isDuplicate (current: TransactionEntry, next: TransactionEntry): boolean {
  const currentOperationId = getOperationId(current)
  const nextOperationId = getOperationId(next)
  if (currentOperationId != null && nextOperationId != null) {
    return currentOperationId === nextOperationId
  }

  const currentStmtEntryId = getStmtEntryId(current)
  const nextStmtEntryId = getStmtEntryId(next)
  if (currentStmtEntryId != null && nextStmtEntryId != null && currentStmtEntryId === nextStmtEntryId) {
    return true
  }

  return getFallbackFingerprint(current.transaction) === getFallbackFingerprint(next.transaction)
}

export function deduplicateTransactions (entries: TransactionEntry[]): Transaction[] {
  const result: Array<{ entry: TransactionEntry | null, transaction: Transaction }> = []

  for (const entry of entries) {
    if (!shouldDedupe(entry.transaction)) {
      result.push({ entry: null, transaction: entry.transaction })
      continue
    }

    const index = result.findIndex(item => item.entry != null && isDuplicate(item.entry, entry))
    if (index === -1) {
      result.push({ entry, transaction: entry.transaction })
      continue
    }

    const current = result[index].transaction as ExtendedTransaction
    if (shouldReplace(current, entry.transaction)) {
      result[index] = { entry, transaction: entry.transaction }
    }
  }

  return result.map(item => item.transaction)
}
