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
  if (transactions.length < 2 ||
    transactions.length % 2 !== 0 ||
    transactions.some(transaction => transaction.movements.filter(isMainMovement).length > 1)) {
    return null
  }
  const incomes = transactions.filter(transaction => getMovementSign(transaction.movements.find(isMainMovement)) > 0)
  const outcomes = transactions.filter(transaction => getMovementSign(transaction.movements.find(isMainMovement)) < 0)
  if (outcomes.length !== incomes.length) {
    return null
  }
  if (areQuiteDifferentTransactions(incomes) || areQuiteDifferentTransactions(outcomes)) {
    return null
  }
  if (incomes[0].movements.find(isMainMovement).account.id === outcomes[0].movements.find(isMainMovement).account.id) {
    return null
  }
  const sortedIncomes = _.sortBy(incomes, 'date')
  const sortedOutcomes = _.sortBy(outcomes, 'date')
  return sortedOutcomes.map((transaction, i) => {
    const [outcome, income] = [transaction, sortedIncomes[i]].map(transaction => ({
      transaction,
      movement: transaction.movements.find(isMainMovement)
    }))
    const outcomeMovement = fillSumIfNeeded(outcome, income.movement, shouldFillOutcomeSum, rest.accountsById)
    const incomeMovement = fillSumIfNeeded(income, outcome.movement, shouldFillIncomeSum, rest.accountsById)
    return {
      movements: [outcomeMovement, incomeMovement],
      date: new Date(Math.min(outcome.transaction.date.getTime(), income.transaction.date.getTime())),
      hold: outcome.transaction.hold === income.transaction.hold ? outcome.transaction.hold : null,
      merchant: null,
      comment: mergeComments === null
        ? outcome.transaction.comment || income.transaction.comment
        : mergeComments(outcome, income)
    }
  })
}

function areQuiteDifferentTransactions (transactions) {
  const exampleMovement = _.omit(transactions[0].movements.find(isMainMovement), ['id'])
  return transactions.some(transaction => {
    const movement = transaction.movements.find(isMainMovement)
    return !_.isEqual(exampleMovement, _.omit(movement, ['id']))
  })
}
