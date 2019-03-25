import * as _ from 'lodash'

const isEqualTransactions = distinctByFields =>
  (a, b) =>
    _.isEqual(
      distinctByFields(a),
      distinctByFields(b)
    )

export const distinctTransactions = ({ readableTransactions, makeEqualityObject = (x) => x, selectReadableTransaction = (x) => x }) => {
  const distinctTransactions = transactions => _.uniqWith(transactions, isEqualTransactions(makeEqualityObject))
  return distinctTransactions(readableTransactions).map(selectReadableTransaction)
}
