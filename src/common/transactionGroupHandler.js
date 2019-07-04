import _ from 'lodash'
import { handleGroupBy, handleGroups } from './handleGroups'

function isMainMovement (movement) {
  return Boolean(movement.account.id)
}

export function adjustTransactions ({
  transactions,
  groupHandlers = [
    mergeTransfersHandler
  ]
}) {
  transactions = handleGroups({
    items: transactions,
    makeGroupKeys: transaction => transaction.groupKeys,
    handleGroup: handleGroupBy(groupHandlers)
  })
  if (transactions.some(transaction => 'groupKeys' in transaction)) {
    transactions = transactions.map(transaction => _.omit(transaction, ['groupKeys']))
  }
  return transactions
}

export function mergeTransfersHandler (transactions, { mergeComments = null } = {}) {
  if (transactions.length !== 2 ||
    transactions.some(transaction => transaction.movements.filter(isMainMovement).length > 1)) {
    return null
  }
  const [outcome, income] = _.sortBy(transactions.map(transaction => ({
    transaction,
    movement: transaction.movements.find(isMainMovement)
  })), item => item.movement.sum >= 0)
  if (outcome.movement.sum < 0 && income.movement.sum > 0 &&
    (outcome.movement.account.id || income.movement.account.id) &&
    (outcome.movement.account.id !== income.movement.account.id)) {
    return [
      {
        movements: [outcome.movement, income.movement],
        date: new Date(Math.min(outcome.transaction.date.getTime(), income.transaction.date.getTime())),
        hold: outcome.transaction.hold === income.transaction.hold ? outcome.transaction.hold : null,
        merchant: null,
        comment: mergeComments === null
          ? outcome.transaction.comment || income.transaction.comment
          : mergeComments(outcome, income)
      }
    ]
  }
  return null
}
