import _ from 'lodash'
import { getSingleReadableTransactionMovement } from './converters'

export function mergeTransfers ({ items, makeGroupKey, selectReadableTransaction = (x) => x }) {
  const { 1: singles = [], 2: pairs = [], collisiveBuckets = [] } = _.groupBy(
    _.toPairs(_.groupBy(items.filter((x) => makeGroupKey(x) !== null), (x) => makeGroupKey(x))),
    ([transferId, items]) => items.length > 2 ? 'collisiveBuckets' : items.length
  )
  if (singles.length > 0) {
    console.debug('Cannot find a pair for singles looking like transfers:', singles)
  }
  console.assert(collisiveBuckets.length === 0, 'Transactions have collisive transferId:', collisiveBuckets)

  const replacedByMergingMarker = null
  const replacementsByGroupKeyLookup = pairs.reduce((lookup, [transferId, items]) => {
    const [a, b] = items.map(selectReadableTransaction)
    lookup[transferId] = {
      movements: [getSingleReadableTransactionMovement(a), getSingleReadableTransactionMovement(b)],
      date: new Date(Math.min(a.date.getTime(), b.date.getTime())),
      hold: a.hold === b.hold ? a.hold : null,
      merchant: null,
      comment: a.comment || b.comment
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
