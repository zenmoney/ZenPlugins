import _ from 'lodash'
import {
  addMovement,
  formatCalculatedRateLine,
  formatCommentFeeLine,
  formatRate,
  getSingleReadableTransactionMovement,
  joinCommentLines,
  makeCashTransferMovement
} from '../../common/converters'
import { formatCommentDateTime } from '../../common/dateUtils'
import { mergeTransfers } from '../../common/mergeTransfers'
import {
  currencyCodeToIsoCurrency,
  figureOutAccountRestsDelta, getTransactionFactor,
  isCashTransferTransaction,
  isElectronicTransferTransaction, isRegularSpendTransaction,
  isRejectedTransaction
} from './BSB'

export function convertToZenMoneyAccount (apiCard) {
  return {
    id: apiCard.cardId.toString(),
    title: apiCard.name || apiCard.brand,
    type: 'ccard',
    syncID: [apiCard.maskedCardNumber.slice(-4)],
    instrument: currencyCodeToIsoCurrency(apiCard.currency),
    balance: apiCard.amount
  }
}

function formatDetails ({ transaction, matchedPayment }) {
  if (matchedPayment) {
    return {
      country: transaction.countryCode || null,
      city: transaction.city || null,
      payee: [matchedPayment.name, matchedPayment.target].filter(Boolean).join(', '),
      comment: matchedPayment.comment || null
    }
  }
  return {
    country: transaction.countryCode || null,
    city: transaction.city || null,
    payee: transaction.transactionDetails,
    comment: null
  }
}

function formatMovementPartialDetails (outcome, income) {
  const movement = outcome.movement
  const account = outcome.item.account
  return joinCommentLines([
    formatCommentDateTime(outcome.transaction.date),
    formatCommentFeeLine(movement.fee, account.instrument),
    outcome.item.account.instrument === income.item.account.instrument
      ? null
      : formatCalculatedRateLine(formatRate({
        invoiceSum: income.movement.sum,
        sum: Math.abs(outcome.movement.sum)
      }))
  ])
}

function makeRelevantArchivePaymentsGetter (paymentsArchive) {
  const ROUNDING_TICKS = 2 * 60000
  const roundDate = (ticks) => Math.round(ticks / ROUNDING_TICKS) * ROUNDING_TICKS
  const paymentsGroupedByTransactionDate = _.groupBy(paymentsArchive, (payment) => roundDate(payment.paymentDate))
  return (apiTransaction) => {
    if (apiTransaction.transactionDetails === 'INTERNET-BANKING BSB' || apiTransaction.transactionDetails === 'PERSON TO PERSON I-B BSB') {
      return paymentsGroupedByTransactionDate[roundDate(apiTransaction.transactionDate)] || []
    }
    return []
  }
}

export function convertApiTransactionsToReadableTransactions (apiTransactionsByAccount, paymentsArchive) {
  const getRelevantPayments = makeRelevantArchivePaymentsGetter(paymentsArchive)
  const items = _.flatMap(apiTransactionsByAccount, ({
    apiTransactions,
    account
  }) => {
    return _.sortBy(
      apiTransactions.filter((transaction) => !isRejectedTransaction(transaction) && transaction.transactionAmount > 0),
      (x) => x.cardTransactionId
    )
      .map((apiTransaction, index, transactions) => {
        const invoiceSum = getTransactionFactor(apiTransaction) * apiTransaction.transactionAmount
        const sum = apiTransaction.transactionCurrency === account.instrument
          ? invoiceSum
          : figureOutAccountRestsDelta({ transactions, index, accountCurrency: account.instrument })
        if (!sum) {
          console.debug('sum is unknown, ignored transaction', { transaction: apiTransaction })
          return null
        }
        const relevantPayments = getRelevantPayments(apiTransaction)
        const matchedPayment = relevantPayments.find((payment) =>
          (apiTransaction.last4.startsWith(payment.last4) || payment.target.slice(0, 4) === apiTransaction.last4.slice(0, 4)) &&
          payment.currencyIso === apiTransaction.transactionCurrency &&
          apiTransaction.transactionAmount === payment.amount
        )
        const details = formatDetails({ transaction: apiTransaction, matchedPayment })
        const invoice = account.instrument === apiTransaction.transactionCurrency
          ? null
          : { sum: invoiceSum, instrument: apiTransaction.transactionCurrency }
        const date = new Date(apiTransaction.transactionDate)
        const fee = 0
        const readableTransaction = {
          movements: [
            {
              id: apiTransaction.cardTransactionId.toString(),
              account: { id: account.id },
              invoice,
              sum,
              fee
            }
          ],
          date,
          hold: null,
          merchant: details.payee ? { country: details.country, city: details.city, title: details.payee, mcc: null, location: null } : null,
          comment: _.compact([
            details.comment,
            isRegularSpendTransaction(apiTransaction) ? null : apiTransaction.transactionType
          ]).join('\n') || null
        }
        if (isCashTransferTransaction(apiTransaction) && !isElectronicTransferTransaction(apiTransaction)) {
          return { readableTransaction: addMovement(readableTransaction, makeCashTransferMovement(readableTransaction, account.instrument)), account }
        }
        return { readableTransaction, apiTransaction, account }
      })
      .filter(Boolean)
  })
  return mergeTransfers({
    items,
    makeGroupKey: ({ readableTransaction, apiTransaction, account }) => {
      if (readableTransaction.movements.length > 1) {
        return null
      }
      if (!isElectronicTransferTransaction(apiTransaction)) {
        return null
      }
      const movement = getSingleReadableTransactionMovement(readableTransaction)
      return [
        readableTransaction.date.toISOString(),
        movement.invoice === null ? Math.abs(movement.sum) : Math.abs(movement.invoice.sum),
        movement.invoice === null ? account.instrument : movement.invoice.instrument
      ].join('|')
    },
    selectReadableTransaction: (x) => x.readableTransaction,
    mergeComments: formatMovementPartialDetails
  })
}
