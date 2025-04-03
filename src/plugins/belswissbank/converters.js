import _ from 'lodash'
import { addMovement, formatCommentFeeLine, getSingleReadableTransactionMovement, makeCashTransferMovement } from '../../common/converters'
import { mergeTransfers } from '../../common/mergeTransfers'
import {
  currencyCodeToIsoCurrency,
  figureOutAccountRestsDelta,
  getTransactionFactor,
  isCashTransferTransaction,
  isElectronicTransferTransaction,
  isRegularSpendTransaction,
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

function makeArchiveTransactionsJoiner (archiveTxs) {
  const ROUNDING_TICKS = 2 * 60000
  const roundTicks = (ticks) => Math.round(ticks / ROUNDING_TICKS) * ROUNDING_TICKS
  const txsByRoundedTicks = _.groupBy(archiveTxs, (archiveTx) => roundTicks(archiveTx.paymentDate))

  const joinArchiveTx = (smsTx) => {
    if (smsTx.transactionDetails === 'INTERNET-BANKING BSB' || smsTx.transactionDetails === 'PERSON TO PERSON I-B BSB') {
      const items = txsByRoundedTicks[roundTicks(smsTx.transactionDate)]
      if (items) {
        const matchIndex = items.findIndex((archiveTx) =>
          (smsTx.last4.startsWith(archiveTx.last4) || archiveTx.target.slice(0, 4) === smsTx.last4.slice(0, 4)) &&
          smsTx.transactionCurrency === archiveTx.currencyIso &&
          smsTx.transactionAmount === archiveTx.amount
        )
        if (matchIndex !== -1) {
          const match = items[matchIndex]
          items.splice(matchIndex, 1)
          return match
        }
      }
    }
    return null
  }

  return [
    joinArchiveTx,
    () => _.flatten(Object.values(txsByRoundedTicks))
  ]
}

function parseStatementTxDate (dateString) {
  // e.g. "20220127 12:00:00"
  return new Date(dateString.replace(/^(\d{4})(\d{2})(\d{2}) /, (_, y, M, d) => `${y}-${M}-${d}T`))
}

function makeStatementTransactionsJoiner (statementTxs) {
  const statementTxsByInvoice = _.groupBy(statementTxs, (statementTx) => {
    return statementTx.currencyIso + statementTx.transactionAmount.toFixed(2)
  })

  const orphanSmsTxs = []
  const joinStatementTx = (smsTx) => {
    const key = smsTx.transactionCurrency + smsTx.transactionAmount.toFixed(2)
    const candidates = statementTxsByInvoice[key]
    if (candidates && candidates.length > 0) {
      const calcTicksDistance = (statementTx) => Math.abs(parseStatementTxDate(statementTx.realDate).valueOf() - smsTx.transactionDate)
      const minDateDiffCandidate = _.minBy(candidates, statementTx => calcTicksDistance(statementTx))
      const distanceDays = calcTicksDistance(minDateDiffCandidate) / (1000 * 3600 * 24)
      if (distanceDays < 1) {
        candidates.splice(candidates.indexOf(minDateDiffCandidate), 1)
        return minDateDiffCandidate
      }
    }
    orphanSmsTxs.push(smsTx)
    return null
  }
  return [
    joinStatementTx,
    () => _.flatten(Object.values(statementTxsByInvoice)),
    () => orphanSmsTxs
  ]
}

export function convertBSBToZenMoneyTransactions (accountsWithTxs, archiveTxs) {
  const [joinArchiveTx, getOrphanArchiveTxs] = makeArchiveTransactionsJoiner(archiveTxs)
  const items = _.flatMap(accountsWithTxs, ({
    account,
    smsTxs,
    statementTxs
  }) => {
    const [joinStatementTx, getOrphanStatementTxs, getOrphanStatementSmsTxs] = makeStatementTransactionsJoiner(statementTxs.filter(x => x.amount > 0))
    const result = _.sortBy(
      smsTxs.filter((smsTx) => !isRejectedTransaction(smsTx) && smsTx.transactionAmount > 0),
      (x) => x.cardTransactionId
    )
      .map((smsTx, index, smsTxs) => {
        const sign = getTransactionFactor(smsTx)
        const archiveTx = joinArchiveTx(smsTx)
        const statementTx = joinStatementTx(smsTx)
        const date = smsTx.transactionDate > 0 ? new Date(smsTx.transactionDate) : new Date(smsTx.accountRestDate)
        const fee = 0
        const merchantTitle = archiveTx
          ? [archiveTx.name, archiveTx.target].filter(Boolean).join(', ')
          : smsTx.transactionDetails || statementTx?.place
        const invoiceSum = sign * smsTx.transactionAmount
        const sum = smsTx.transactionCurrency === account.instrument
          ? invoiceSum
          : statementTx
            ? sign * statementTx.amount
            : figureOutAccountRestsDelta({ transactions: smsTxs, index, accountCurrency: account.instrument })
        const transaction = {
          movements: [
            {
              id: smsTx.cardTransactionId.toString(),
              account: { id: account.id },
              invoice: smsTx.transactionCurrency === account.instrument
                ? null
                : { sum: invoiceSum, instrument: smsTx.transactionCurrency },
              sum,
              fee
            }
          ],
          date,
          hold: !statementTx,
          merchant: merchantTitle
            ? {
                country: smsTx.countryCode || null,
                city: smsTx.city || null,
                title: merchantTitle,
                mcc: null,
                location: null
              }
            : null,
          comment: [
            archiveTx ? archiveTx.comment || null : null,
            isRegularSpendTransaction(smsTx) ? null : smsTx.transactionType
          ].filter(Boolean).join('\n') || null
        }
        return {
          account,
          transaction: isCashTransferTransaction(smsTx) && !isElectronicTransferTransaction(smsTx)
            ? addMovement(transaction, makeCashTransferMovement(transaction, account.instrument))
            : transaction,
          smsTx
        }
      })

    console.debug({
      account,
      orphanStatementTxs: getOrphanStatementTxs(),
      orphanStatementSmsTxs: getOrphanStatementSmsTxs()
    })

    return result
  })

  console.debug({ orphanArchiveTxs: getOrphanArchiveTxs() })

  return mergeTransfers({
    items,
    makeGroupKey: ({
      transaction,
      account,
      smsTx = null
    }) => {
      if (transaction.movements.length > 1) return null
      if (!isElectronicTransferTransaction(smsTx)) return null
      const movement = getSingleReadableTransactionMovement(transaction)
      return [
        transaction.date.toISOString(),
        movement.invoice === null ? Math.abs(movement.sum) : Math.abs(movement.invoice.sum),
        movement.invoice === null ? account.instrument : movement.invoice.instrument
      ].join('|')
    },
    selectReadableTransaction: (x) => x.transaction,
    mergeComments: (outcome, income) => {
      const movement = outcome.movement
      const account = outcome.item.account
      return formatCommentFeeLine(movement.fee, account.instrument)
    }
  })
}
