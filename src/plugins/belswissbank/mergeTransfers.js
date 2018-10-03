import _ from 'lodash'

export function getTransactionToTransferReplacements (transactionPairs) {
  const transfers = transactionPairs
    .filter(([bankTransaction, zenTransaction]) => bankTransaction.isElectronicTransfer)
    .map(([bankTransaction, zenTransaction]) => {
      return {
        transferId: [
          bankTransaction.transactionDate.toISOString(),
          Math.abs(bankTransaction.transactionAmount),
          bankTransaction.transactionCurrency
        ].join('|'),
        bankTransaction,
        zenTransaction
      }
    })
  return _.reduce(_.groupBy(transfers, (x) => x.transferId), (memo, transfers, transferId) => {
    if (transfers.length === 2) {
      const transactions = transfers.map(({ bankTransaction, zenTransaction }) => zenTransaction)
      const [outcomeTransaction, incomeTransaction] = _.sortBy(transactions, (x) => x.income)
      memo[outcomeTransaction.id] = _.defaults(...[
        {
          incomeBankID: incomeTransaction.id,
          outcomeBankID: outcomeTransaction.id
        },
        _.omit(incomeTransaction, ['id', 'outcome', 'outcomeAccount']),
        _.omit(outcomeTransaction, ['id', 'income', 'incomeAccount'])
      ])
      memo[incomeTransaction.id] = null
    } else {
      console.error('cannot merge non-pair transfer', { transferId, transfers })
    }
    return memo
  }, {})
}
