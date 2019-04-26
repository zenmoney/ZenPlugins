import _ from 'lodash'
import { getSingleReadableTransactionMovement } from './converters'
import { isDebug } from './utils'

export function mergeTransfers ({
  items,
  makeGroupKey,
  selectReadableTransaction = (x) => x,
  getSingleMovement = getSingleReadableTransactionMovement,
  mergeComments = null,
  throwOnCollision = true
}) {
  const { 1: singles = [], 2: pairs = [], collisiveBuckets = [] } = _.groupBy(
    _.toPairs(_.groupBy(items.filter((x) => makeGroupKey(x) !== null), (x) => makeGroupKey(x))),
    ([transferId, items]) => items.length > 2 ? 'collisiveBuckets' : items.length
  )
  if (singles.length > 0 && isDebug()) {
    console.debug('Cannot find a pair for singles looking like transfers:', singles)
  }
  if (collisiveBuckets.length > 0) {
    if (throwOnCollision) {
      console.assert(false, 'Transactions have collisive transferId:', collisiveBuckets)
    } else if (isDebug()) {
      console.debug('Transactions have collisive transferId:', collisiveBuckets)
    }
  }

  const replacedByMergingMarker = null
  const replacementsByGroupKeyLookup = pairs.reduce((lookup, [transferId, pair]) => {
    const [outcome, income] = _.sortBy(pair.map((item) => {
      const transaction = selectReadableTransaction(item)
      return {
        item,
        transaction,
        movement: getSingleMovement(transaction)
      }
    }), (x) => x.movement.sum >= 0)
    if (outcome.movement.sum < 0 && income.movement.sum > 0 &&
      (outcome.movement.account.id || income.movement.account.id) &&
      (outcome.movement.account.id !== income.movement.account.id)) {
      lookup[transferId] = {
        movements: [outcome.movement, income.movement],
        date: new Date(Math.min(outcome.transaction.date.getTime(), income.transaction.date.getTime())),
        hold: outcome.transaction.hold === income.transaction.hold ? outcome.transaction.hold : null,
        merchant: null,
        comment: mergeComments === null
          ? outcome.transaction.comment || income.transaction.comment
          : mergeComments(outcome, income)
      }
    } else if (throwOnCollision) {
      console.assert(false, 'Transaction pair can not be merged\n', outcome.item, '\n', income.item)
    }
    return lookup
  }, {})

  const readableTransactions = items.map((item) => {
    const key = makeGroupKey(item)
    if (key !== null) {
      const replacement = replacementsByGroupKeyLookup[key]
      if (!_.isUndefined(replacement)) {
        if (replacement !== replacedByMergingMarker) {
          replacementsByGroupKeyLookup[key] = replacedByMergingMarker
        }
        return replacement
      }
    }
    return selectReadableTransaction(item)
  }).filter((x) => x !== replacedByMergingMarker)

  const expectedLength = items.length - Object.keys(replacementsByGroupKeyLookup).length
  const actualLength = readableTransactions.length
  console.assert(actualLength === expectedLength, 'transactions count checksum mismatch', { actualLength, expectedLength })

  return readableTransactions
}
