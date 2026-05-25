import { Transaction } from '../../types/zenmoney'

type TransactionSource = 'history' | 'statement'

interface SourcedTransaction {
  source: TransactionSource
  transaction: Transaction
}

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
  transaction.date.toISOString().slice(0, 10)

const getDuplicateFingerprint = (transaction: Transaction): string => [
  getMovementAccountId(transaction),
  getDaySignature(transaction),
  getAmountSignature(transaction),
  getMccSignature(transaction),
  normalizeText(getMerchantTitle(transaction))
].join('|')

const isMatchingDuplicate = (left: Transaction, right: Transaction): boolean => {
  const leftId = getMovementId(left)
  const rightId = getMovementId(right)

  if (leftId !== null && rightId !== null) {
    return leftId === rightId
  }

  return getDuplicateFingerprint(left) === getDuplicateFingerprint(right)
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
        transaction: statementTransaction
      }
      continue
    }

    mergedTransactions.push({
      source: 'statement',
      transaction: statementTransaction
    })
  }

  return mergedTransactions.map(({ transaction }) => transaction)
}
