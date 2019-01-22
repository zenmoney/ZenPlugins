import _ from 'lodash'
import { getSingleReadableTransactionMovement } from './converters'
import { isDebug } from './utils'

export function mergeTransfers ({ items, makeGroupKey, selectReadableTransaction = (x) => x, mergeComments = null }) {
  const { 1: singles = [], 2: pairs = [], collisiveBuckets = [] } = _.groupBy(
    _.toPairs(_.groupBy(items.filter((x) => makeGroupKey(x) !== null), (x) => makeGroupKey(x))),
    ([transferId, items]) => items.length > 2 ? 'collisiveBuckets' : items.length
  )
  if (singles.length > 0 && isDebug()) {
    console.debug('Cannot find a pair for singles looking like transfers:', singles)
  }
  console.assert(collisiveBuckets.length === 0, 'Transactions have collisive transferId:', collisiveBuckets)

  const replacedByMergingMarker = null
  const replacementsByGroupKeyLookup = pairs.reduce((lookup, [transferId, pair]) => {
    const [outcome, income] = _.sortBy(pair.map((item) => {
      const transaction = selectReadableTransaction(item)
      return {
        item,
        transaction,
        movement: getSingleReadableTransactionMovement(transaction)
      }
    }), (x) => x.movement.sum >= 0)
    console.assert(outcome.movement.sum < 0, 'outcome', outcome)
    console.assert(income.movement.sum > 0, 'income', income)
    lookup[transferId] = {
      movements: [outcome.movement, income.movement],
      date: new Date(Math.min(outcome.transaction.date.getTime(), income.transaction.date.getTime())),
      hold: outcome.transaction.hold === income.transaction.hold ? outcome.transaction.hold : null,
      merchant: null,
      comment: mergeComments === null
        ? outcome.transaction.comment || income.transaction.comment
        : mergeComments(outcome, income)
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

  const expectedLength = items.length - pairs.length
  const actualLength = readableTransactions.length
  console.assert(actualLength === expectedLength, 'transactions count checksum mismatch', { actualLength, expectedLength })

  return readableTransactions
}
