import _ from 'lodash'
import { addMovement, formatComment, getSingleReadableTransactionMovement, makeCashTransferMovement } from '../../common/converters'
import { formatCommentDateTime } from '../../common/dateUtils'
import { mergeTransfers } from '../../common/mergeTransfers'
import { figureOutAccountRestsDelta, getTransactionFactor, isCashTransferTransaction, isElectronicTransferTransaction, isRejectedTransaction } from './BSB'

function formatDetails ({ transaction, matchedPayment }) {
  const timestamp = formatCommentDateTime(new Date(transaction.transactionDate))
  if (matchedPayment) {
    return {
      payee: [matchedPayment.name, matchedPayment.target].filter(Boolean).join(', '),
      comment: [matchedPayment.comment, timestamp].filter(Boolean).join(' ')
    }
  }
  return {
    payee: [transaction.countryCode, transaction.city, transaction.transactionDetails].filter(Boolean).join(' '),
    comment: timestamp
  }
}

const floorToMinutes = (ticks) => new Date(Math.floor(ticks / 60000) * 60000).valueOf()

export function convertApiTransactionsToReadableTransactions (apiTransactionsByAccount, paymentsArchive) {
  const paymentsGroupedByTransactionDate = _.groupBy(paymentsArchive, (payment) => floorToMinutes(payment.paymentDate))
  const items = _.flatMap(apiTransactionsByAccount, ({ apiTransactions, account }) => {
    return _.sortBy(
      apiTransactions.filter((transaction) => !isRejectedTransaction(transaction) && transaction.transactionAmount > 0),
      (x) => x.cardTransactionId
    )
      .map((apiTransaction, index, transactions) => {
        const invoiceSum = getTransactionFactor(apiTransaction) * apiTransaction.transactionAmount
        const sum = apiTransaction.transactionCurrency === account.instrument
          ? invoiceSum
          : figureOutAccountRestsDelta({ transactions, index, accountCurrency: account.instrument })
        if (sum === null) {
          console.debug('sum is unknown, ignored transaction', { transaction: apiTransaction })
          return null
        }
        const relevantPayments = paymentsGroupedByTransactionDate[apiTransaction.transactionDate] || []
        const matchedPayment = relevantPayments.find((payment) =>
          (apiTransaction.last4.startsWith(payment.last4) || payment.target.slice(0, 4) === apiTransaction.last4.slice(0, 4)) &&
          payment.currencyIso === apiTransaction.transactionCurrency &&
          apiTransaction.transactionAmount === payment.amount
        )
        const details = formatDetails({ transaction: apiTransaction, matchedPayment })
        const invoice = account.instrument === apiTransaction.transactionCurrency
          ? null
          : { sum: invoiceSum, instrument: apiTransaction.transactionCurrency }
        const readableTransaction = {
          movements: [
            {
              id: apiTransaction.cardTransactionId.toString(),
              account: { id: account.id },
              invoice,
              sum: sum,
              fee: 0
            }
          ],
          date: new Date(apiTransaction.transactionDate),
          hold: null,
          merchant: { title: details.payee, mcc: null, location: null },
          comment: _.compact([details.comment, formatComment({ invoice, sum, fee: 0, accountInstrument: account.instrument })]).join('\n') || null
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
    selectReadableTransaction: (x) => x.readableTransaction
  })
}
