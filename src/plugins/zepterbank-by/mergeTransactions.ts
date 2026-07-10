import { Transaction } from '../../types/zenmoney'
import type { TransactionWithIdentityStage } from './converters'
import { getBusinessDateIdentityKey } from './helpers'

type TransactionSource = 'history' | 'statement'

interface SourcedTransaction {
  source: TransactionSource
  transaction: Transaction
  legacyIdentityTransaction?: Transaction
}

type TransactionWithDedupDate = Transaction & { dedupDate?: Date }

const STABLE_ID_ALIASES_KEY = 'zepterbank-by/stableMovementIdAliases'
const STABLE_ID_ALIAS_MAX_COUNT = 1000

const normalizeText = (text: string | null | undefined): string =>
  (text ?? '').replace(/\s+/g, ' ').trim()

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

const getDuplicateFingerprint = (transaction: Transaction): string => [
  getMovementAccountId(transaction),
  getDaySignature(transaction),
  getAmountSignature(transaction),
  getMccSignature(transaction),
  normalizeText(getMerchantTitle(transaction))
].join('|')

const getStableIdFingerprint = (transaction: Transaction): string => [
  getMovementAccountId(transaction),
  getDaySignature(transaction),
  getAmountSignature(transaction)
].join('|')

const makeMovementId = (fingerprint: string, occurrenceIndex: number): string =>
  ['zepterbank-by', fingerprint, occurrenceIndex].join('|')

const canPersistStableIdAliases = (): boolean =>
  typeof ZenMoney !== 'undefined' &&
  typeof ZenMoney.getData === 'function' &&
  typeof ZenMoney.setData === 'function' &&
  typeof ZenMoney.saveData === 'function'

const getStableIdAliases = (): Record<string, string> => {
  if (!canPersistStableIdAliases()) {
    return {}
  }

  const aliases = ZenMoney.getData(STABLE_ID_ALIASES_KEY, {})
  return aliases != null && typeof aliases === 'object' && !Array.isArray(aliases)
    ? aliases as Record<string, string>
    : {}
}

const setStableIdAliases = (aliases: Record<string, string>): void => {
  if (!canPersistStableIdAliases()) {
    return
  }

  const prunedAliases = Object.fromEntries(Object.entries(aliases).slice(-STABLE_ID_ALIAS_MAX_COUNT))
  ZenMoney.setData(STABLE_ID_ALIASES_KEY, prunedAliases)
  ZenMoney.saveData()
}

const shouldPreferStableIdentity = ({ source, transaction, legacyIdentityTransaction }: SourcedTransaction): boolean => {
  if ((transaction as TransactionWithIdentityStage).identityStage === 'pending') {
    return true
  }

  return source === 'statement' && legacyIdentityTransaction == null
}

const isMatchingDuplicate = (left: Transaction, right: Transaction): boolean => {
  const leftId = getMovementId(left)
  const rightId = getMovementId(right)

  if (leftId !== null && rightId !== null) {
    return leftId === rightId || getDuplicateFingerprint(left) === getDuplicateFingerprint(right)
  }

  return getDuplicateFingerprint(left) === getDuplicateFingerprint(right)
}

const withStableMovementIds = (entries: SourcedTransaction[]): Transaction[] => {
  const stableOccurrenceIndexes = new Map<string, number>()
  const legacyOccurrenceIndexes = new Map<string, number>()
  const shouldPersistStableIdAliases = canPersistStableIdAliases()
  const stableIdAliases = getStableIdAliases()
  let stableIdAliasesChanged = false

  const transactions = entries.map((entry) => {
    const { transaction } = entry
    const stableFingerprint = getStableIdFingerprint(transaction)
    const stableOccurrenceIndex = stableOccurrenceIndexes.get(stableFingerprint) ?? 0
    stableOccurrenceIndexes.set(stableFingerprint, stableOccurrenceIndex + 1)
    const stableMovementId = makeMovementId(stableFingerprint, stableOccurrenceIndex)
    const legacyFingerprint = getDuplicateFingerprint(entry.legacyIdentityTransaction ?? transaction)
    const legacyOccurrenceIndex = legacyOccurrenceIndexes.get(legacyFingerprint) ?? 0
    legacyOccurrenceIndexes.set(legacyFingerprint, legacyOccurrenceIndex + 1)
    const legacyMovementId = makeMovementId(legacyFingerprint, legacyOccurrenceIndex)
    const selectedMovementId = shouldPersistStableIdAliases
      ? stableIdAliases[stableMovementId] ?? (shouldPreferStableIdentity(entry) ? stableMovementId : legacyMovementId)
      : stableMovementId
    if (shouldPersistStableIdAliases && stableIdAliases[stableMovementId] !== selectedMovementId) {
      stableIdAliases[stableMovementId] = selectedMovementId
      stableIdAliasesChanged = true
    }
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

  if (stableIdAliasesChanged) {
    setStableIdAliases(stableIdAliases)
  }

  return transactions
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
      const legacyIdentityTransaction = mergedTransactions[duplicateHistoryIndex].transaction
      mergedTransactions[duplicateHistoryIndex] = {
        source: 'statement',
        transaction: statementTransaction,
        legacyIdentityTransaction
      }
      continue
    }

    mergedTransactions.push({
      source: 'statement',
      transaction: statementTransaction
    })
  }

  return withStableMovementIds(mergedTransactions)
}
