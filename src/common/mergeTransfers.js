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
    const readableTransactions = items.map(selectReadableTransaction)
    const date = new Date(Math.min(readableTransactions[0].date.getTime(), readableTransactions[1].date.getTime()))
    const hold = readableTransactions[0].hold === readableTransactions[1].hold ? readableTransactions[0].hold : null
    const comment = readableTransactions[0].comment || readableTransactions[1].comment
    const movements = readableTransactions.map((x) => getSingleReadableTransactionMovement(x))
    lookup[transferId] = {
      movements,
      date,
      hold,
      merchant: null,
      comment
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
