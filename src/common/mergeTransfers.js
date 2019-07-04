import { handleGroups } from './handleGroups'
// eslint-disable-next-line no-unused-vars
import { adjustTransactions, mergeTransfersHandler } from './transactionGroupHandler'

/**
 * @deprecated Use {@link adjustTransactions} instead
 */
export function mergeTransfers ({
  items,
  makeGroupKey,
  selectReadableTransaction = (x) => x,
  mergeComments = null
}) {
  return handleGroups({
    items: items.map(item => ({ item, transaction: null })),
    makeGroupKeys: item => {
      const key = makeGroupKey(item.item)
      return key === null ? null : [key]
    },
    handleGroup: items => {
      const transactions = mergeTransfersHandler(items.map(item => {
        if (item.transaction === null) {
          item.transaction = selectReadableTransaction(item.item)
        }
        return item.transaction
      }), {
        mergeComments: mergeComments === null ? null : (outcome, income) => {
          return mergeComments({
            ...outcome,
            item: items.find(item => item.transaction === outcome.transaction).item
          }, {
            ...income,
            item: items.find(item => item.transaction === income.transaction).item
          })
        }
      })
      return transactions ? transactions.map(transaction => ({ transaction })) : null
    }
  }).map(({ item, transaction }) => transaction || selectReadableTransaction(item))
}
