import _ from 'lodash'
import {
  addMovement,
  formatCalculatedRateLine,
  formatCommentFeeLine,
  formatInvoiceLine,
  formatRate,
  formatRateLine,
  getSingleReadableTransactionMovement,
  joinCommentLines,
  makeCashTransferMovement
} from '../../common/converters'
import { mergeTransfers as commonMergeTransfers } from '../../common/mergeTransfers'

const calculateAccountId = (card) => String(card.clientObject.id)

export function toZenmoneyAccount (card) {
  // card.clientObject.type === 5 for credit card (limits source unknown, thus non-specified)
  // card.clientObject.type === 6 for debit card
  return {
    id: calculateAccountId(card),
    title: card.clientObject.customSynonym || card.clientObject.defaultSynonym,
    type: 'ccard',
    syncID: [card.clientObject.cardMaskedNumber.slice(-4)],
    instrument: card.clientObject.currIso,
    balance: card.balance.available
  }
}

const knownTransactionTypes = ['Retail', 'ATM', 'CH Debit', 'CH Payment', 'Cash']

const normalizeSpaces = (text) => _.compact(text.split(' ')).join(' ')

function parseTransDetails (transDetails) {
  const type = knownTransactionTypes.find((type) => transDetails.startsWith(type + ' '))
  if (type) {
    return { type, payee: normalizeSpaces(transDetails.slice(type.length)), comment: null }
  } else {
    return { type: null, payee: null, comment: normalizeSpaces(transDetails) || null }
  }
}

const extractRegularTransactionAmount = ({ accountCurrency, regularTransaction }) => {
  if (accountCurrency === regularTransaction.transCurrIso) {
    return regularTransaction.accountAmount
  }
  if (regularTransaction.amount === 0) {
    if (regularTransaction.feeAmount !== 0) {
      return regularTransaction.feeAmount
    }
    console.error({ accountCurrency, regularTransaction })
    throw new Error('Cannot handle corrupted transaction amounts')
  }
  return Math.sign(regularTransaction.accountAmount) * Math.abs(regularTransaction.amount)
}

export function chooseDistinctCards (cardsBodyResult) {
  const cardsToEvict = _.flatMap(
    _.toPairs(_.groupBy(cardsBodyResult, (x) => x.clientObject.cardContractNumber)),
    ([cardContractNumber, cards]) => _.sortBy(cards, [
      (x) => x.clientObject.cardStatus === 1 ? 0 : 1,
      (x) => x.clientObject.defaultSynonym
    ]).slice(1)
  )
  return cardsBodyResult.filter((card) => !cardsToEvict.includes(card))
}

export const convertApiAbortedTransactionToReadableTransaction = ({ accountId, accountCurrency, abortedTransaction }) => {
  const details = parseTransDetails(abortedTransaction.transDetails)
  const sign = Math.sign(-abortedTransaction.amount)
  const sum = sign * Math.abs(abortedTransaction.amount)
  const invoice = abortedTransaction.transCurrIso === accountCurrency
    ? null
    : { sum: sign * Math.abs(abortedTransaction.transAmount), instrument: abortedTransaction.transCurrIso }
  const fee = 0
  return {
    movements: [
      {
        id: null,
        account: { id: accountId },
        invoice,
        sum,
        fee
      }
    ],
    date: parseDate(abortedTransaction),
    hold: true,
    merchant: details.payee ? {
      fullTitle: details.payee,
      mcc: null,
      location: null
    } : null,
    comment: joinCommentLines([
      details.comment,
      formatCommentFeeLine(fee, accountCurrency),
      formatInvoiceLine(invoice),
      formatRateLine(sum, invoice)
    ])
  }
}

function parseDate (apiTransactionPayload) {
  return apiTransactionPayload.transTime
    ? new Date(apiTransactionPayload.transDate.substring(0, 11) + apiTransactionPayload.transTime + apiTransactionPayload.transDate.substring(19))
    : new Date(apiTransactionPayload.transDate)
}

