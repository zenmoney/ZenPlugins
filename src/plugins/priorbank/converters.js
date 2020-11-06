import _ from 'lodash'
import { formatCommentFeeLine, joinCommentLines } from '../../common/converters'

export function convertAccounts (apiAccounts, apiAccountDetails) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    const foundedAccount = accounts.find(account => account.account.syncID.some(syncID => syncID === apiAccount.clientObject.cardContractNumber))
    if (foundedAccount) {
      foundedAccount.account.syncID.push(apiAccount.clientObject.cardMaskedNumber.slice(-4))
      foundedAccount.products.push({
        id: apiAccount.clientObject.id.toString(),
        type: 'card'
      })
      continue
    }
    const details = apiAccountDetails.find((x) => x.id === apiAccount.clientObject.id)
    console.assert(details, 'could not find details for account', apiAccount)
    const account = convertCard(apiAccount, details)
    const product = {
      id: apiAccount.clientObject.id.toString(),
      type: 'card'
    }
    accounts.push({ account, products: [product] })
  }
  return accounts
}

export function convertCard (card, details) {
  // card.clientObject.type === 5 for credit card (limits source unknown, thus non-specified)
  // card.clientObject.type === 6 for debit card
  const creditLimit = details.contract.creditLimit || 0
  return {
    id: card.clientObject.id.toString(),
    title: card.clientObject.customSynonym || card.clientObject.defaultSynonym,
    type: 'ccard',
    syncID: [card.clientObject.cardContractNumber, card.clientObject.cardMaskedNumber.slice(-4)],
    instrument: card.clientObject.currIso,
    balance: card.balance.available - creditLimit,
    ...creditLimit && { creditLimit }
  }
}

