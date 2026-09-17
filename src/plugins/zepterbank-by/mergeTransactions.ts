import { Transaction } from '../../types/zenmoney'
import md5 from 'crypto-js/md5'
import type { TransactionWithIdentityStage } from './converters'
import { getBusinessDateIdentityKey } from './helpers'

type TransactionSource = 'history' | 'statement'

interface SourcedTransaction {
  source: TransactionSource
  transaction: Transaction
  matchedHistory?: boolean
}

type TransactionWithDedupDate = Transaction & { dedupDate?: Date }

const MERCHANT_ID_PREFIX_LENGTH = 25
const SAFE_MERCHANT_PREFIX_MIN_LENGTH = 16

const normalizeText = (text: string | null | undefined): string =>
  (text ?? '').replace(/\s+/g, ' ').trim()

const normalizeMerchant = (text: string | null | undefined): string =>
  normalizeText(text)
    .replace(/&quot;/g, '"')
    .toUpperCase()
    .split(/[^0-9A-ZА-ЯЁІЎ]+/g)
    .filter(Boolean)
    .join(' ')

const getMerchantTitle = (transaction: Transaction): string => {
  const { merchant } = transaction

  if (merchant == null) {
    return ''
  }

  return 'fullTitle' in merchant
    ? merchant.fullTitle
    : merchant.title
}

const getMovementAccountId = (transaction: Transaction): string => {
  const account = transaction.movements[0]?.account

  if (account != null && 'id' in account) {
    return account.id
  }

  return ''
}

const getMovementId = (transaction: Transaction): string | null =>
  transaction.movements[0]?.id ?? null

const getAmountSignature = (transaction: Transaction): string => {
  const movement = transaction.movements[0]

  if (movement == null) {
    return ''
  }

  if (movement.invoice != null) {
    return `invoice|${movement.invoice.instrument}|${movement.invoice.sum}`
  }

  return `sum|${movement.sum ?? ''}`
}

const getMccSignature = (transaction: Transaction): string => {
  const { merchant } = transaction

  return merchant != null ? String(merchant.mcc ?? '') : ''
}

const getDaySignature = (transaction: Transaction): string =>
  getBusinessDateIdentityKey((transaction as TransactionWithDedupDate).dedupDate ?? transaction.date)

const getDuplicateBaseFingerprint = (transaction: Transaction): string => [
  getMovementAccountId(transaction),
  getDaySignature(transaction),
  getAmountSignature(transaction),
  getMccSignature(transaction)
].join('|')

const areMerchantTitlesCompatible = (left: Transaction, right: Transaction): boolean => {
  const leftMerchant = normalizeMerchant(getMerchantTitle(left))
  const rightMerchant = normalizeMerchant(getMerchantTitle(right))

  if (leftMerchant === rightMerchant) {
    return true
  }

  if (leftMerchant === '' || rightMerchant === '') {
    return false
  }

  const leftPrefix = leftMerchant.slice(0, MERCHANT_ID_PREFIX_LENGTH)
  const rightPrefix = rightMerchant.slice(0, MERCHANT_ID_PREFIX_LENGTH)

  if (leftPrefix === rightPrefix) {
    return true
  }

  return Math.min(leftMerchant.length, rightMerchant.length) >= SAFE_MERCHANT_PREFIX_MIN_LENGTH &&
    (leftMerchant.startsWith(rightMerchant) || rightMerchant.startsWith(leftMerchant))
}

const getStableIdFingerprint = (transaction: Transaction): string => [
  getMovementAccountId(transaction),
  getDaySignature(transaction),
  getAmountSignature(transaction)
].join('|')

const getMovementInstrumentSignature = (transaction: Transaction): string =>
  transaction.movements[0]?.invoice?.instrument ?? 'account'

const getMovementDirection = (transaction: Transaction): number => {
  const movement = transaction.movements[0]
  return Math.sign(movement?.invoice?.sum ?? movement?.sum ?? 0)
}

const getPartialSettlementFingerprint = (transaction: Transaction): string => [
  getMovementAccountId(transaction),
  getDaySignature(transaction),
  getMovementInstrumentSignature(transaction),
  getMovementDirection(transaction),
  getMccSignature(transaction),
  normalizeMerchant(getMerchantTitle(transaction)).slice(0, MERCHANT_ID_PREFIX_LENGTH)
].join('|')

const getAbsoluteMovementAmount = (transaction: Transaction): number => {
  const movement = transaction.movements[0]
  return Math.abs(movement?.invoice?.sum ?? movement?.sum ?? 0)
}

const hasReliableMerchantIdentity = (transaction: Transaction): boolean =>
  normalizeText(getMerchantTitle(transaction)) !== '' && getMccSignature(transaction) !== ''