const convertApiTransactionToReadableTransaction = (apiTransaction) => {
  const accountCurrency = apiTransaction.card.clientObject.currIso
  const accountId = calculateAccountId(apiTransaction.card)
  if (apiTransaction.type === 'abortedTransaction') {
    return convertApiAbortedTransactionToReadableTransaction({ accountId, accountCurrency, abortedTransaction: apiTransaction.payload })
  }
  if (apiTransaction.type === 'regularTransaction') {
    const regularTransaction = apiTransaction.payload
    const details = parseTransDetails(regularTransaction.transDetails)
    const sum = regularTransaction.accountAmount
    const invoice = regularTransaction.transCurrIso === accountCurrency
      ? null
      : { sum: extractRegularTransactionAmount({ accountCurrency, regularTransaction }), instrument: regularTransaction.transCurrIso }
    const fee = 0
    return {
      movements: [
        {
          id: null,
          account: { id: accountId },
          invoice,
          sum,
          fee
        }
      ],
      date: parseDate(regularTransaction),
      hold: false,
      merchant: details.payee ? {
        fullTitle: details.payee,
        mcc: null,
        location: null
      } : null,
      comment: joinCommentLines([
        details.comment,
        formatCommentFeeLine(fee, accountCurrency),
        formatInvoiceLine(invoice),
        formatRateLine(sum, invoice)
      ])
    }
  }
  throw new Error(`apiTransaction.type "${apiTransaction.type}" not implemented`)
}

const isTransferItem = ({ apiTransaction }) =>
  apiTransaction.payload.transDetails.includes('P2P SDBO') ||
  apiTransaction.payload.transDetails.includes('P2P_SDBO')

function formatMovementPartialDetails (outcome, income) {
  const movement = outcome.movement
  const accountInstrument = outcome.item.apiTransaction.card.clientObject.currIso
  return joinCommentLines([
    formatCommentFeeLine(movement.fee, accountInstrument),
    outcome.item.apiTransaction.card.clientObject.currIso === income.item.apiTransaction.card.clientObject.currIso
      ? null
      : formatCalculatedRateLine(formatRate({ invoiceSum: income.movement.sum, sum: Math.abs(outcome.movement.sum) }))
  ])
}

export function mergeTransfers ({ items }) {
  return commonMergeTransfers({
    items,
    selectReadableTransaction: (item) => item.readableTransaction,
    makeGroupKey: ({ readableTransaction, apiTransaction }) => {
      if (!isTransferItem({ apiTransaction })) {
        return null
      }
      const movement = getSingleReadableTransactionMovement(readableTransaction)
      const sum = movement.invoice === null ? movement.sum : movement.invoice.sum
      const instrument = movement.invoice === null ? apiTransaction.card.clientObject.currIso : movement.invoice.instrument
      return `${Math.abs(sum)} ${instrument} @ ${apiTransaction.payload.transDate} ${apiTransaction.payload.transTime}`
    },
    mergeComments: formatMovementPartialDetails
  })
}

export function convertApiCardsToReadableTransactions ({ cardsBodyResultWithoutDuplicates, cardDescBodyResult }) {
  const items = _.sortBy(_.flatMap(cardsBodyResultWithoutDuplicates, (card) => {
    const cardDesc = cardDescBodyResult.find((x) => x.id === card.clientObject.id)
    const abortedTransactions = _.flatMap(cardDesc.contract.abortedContractList, (x) => x.abortedTransactionList.reverse())
      .map((abortedTransaction) => ({ type: 'abortedTransaction', payload: abortedTransaction, card }))
    const regularTransactions = _.flatMap(cardDesc.contract.account.transCardList, (x) => x.transactionList.reverse())
      .map((regularTransaction) => ({ type: 'regularTransaction', payload: regularTransaction, card }))
    return abortedTransactions.concat(regularTransactions)
      .map((apiTransaction) => {
        const readableTransaction = convertApiTransactionToReadableTransaction(apiTransaction)
        if (['ATM', 'Cash'].includes(parseTransDetails(apiTransaction.payload.transDetails).type)) {
          return {
            apiTransaction,
            readableTransaction: addMovement(readableTransaction, makeCashTransferMovement(readableTransaction, apiTransaction.card.clientObject.currIso))
          }
        }
        return { apiTransaction, readableTransaction }
      })
  }), x => x.readableTransaction.date)
  return mergeTransfers({ items })
}