const extractRegularTransactionAmount = ({ accountCurrency, apiTransaction }) => {
  if (accountCurrency === apiTransaction.transCurrIso) {
    return apiTransaction.accountAmount
  }
  if (apiTransaction.amount === 0) {
    if (apiTransaction.feeAmount !== 0) {
      return apiTransaction.feeAmount
    }
    console.error({ accountCurrency, apiTransaction })
    throw new Error('Cannot handle corrupted transaction amounts')
  }
  return Math.sign(apiTransaction.accountAmount) * Math.abs(apiTransaction.amount)
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

function parseDate (apiTransactionPayload) {
  return apiTransactionPayload.transTime
    ? new Date(apiTransactionPayload.transDate.substring(0, 11) + apiTransactionPayload.transTime + apiTransactionPayload.transDate.substring(19))
    : new Date(apiTransactionPayload.transDate)
}

export function convertTransaction (apiTransaction, mainAccount, isRegularTransaction) {
  apiTransaction.transDetails = apiTransaction.transDetails.trim()
  const accountCurrency = mainAccount.account.instrument
  const accountId = mainAccount.account.id

  let sum
  let invoiceSum
  if (isRegularTransaction) {
    sum = apiTransaction.accountAmount
    invoiceSum = extractRegularTransactionAmount({ accountCurrency, apiTransaction })
  } else {
    const sign = Math.sign(-apiTransaction.amount)
    sum = sign * Math.abs(apiTransaction.amount)
    invoiceSum = sign * Math.abs(apiTransaction.transAmount)
  }
  const invoice = apiTransaction.transCurrIso === accountCurrency
    ? null
    : { sum: invoiceSum, instrument: apiTransaction.transCurrIso }

  const fee = 0
  const date = parseDate(apiTransaction)
  const transaction = {
    movements: [
      {
        id: null,
        account: { id: accountId },
        invoice,
        sum,
        fee
      }
    ],
    date,
    hold: false,
    merchant: null,
    comment: null
  };
  [
    parseInnerTransfer,
    parseCashTransfer,
    parseOuterTransfer,
    parsePayee,
    parseComment
  ].some(parser => parser(transaction, apiTransaction, invoice))

  transaction.comment = joinCommentLines([
    transaction.comment,
    formatCommentFeeLine(fee || apiTransaction.feeAmount || 0, accountCurrency)
  ])
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, invoice) {
  let regex
  if ([
    /^ATM/,
    /^Cash/,
    /^Credit .* CASH-IN( \d+| )?$/
  ].some(regexp => {
    regex = regexp
    return regexp.test(apiTransaction.transDetails)
  })) {
    transaction.merchant = null
    transaction.movements.push({
      id: null,
      account: {
        type: 'cash',
        instrument: apiTransaction.transCurrIso,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: invoice ? -invoice.sum : -transaction.movements[0].sum,
      fee: 0
    })
    if (regex.toString().startsWith('/^Credit ')) {
      regex = /^Credit/
    }
    transaction.comment = apiTransaction.transDetails.replace(regex, '').trim()
    return true
  }
  return false
}

function parseInnerTransfer (transaction, apiTransaction, invoice) {
  if (![
    /^CH Debit .*P2P( |_)SDBO/,
    /^CH Payment .*P2P( |_)SDBO/,
    /.* SOU INTERNETBANK$/ // под вопросом
  ].some(regexp => regexp.test(apiTransaction.transDetails))) {
    return false
  }
  const sum = invoice ? -invoice.sum : -transaction.movements[0].sum
  transaction.groupKeys = [`${apiTransaction.transDate.slice(0, 10)}_${apiTransaction.transTime}_${Math.abs(sum)}_${apiTransaction.transCurrIso}`]
  return true
}

function parseOuterTransfer (transaction, apiTransaction, invoice) {
  let regex
  if ([
    /^Перевод с карты на счет/,
    /^CH Debit/,
    /^CH Payment/,
    /.* MOBILE BANK$/
  ].some(regexp => {
    regex = regexp
    return regexp.test(apiTransaction.transDetails)
  })) {
    transaction.movements.push({
      id: null,
      account: {
        type: null,
        instrument: apiTransaction.transCurrIso,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: invoice ? -invoice.sum : -transaction.movements[0].sum,
      fee: 0
    })
    if (!regex.test(' MOBILE BANK')) {
      transaction.comment = apiTransaction.transDetails.replace(regex, '').replace('. Перевод не связан с предпринимательской деятельностью.', '').trim()
    }
    return true
  }
  return false
}

function parsePayee (transaction, apiTransaction, invoice) {
  let regex
  if (![
    /^Retail /
  ].some(regexp => {
    regex = regexp
    return regexp.test(apiTransaction.transDetails)
  })) {
    return false
  }
  transaction.merchant = {
    fullTitle: apiTransaction.transDetails.replace(regex, '').trim(),
    mcc: null,
    location: null
  }
  return true
}

function parseComment (transaction, apiTransaction, invoice) {
  let regex
  if ([
    /^Credit /,
    /^Reversal. Retail /
  ].some(regexp => {
    regex = regexp
    return regexp.test(apiTransaction.transDetails)
  })) {
    transaction.merchant = {
      fullTitle: apiTransaction.transDetails.replace(regex, '').trim(),
      mcc: null,
      location: null
    }
    return true
  }
  transaction.comment = apiTransaction.transDetails
  return true
}

export function convertTransactions ({ apiAccountsWithoutDuplicates, apiAccountDetails, accounts }) {
  const items = _.flatMap(apiAccountsWithoutDuplicates, (apiAccount) => {
    const mainAccount = accounts.find(account => account.products.some(product => product.id === apiAccount.clientObject.id.toString()))
    console.assert(mainAccount, 'could not find mainAccount for account', apiAccount)
    const cardDesc = apiAccountDetails.find((x) => x.id === apiAccount.clientObject.id)
    const abortedTransactions = _.flatMap(cardDesc.contract.abortedContractList, (x) => x.abortedTransactionList.reverse())
    const regularTransactions = _.flatMap(cardDesc.contract.account.transCardList, (x) => x.transactionList.reverse())
    const readableAbortedTransactions = abortedTransactions.map(apiTransaction => {
      return convertTransaction(apiTransaction, mainAccount, false)
    })
    const readableRegularTransactions = regularTransactions.map(apiTransaction => {
      return convertTransaction(apiTransaction, mainAccount, true)
    })
    return [
      ...readableAbortedTransactions,
      ...readableRegularTransactions
    ]
  })
  return items
}
