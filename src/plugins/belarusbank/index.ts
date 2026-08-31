import md5 from 'crypto-js/md5'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import type { ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { authenticate, getGeneralPaymentHistory, getProducts, getStatementTransactions } from './api'
import type { PreferenceInput } from './models'

const PAYMENT_DUPLICATE_WINDOW_MS = 0
const LEGACY_TRANSACTION_ID_STATE_KEY = 'belarusbankTransactionIds'

interface CanonicalTransactionIdentity {
  id: string
  key: string
  transaction: ExtendedTransaction
}

const clearLegacyTransactionIdState = (): void => {
  if (ZenMoney.getData(LEGACY_TRANSACTION_ID_STATE_KEY, undefined) === undefined) return

  ZenMoney.setData(LEGACY_TRANSACTION_ID_STATE_KEY, undefined)
  ZenMoney.saveData()
}

const getCanonicalTransactionIdentity = (
  transaction: ExtendedTransaction,
  accountInstruments: Map<string, string>
): CanonicalTransactionIdentity | null => {
  if (transaction.movements.length !== 1) return null

  const movement = transaction.movements[0]
  if (!('id' in movement.account) || movement.sum == null) return null
  const instrument = accountInstruments.get(movement.account.id)
  if (instrument == null) return null

  const key = JSON.stringify({
    accountId: movement.account.id,
    date: transaction.date.toISOString(),
    amountInMinorUnits: Math.round(movement.sum * 100),
    instrument
  })
  return {
    id: md5(`belarusbank:${key}`).toString(),
    key,
    transaction
  }
}

const assignCanonicalTransactionIds = (
  transactions: ExtendedTransaction[],
  accountInstruments: Map<string, string>
): void => {
  const groups = new Map<string, CanonicalTransactionIdentity[]>()
  for (const transaction of transactions) {
    const identity = getCanonicalTransactionIdentity(transaction, accountInstruments)
    if (identity == null) continue
    const group = groups.get(identity.key) ?? []
    group.push(identity)
    groups.set(identity.key, group)
  }

  for (const group of groups.values()) {
    // An ambiguous same-second/same-amount group cannot be matched safely across sources.
    // Keep its source-specific unique IDs instead of collapsing legitimate operations.
    if (group.length !== 1) continue
    group[0].transaction.movements[0].id = group[0].id
  }
}

interface StatementMovementMatch {
  statementIndex: number
  movementIndex: number
}

const findStatementMovementMatch = (
  payment: ExtendedTransaction,
  statementTransactions: ExtendedTransaction[],
  matchedStatementMovements: Set<string>
): StatementMovementMatch | null => {
  if (payment.movements.length !== 1) return null
  const paymentMovement = payment.movements[0]
  const paymentAccountId = 'id' in paymentMovement.account ? paymentMovement.account.id : null
  const paymentSum = paymentMovement.sum
  if (paymentAccountId == null || paymentSum == null) return null
  const matches: StatementMovementMatch[] = []

  for (let statementIndex = 0; statementIndex < statementTransactions.length; statementIndex += 1) {
    const transaction = statementTransactions[statementIndex]
    if (Math.abs(transaction.date.getTime() - payment.date.getTime()) > PAYMENT_DUPLICATE_WINDOW_MS) continue

    for (let movementIndex = 0; movementIndex < transaction.movements.length; movementIndex += 1) {
      const matchKey = `${statementIndex}:${movementIndex}`
      if (matchedStatementMovements.has(matchKey)) continue

      const movement = transaction.movements[movementIndex]
      if (
        'id' in movement.account &&
        movement.account.id === paymentAccountId &&
        movement.sum != null &&
        Math.abs(movement.sum - paymentSum) < 0.005
      ) {
        matches.push({ statementIndex, movementIndex })
      }
    }
  }

  return matches.length === 1 ? matches[0] : null
}

const mergeStatementAndPaymentHistory = (
  statementTransactions: ExtendedTransaction[],
  paymentHistory: ExtendedTransaction[]
): ExtendedTransaction[] => {
  const matchedStatementMovements = new Set<string>()
  const unmatchedPayments: ExtendedTransaction[] = []

  for (const payment of paymentHistory) {
    const match = findStatementMovementMatch(payment, statementTransactions, matchedStatementMovements)
    if (match == null) {
      unmatchedPayments.push(payment)
      continue
    }

    matchedStatementMovements.add(`${match.statementIndex}:${match.movementIndex}`)
  }

  return [...statementTransactions, ...unmatchedPayments]
}

export const scrape: ScrapeFunc<PreferenceInput> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  clearLegacyTransactionIdState()
  const auth = await authenticate(preferences, isInBackground)
  console.log('[BELARUSBANK:AUTH] Success')

  const products = await getProducts(auth)
  console.log('[BELARUSBANK:PRODUCTS] Successfully fetched', products.length, 'product(s)')

  const transactions: ExtendedTransaction[] = []
  const transactionEndDate = toDate ?? new Date()
  const cards = products.filter((product) =>
    product._meta.productKind === 'card' && !ZenMoney.isAccountSkipped(product.id)
  )
  const statementTransactions: ExtendedTransaction[] = []

  for (const card of cards) {
    statementTransactions.push(...await getStatementTransactions(auth, card, fromDate, transactionEndDate))
  }
  const paymentHistory = await getGeneralPaymentHistory(auth, cards, fromDate, transactionEndDate)
  const accountInstruments = new Map(products.map((product) => [product.id, product.instrument]))
  assignCanonicalTransactionIds(statementTransactions, accountInstruments)
  assignCanonicalTransactionIds(paymentHistory, accountInstruments)
  transactions.push(...mergeStatementAndPaymentHistory(statementTransactions, paymentHistory))

  const adjustedTransactions = adjustTransactions({ transactions })
  for (const transaction of adjustedTransactions) {
    if (transaction.movements.length !== 2) continue
    transaction.movements[0].invoice = null
    transaction.movements[1].invoice = null
  }

  return {
    accounts: products,
    transactions: adjustedTransactions
  }
}
