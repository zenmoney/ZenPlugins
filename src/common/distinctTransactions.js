import * as _ from 'lodash'

const isEqualTransactions = distinctByFields =>
  (a, b) =>
    _.isEqual(
      distinctByFields(a),
      distinctByFields(b)
    )

export const distinctTransactions = ({ transactions, makeEqualityObject = (x) => x }) => {
  const distinctTransactions = transactions => _.uniqWith(transactions, isEqualTransactions(makeEqualityObject))
  return distinctTransactions(transactions)
}