const isPendingPurchase = (transaction: Transaction): boolean =>
  (transaction as TransactionWithIdentityStage).identityStage === 'pending' &&
  getMovementDirection(transaction) < 0 &&
  hasReliableMerchantIdentity(transaction)

const makeMovementId = (fingerprint: string, occurrenceIndex: number): string =>
  md5(['zepterbank-by', fingerprint, occurrenceIndex].join('|')).toString()

const isMatchingDuplicate = (left: Transaction, right: Transaction): boolean => {
  const leftId = getMovementId(left)
  const rightId = getMovementId(right)

  if (leftId !== null && rightId !== null && leftId === rightId) {
    return true
  }

  return getDuplicateBaseFingerprint(left) === getDuplicateBaseFingerprint(right) &&
    areMerchantTitlesCompatible(left, right)
}

const reconcileUnambiguousPartialSettlements = (entries: SourcedTransaction[]): SourcedTransaction[] => {
  const pendingHistoryIndexesByKey = new Map<string, number[]>()
  const unmatchedStatementIndexesByKey = new Map<string, number[]>()

  for (const [index, entry] of entries.entries()) {
    if (entry.source === 'history' && isPendingPurchase(entry.transaction)) {
      const key = getPartialSettlementFingerprint(entry.transaction)
      pendingHistoryIndexesByKey.set(key, [...pendingHistoryIndexesByKey.get(key) ?? [], index])
    } else if (entry.source === 'statement' && entry.matchedHistory !== true && hasReliableMerchantIdentity(entry.transaction)) {
      const key = getPartialSettlementFingerprint(entry.transaction)
      unmatchedStatementIndexesByKey.set(key, [...unmatchedStatementIndexesByKey.get(key) ?? [], index])
    }
  }

  const indexesToRemove = new Set<number>()

  for (const [key, pendingHistoryIndexes] of pendingHistoryIndexesByKey) {
    const unmatchedStatementIndexes = unmatchedStatementIndexesByKey.get(key) ?? []

    if (pendingHistoryIndexes.length !== 1 || unmatchedStatementIndexes.length !== 1) {
      continue
    }

    const [pendingHistoryIndex] = pendingHistoryIndexes
    const [unmatchedStatementIndex] = unmatchedStatementIndexes
    const pendingHistoryEntry = entries[pendingHistoryIndex]
    const unmatchedStatementEntry = entries[unmatchedStatementIndex]
    const pendingAmount = getAbsoluteMovementAmount(pendingHistoryEntry.transaction)
    const settledAmount = getAbsoluteMovementAmount(unmatchedStatementEntry.transaction)

    if (settledAmount <= 0 || settledAmount >= pendingAmount) {
      continue
    }

    entries[pendingHistoryIndex] = {
      source: 'statement',
      transaction: unmatchedStatementEntry.transaction,
      matchedHistory: true
    }
    indexesToRemove.add(unmatchedStatementIndex)
  }

  return entries.filter((_entry, index) => !indexesToRemove.has(index))
}

const withStableMovementIds = (entries: SourcedTransaction[]): Transaction[] => {
  const stableOccurrenceIndexes = new Map<string, number>()

  return entries.map((entry) => {
    const { transaction } = entry
    const stableFingerprint = getStableIdFingerprint(transaction)
    const stableOccurrenceIndex = stableOccurrenceIndexes.get(stableFingerprint) ?? 0
    stableOccurrenceIndexes.set(stableFingerprint, stableOccurrenceIndex + 1)
    const selectedMovementId = makeMovementId(stableFingerprint, stableOccurrenceIndex)
    const [firstMovement, secondMovement] = transaction.movements
    const firstMovementWithStableId = {
      ...firstMovement,
      id: selectedMovementId
    }
    const movements: Transaction['movements'] = secondMovement == null
      ? [firstMovementWithStableId]
      : [firstMovementWithStableId, secondMovement]

    return {
      ...transaction,
      movements
    }
  })
}

export const mergeTransactions = (historyTransactions: Transaction[], statementTransactions: Transaction[]): Transaction[] => {
  const mergedTransactions: SourcedTransaction[] = historyTransactions.map((transaction) => ({
    source: 'history',
    transaction
  }))

  for (const statementTransaction of statementTransactions) {
    const duplicateHistoryIndex = mergedTransactions.findIndex(({ source, transaction }) =>
      source === 'history' && isMatchingDuplicate(transaction, statementTransaction)
    )

    if (duplicateHistoryIndex !== -1) {
      mergedTransactions[duplicateHistoryIndex] = {
        source: 'statement',
        transaction: statementTransaction,
        matchedHistory: true
      }
      continue
    }

    mergedTransactions.push({
      source: 'statement',
      transaction: statementTransaction
    })
  }

  return withStableMovementIds(reconcileUnambiguousPartialSettlements(mergedTransactions))
}
