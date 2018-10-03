import _ from 'lodash'
import { convertReadableTransactionToReadableTransferSide } from './converters'

export function mergeTransfers ({ items, isTransferItem, makeGroupKey, selectTransactionId, selectReadableTransaction }) {
  const { 1: singles = [], 2: pairs = [], collisiveBuckets = [] } = _.groupBy(
    _.toPairs(_.groupBy(items.filter(isTransferItem), (x) => makeGroupKey(x))),
    ([transferId, items]) => items.length > 2 ? 'collisiveBuckets' : items.length
  )
  if (singles.length > 0) {
    console.debug('Cannot find a pair for singles looking like transfers:', JSON.stringify(singles, null, 2))
  }
  if (collisiveBuckets.length > 0) {
    throw new Error('Transactions have collisive transferId:' + JSON.stringify(collisiveBuckets, null, 2))
  }

  const replacedByMergingMarker = null
  const replacementsByTransactionIdLookup = pairs.reduce((lookup, [transferId, items]) => {
    const dates = _.uniqBy(items.map((x) => selectReadableTransaction(x).date), (x) => x.valueOf())
    console.assert(dates.length === 1, 'transfer dates must be equal', { dates, transferId })
    const date = dates[0]
    const hold = items.some((x) => selectReadableTransaction(x).hold)
    const sides = items.map((x) => convertReadableTransactionToReadableTransferSide(selectReadableTransaction(x)))
    return items.reduce((lookup, item, index) => {
      const id = selectTransactionId(item)
      console.assert(id, 'transaction id must be provided')
      console.assert(_.isUndefined(lookup[id]), 'transfer side replacement is already defined')
      lookup[id] = index === 0
        ? {
          type: 'transfer',
          date,
          hold,
          sides,
          comment: null
        }
        : replacedByMergingMarker
      return lookup
    }, lookup)
  }, {})

  const readableTransactions = items.map((item) => {
    const replacement = replacementsByTransactionIdLookup[selectTransactionId(item)]
    return _.isUndefined(replacement) ? selectReadableTransaction(item) : replacement
  }).filter((x) => x !== replacedByMergingMarker)

  const expectedLength = items.length - pairs.length
  const actualLength = readableTransactions.length
  console.assert(actualLength === expectedLength, 'transactions count checksum mismatch', { actualLength, expectedLength })

  return readableTransactions
}
