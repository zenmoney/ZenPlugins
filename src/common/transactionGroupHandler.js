import _ from 'lodash'
import { handleGroupBy, handleGroups } from './handleGroups'

function isMainMovement (movement) {
  return Boolean(movement.account.id)
}

export function adjustTransactions ({
  transactions,
  groupHandlers = [
    mergeTransfersHandler
  ],
  ...options
}) {
  transactions = handleGroups({
    items: transactions,
    makeGroupKeys: transaction => transaction.groupKeys,
    handleGroup: handleGroupBy(groupHandlers, options && mapOptions(options))
  })
  if (transactions.some(transaction => 'groupKeys' in transaction)) {
    transactions = transactions.map(transaction => _.omit(transaction, ['groupKeys']))
  }
  return transactions
}

function mapOptions (options) {
  let accountsById = null
  if (options.accounts) {
    console.assert(Array.isArray(options.accounts), 'accounts must be array')
    accountsById = _.keyBy(options.accounts, 'id')
  }
  return {
    ...options,
    accountsById
  }
}

function fillSumIfNeeded ({ movement, transaction }, secondMovement, shouldFillSum, accountsById) {
  if (movement.sum !== null || !shouldFillSum) {
    return movement
  }
  const account = accountsById[movement.account.id]
  if (!account || (_.isFunction(shouldFillSum) && !shouldFillSum({ movement, transaction, account }))) {
    return movement
  }
  if (secondMovement.invoice && secondMovement.invoice.instrument === account.instrument) {
    return {
      ...movement,
      sum: -secondMovement.invoice.sum
    }
  }
  const secondAccount = accountsById[secondMovement.account.id]
  if (secondAccount && secondMovement.sum !== null && secondAccount.instrument === account.instrument) {
    return {
      ...movement,
      sum: -(secondMovement.sum + secondMovement.fee)
    }
  }
  return movement
}

function getMovementSign (movement) {
  return (movement.sum === null ? movement.invoice && movement.invoice.sum : movement.sum) > 0 ? 1 : -1
}

export function mergeTransfersHandler (transactions, {
  mergeComments = null,
  shouldFillIncomeSum = false,
  shouldFillOutcomeSum = false,
  ...rest
} = {}) {
  console.assert(_.isBoolean(shouldFillIncomeSum) || _.isFunction(shouldFillIncomeSum), 'shouldFillIncomeSum must be boolean or function')
  console.assert(_.isBoolean(shouldFillOutcomeSum) || _.isFunction(shouldFillOutcomeSum), 'shouldFillOutcomeSum must be boolean or function')
  if (shouldFillIncomeSum || shouldFillOutcomeSum) {
    console.assert(_.isPlainObject(rest.accountsById), 'when shouldFillIncomeSum/shouldFillOutcomeSum option is set accounts array must be passed as well')
  }
  if (transactions.length !== 2 ||
    transactions.some(transaction => transaction.movements.filter(isMainMovement).length > 1)) {
    return null
  }
  const [outcome, income] = _.sortBy(transactions.map(transaction => ({
    transaction,
    movement: transaction.movements.find(isMainMovement)
  })), item => getMovementSign(item.movement))
  if (getMovementSign(outcome.movement) < 0 && getMovementSign(income.movement) > 0 &&
    (outcome.movement.account.id || income.movement.account.id) &&
    (outcome.movement.account.id !== income.movement.account.id)) {
    const outcomeMovement = fillSumIfNeeded(outcome, income.movement, shouldFillOutcomeSum, rest.accountsById)
    const incomeMovement = fillSumIfNeeded(income, outcome.movement, shouldFillIncomeSum, rest.accountsById)
    return [
      {
        movements: [outcomeMovement, incomeMovement],
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
