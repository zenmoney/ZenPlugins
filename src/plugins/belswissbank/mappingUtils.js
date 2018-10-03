import _ from 'lodash'
import { isValidDate } from '../../common/dates'

function checkTransaction (transaction) {
  console.assert(isValidDate(transaction.transactionDate), 'transactionDate is not a valid date in transaction:', transaction);
  [
    'transactionCurrency',
    'accountCurrency'
  ].forEach((key) => console.assert(_.isString(transaction[key]), `key "${key}" is not a string in transaction:`, transaction));
  [
    'transactionAmount',
    'accountAmount'
  ].forEach((key) => console.assert(_.isNumber(transaction[key]), `key "${key}" is not a positive number in transaction:`, transaction))
  console.assert(Math.sign(transaction.transactionAmount) === Math.sign(transaction.accountAmount), 'transaction and account amount have different signs:', transaction);
  [
    'isCashTransfer'
  ].forEach((key) => console.assert(_.isBoolean(transaction[key]), `key "${key}" is not a boolean in transaction:`, transaction));
  [
    'payee',
    'comment'
  ].forEach((key) => console.assert(!_.isUndefined(transaction[key]), `key "${key}" is not defined in transaction:`, transaction))
}

export function formatRate ({ transactionAmount, accountAmount }) {
  const rate = transactionAmount / accountAmount
  return rate < 1
    ? `1/${(1 / rate).toFixed(4)}`
    : rate.toFixed(4)
}

export function convertToZenMoneyTransaction (accountId, bankTransaction) {
  console.assert(accountId, 'accountId should be provided')
  console.assert(bankTransaction, 'bankTransaction should be provided')
  checkTransaction(bankTransaction)
  const {
    transactionId,
    transactionDate,
    transactionCurrency,
    transactionAmount,
    accountCurrency,
    accountAmount,
    payee,
    comment,
    isCashTransfer
  } = bankTransaction
  const isCurrencyConversion = accountCurrency !== transactionCurrency
  const zenMoneyTransaction = { date: transactionDate.getTime(), payee }
  if (transactionId) {
    zenMoneyTransaction.id = transactionId
  }
  const commentLines = []
  if (comment) {
    commentLines.push(comment)
  }
  if (isCurrencyConversion) {
    commentLines.push(`${Math.abs(transactionAmount).toFixed(2)} ${transactionCurrency}`)
    commentLines.push(`(rate=${formatRate({ transactionAmount, accountAmount })})`)
  }

  if (transactionAmount >= 0) {
    zenMoneyTransaction.income = Math.abs(accountAmount)
    zenMoneyTransaction.incomeAccount = accountId
    if (isCashTransfer) {
      zenMoneyTransaction.outcome = Math.abs(transactionAmount)
      zenMoneyTransaction.outcomeAccount = `cash#${transactionCurrency}`
    } else {
      zenMoneyTransaction.outcome = 0
      zenMoneyTransaction.outcomeAccount = accountId
    }
  } else {
    zenMoneyTransaction.outcome = Math.abs(accountAmount)
    zenMoneyTransaction.outcomeAccount = accountId
    if (isCashTransfer) {
      zenMoneyTransaction.income = Math.abs(transactionAmount)
      zenMoneyTransaction.incomeAccount = `cash#${transactionCurrency}`
    } else {
      zenMoneyTransaction.income = 0
      zenMoneyTransaction.incomeAccount = accountId
    }
  }

  if (isCurrencyConversion) {
    if (transactionAmount >= 0) {
      zenMoneyTransaction.opIncome = Math.abs(transactionAmount)
      zenMoneyTransaction.opIncomeInstrument = transactionCurrency
    } else {
      zenMoneyTransaction.opOutcome = Math.abs(transactionAmount)
      zenMoneyTransaction.opOutcomeInstrument = transactionCurrency
    }
  }
  if (commentLines.length > 0) {
    zenMoneyTransaction.comment = commentLines.join('\n')
  }
  return zenMoneyTransaction
}
