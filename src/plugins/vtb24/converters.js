import * as _ from 'lodash'
import { distinctTransactions as commonDistinctTransactions } from '../../common/distinctTransactions'
import { mergeTransfers as commonMergeTransfers } from '../../common/mergeTransfers'

export const GRAMS_IN_OZ = 31.1034768
export const atMostTwoDecimals = value /* : number */ => Math.floor(value * 100) / 100

export function convertAccounts (apiPortfolios) {
  const accounts = []
  apiPortfolios.forEach(portfolio => {
    portfolio.productGroups.forEach(product => {
      let converter = null
      let apiAccount = product.mainProduct
      switch (portfolio.id) {
        case 'CARDS':
          const types = [
            { card: 'MasterAccountCardMto', account: 'MasterAccountMto' },
            { card: 'CreditCardMto', account: 'CreditCardAccountMto' },
            { card: 'DebitCardMto', account: 'DebitCardAccountMto' },
            { card: 'MultiCurrencyDebitCardMto', account: 'DebitCardAccountMto' }
          ]
          if (types.some(type => {
            return apiAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.account}`
          })) {
            converter = convertCardAccount
          } else if (apiAccount.cardAccount && types.some(type => {
            return apiAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.card}` &&
              apiAccount.cardAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.account}`
          })) {
            converter = convertCardAccount
            apiAccount = apiAccount.cardAccount
          }
          break
        case 'SAVINGS':
          if (apiAccount.__type === 'ru.vtb24.mobilebanking.protocol.product.MetalAccountMto') {
            converter = convertMetalAccount
          } else {
            converter = convertAccount
          }
          break
        case 'ACCOUNTS':
          converter = convertAccount
          break
        case 'LOANS':
          if (apiAccount.__type === 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto' &&
            apiAccount.account &&
            apiAccount.account.__type === 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto') {
            converter = convertAccount
            apiAccount = {
              ...apiAccount.account,
              contract: {
                ..._.omit(apiAccount, 'account'),
                account: null
              }
            }
          } else if (apiAccount.__type === 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto' &&
            apiAccount.account &&
            apiAccount.account.__type === 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto') {
            converter = convertLoan
          }
          break
        default:
          break
      }
      console.assert(converter, `unsupported portfolio ${portfolio.id} object ${apiAccount.id}`)
      const account = converter(apiAccount)
      if (_.isArray(account)) {
        accounts.push(...account)
      } else if (account) {
        accounts.push(account)
      }
    })
  })
  return accounts
}

export function convertMetalAccount (apiAccount) {
  const instrument = parseMetalInstrument(apiAccount.amount.currency.currencyCode)
  console.assert(instrument, 'Unknown metal account code', apiAccount.amount.currency.currencyCode)
  return {
    id: apiAccount.id,
    type: apiAccount.__type,
    products: [
      {
        id: apiAccount.id,
        type: apiAccount.__type,
        instrument,
        apiAccount
      }
    ],
    zenAccount: {
      id: apiAccount.id,
      type: 'checking',
      title: apiAccount.name,
      instrument,
      syncID: [apiAccount.number],
      balance: atMostTwoDecimals(apiAccount.amount.sum / GRAMS_IN_OZ)
    }
  }
}

const isMasterAccount = (apiAccount) => ['ru.vtb24.mobilebanking.protocol.product.MasterAccountMto'].indexOf(apiAccount.__type) >= 0
const isMasterAccountCard = (apiAccount) => ['ru.vtb24.mobilebanking.protocol.product.MasterAccountCardMto'].indexOf(apiAccount.__type) >= 0

const isCreditCardAccount = (apiAccount) => ['ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto'].indexOf(apiAccount.__type) >= 0
const isCreditCard = (apiAccount) => ['ru.vtb24.mobilebanking.protocol.product.CreditCardMto'].indexOf(apiAccount.__type) >= 0

const isDebetCardAccount = (apiAccount) => ['ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto'].indexOf(apiAccount.__type) >= 0
const isDebetCard = (apiAccount) => ['ru.vtb24.mobilebanking.protocol.product.DebitCardMto'].indexOf(apiAccount.__type) >= 0

export const isCardAccount = (apiAccount) => isCreditCardAccount(apiAccount) || isDebetCardAccount(apiAccount)
export const isCard = (apiAccount) => isMasterAccountCard(apiAccount) || isCreditCard(apiAccount) || isDebetCard(apiAccount)

export const isMoscowCitizenCardAccount = apiAccount => isDebetCardAccount(apiAccount) && apiAccount.name === 'Социальная карта москвича'
// const isMoscowCitizenCard = apiAccount => isDebetCard(apiAccount) && apiAccount.name === 'Социальная карта москвича'

const convertMoscowCitizenCardAccount = (apiAccount) => {
  const cards = apiAccount.cards.filter(card => card.status && card.status.id === 'ACTIVE')
  if (!cards.length) {
    return null
  }

  const card = cards.shift()

  const accountSyncId = card.number.replace(/X/g, '*')

  const zenAccount = {
    id: card.id,
    type: 'ccard',
    title: card.name,
    syncID: [accountSyncId]
  }

  const products = [
    {
      id: card.id,
      type: card.__type,
      apiAccount: card
    }
  ]

  const account = {
    id: card.id,
    type: card.__type,
    products,
    zenAccount
  }

  let amount = apiAccount.amount

  zenAccount.balance = amount.sum
  zenAccount.instrument = getInstrument(amount.currency.currencyCode)

  return account
}

export function convertCardAccount (apiAccount) {
  if (isMoscowCitizenCardAccount(apiAccount)) {
    return convertMoscowCitizenCardAccount(apiAccount)
  }

  const zenAccount = {
    id: apiAccount.id,
    type: 'checking',
    title: apiAccount.name,
    syncID: []
  }

  const products = [
    {
      id: apiAccount.id,
      type: apiAccount.__type,
      apiAccount
    }
  ]

  const account = {
    id: apiAccount.id,
    type: apiAccount.__type,
    cards: [],
    products,
    zenAccount
  }

  const cards = apiAccount.cards ? apiAccount.cards.filter(card => {
    return card && card.status && card.status.id === 'ACTIVE' && !card.archived
  }) : []

  let amount = apiAccount.amount
  if (cards.length > 0) {
    zenAccount.type = 'ccard'
    zenAccount.title = cards[0].name
    if (cards[0].balance) {
      amount = {
        sum: cards[0].balance.amountSum,
        currency: cards[0].baseCurrency
      }
    }
    cards.forEach((card, i) => {
      if (card.number) {
        zenAccount.syncID.push(card.number.replace(/X/g, '*'))
      }

      account.cards.push({
        id: card.id,
        type: card.__type
      })

      account.products.push({
        id: card.id,
        type: card.__type,
        apiAccount: card
      })
    })
  }

  zenAccount.balance = amount.sum
  zenAccount.instrument = getInstrument(amount.currency.currencyCode)
  const accountSyncId = apiAccount.number.replace(/X/g, '*')
  if (zenAccount.syncID.indexOf(accountSyncId) < 0) {
    zenAccount.syncID.push(accountSyncId)
  }
  if (typeof apiAccount.creditLimit === 'number') {
    zenAccount.creditLimit = apiAccount.creditLimit
  }

  return account
}

export function convertAccount (apiAccount) {
  const zenAccount = {
    syncID: []
  }

  const products = [
    {
      id: apiAccount.id,
      type: apiAccount.__type,
      apiAccount
    }
  ]

  const accounts = [
    {
      id: apiAccount.id,
      type: apiAccount.__type,
      products,
      zenAccount
    }
  ]
  const cards = apiAccount.cards ? apiAccount.cards.filter(card => {
    return card && card.status && card.status.id === 'ACTIVE' && !card.archived
  }) : []

  if (isMasterAccount(apiAccount)) {
    accounts[0].cards = apiAccount.cards
      ? apiAccount.cards
        .filter(card => card && card.status && card.status.id === 'ACTIVE' && !card.archived)
        .map(card => card ? ({ type: card.__type, id: card.id }) : null)
      : []
  }

  let amount = apiAccount.amount
  if (cards.length > 0) {
    zenAccount.type = 'ccard'
    zenAccount.title = cards[0].name
    if (cards[0].balance) {
      amount = {
        sum: cards[0].balance.amountSum,
        currency: cards[0].baseCurrency
      }
    }
    cards.forEach((card, i) => {
      if (card.number) {
        zenAccount.syncID.push(card.number.replace(/X/g, '*'))
      }
      if (isCardAccount) {
        if (i < accounts.length) {
          accounts[i].id = card.id
          accounts[i].type = card.__type
          accounts[i].apiAccount = card
        } else {
          accounts.push({
            id: card.id,
            type: card.__type,
            apiAccount: card,
            zenAccount
          })
        }
      }
    })
  } else {
    if (isCardAccount(apiAccount)) {
      return null
    }
    zenAccount.type = 'checking'
    zenAccount.title = apiAccount.name
    if (apiAccount.contract &&
      apiAccount.contract.__type === 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto') {
      accounts[0].id = apiAccount.contract.id
      accounts[0].type = apiAccount.contract.__type
      products[0].id = apiAccount.contract.id
      products[0].type = apiAccount.contract.__type
    }
  }
  if (!amount) {
    return null
  }
  zenAccount.id = accounts[0].id
  zenAccount.balance = amount.sum
  zenAccount.instrument = getInstrument(amount.currency.currencyCode)
  const accountSyncId = apiAccount.number.replace(/X/g, '*')
  if (zenAccount.syncID.indexOf(accountSyncId) < 0) {
    zenAccount.syncID.push(accountSyncId)
  }
  if (typeof apiAccount.creditLimit === 'number') {
    zenAccount.creditLimit = apiAccount.creditLimit
  }
  if ([
    'ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto',
    'ru.vtb24.mobilebanking.protocol.product.InvestmentAccountMto'
  ].indexOf(apiAccount.__type) >= 0) {
    zenAccount.savings = true
  }
  return accounts.length === 1 ? accounts[0] : accounts
}

export function convertLoan (apiAccount) {
  const zenAccount = {
    type: 'loan',
    title: apiAccount.name,
    instrument: getInstrument(apiAccount.creditSum.currency.currencyCode),
    startDate: apiAccount.openDate,
    startBalance: apiAccount.creditSum.sum,
    balance: -apiAccount.account.amount.sum,
    percent: 1,
    capitalization: true,
    payoffInterval: 'month',
    payoffStep: 1,
    syncID: [apiAccount.account.number.replace(/[^\d]/g, '')]
  }
  const contractPeriod = apiAccount.contractPeriod || apiAccount.account.contract.contractPeriod
  switch (contractPeriod.unit.id.toLowerCase()) {
    case 'month':
    case 'year':
      zenAccount.endDateOffsetInterval = contractPeriod.unit.id.toLowerCase()
      zenAccount.endDateOffset = contractPeriod.value
      break
    default:
      console.assert(false, `unsupported loan contract period ${contractPeriod.unit.id}`)
  }
  const products = [
    {
      id: apiAccount.id,
      type: apiAccount.__type,
      apiAccount
    }
  ]
  const account = {
    id: apiAccount.id,
    type: apiAccount.__type,
    products,
    zenAccount
  }
  zenAccount.id = account.id
  return account
}

const getTransactionId = apiTransaction => {
  if (/;/.test(apiTransaction.id)) {
    // apiTransaction.id is [statementId, transactionId] pair
    const [, transactionId] = apiTransaction.id.split(';')
    return transactionId
  }
  // else apiTransaction.id is uuid
  return apiTransaction.id
}

export function convertTransaction (apiTransaction, apiAccount) {
  if (apiTransaction.details && (
    ([
      'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
      'ru.vtb24.mobilebanking.protocol.product.DebitCardMto'
    ].indexOf(apiTransaction.debet.__type) >= 0 && (
      !(
        apiAccount.id === apiTransaction.debet.id ||
        (apiTransaction.debet.cardAccount && apiAccount.id === apiTransaction.debet.cardAccount.id)
      )
    ))
  )) {
    return null
  }
  const origin = getOrigin(apiTransaction)
  if (origin.amount === 0) {
    return null
  }
  const transaction = {
    comment: null,
    date: new Date(apiTransaction.transactionDate),
    hold: apiTransaction.isHold,
    merchant: null,
    movements: [
      {
        id: getTransactionId(apiTransaction),
        account: { id: apiAccount.zenAccount.id },
        invoice: origin.invoice,
        sum: origin.amount,
        fee: origin.fee
      }
    ]
  }

  if (apiTransaction.details) {
    [
      parseInternalTransfer,
      parseInnerTransfer,
      parseCashTransaction,
      parsePayee
    ].some(parser => parser(apiTransaction, transaction))
  }
  return transaction
}

function parseInnerTransfer (apiTransaction, transaction) {
  const origin = getOrigin(apiTransaction)
  if (![
    /Зачисление с другой карты \(Р2Р\)/,
    /Перевод на другую карту \(Р2Р\)/,
    /^Перевод с карты \*(\d{4})/,
    /^Перевод на счет \*(\d{4})/,
    /^Перевод на накопительный счет \*(\d{4})/,
    /^Зачисление со счета \*(\d{4})/,
    /^Зачисление с накопительного счета \*(\d{4})/,
    /^Перевод между собственными счетами и картами/
  ].some(pattern => {
    const match = apiTransaction.details.match(pattern)
    if (match && match[1]) {
      console.assert(transaction.movements.length < 2, 'Too much movements', { transaction, apiTransaction })
      transaction.movements.push({
        id: null,
        account: {
          type: 'ccard',
          instrument: origin.instrument,
          syncIds: [
            match[1]
          ],
          company: null
        },
        invoice: null,
        sum: -origin.amount,
        fee: 0
      })
    }
    return Boolean(match)
  }) && !(() => {
    if (apiTransaction.order && apiTransaction.order.operationInfo && apiTransaction.order.operationInfo.categoryId === '47') {
      // Перевод другому клиенту ВТБ
      transaction.merchant = {
        title: apiTransaction.order.description,
        city: null,
        country: null,
        location: null,
        mcc: null
      }

      return true
    }
  })()) {
    return false
  }

  if ((!apiTransaction.order || !apiTransaction.order.id) && !apiTransaction.processedDate) {
    return true
  }

  return true
}

function parseCashTransaction (apiTransaction, transaction) {
  if (![
    'Снятие в банкомате',
    'Пополнение через банкомат'
  ].some(pattern => apiTransaction.details.indexOf(pattern) >= 0)) {
    return false
  }
  const origin = getOrigin(apiTransaction)
  console.assert(transaction.movements.length < 2, 'Too much movements', { transaction, apiTransaction })
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: origin.instrument,
      syncIds: null,
      company: null
    },
    invoice: null,
    sum: -origin.amount,
    fee: 0
  })

  return true
}

function parseInternalTransfer (apiTransaction, transaction) {
  if (!apiTransaction.outcomeTransaction || !apiTransaction.incomeTransaction) {
    return false
  }

  const transactionOrigin = getOrigin(apiTransaction)
  const isIncome = transactionOrigin.amount > 0

  const origin = getOrigin(isIncome ? apiTransaction.outcomeTransaction : apiTransaction.incomeTransaction)
  console.assert(transaction.movements.length < 2, 'Too much movements', { transaction, apiTransaction })
  transaction.movements.push({
    id: isIncome ? getTransactionId(apiTransaction.outcomeTransaction) : getTransactionId(apiTransaction.incomeTransaction),
    account: {
      id: getMasterAccountId(isIncome ? apiTransaction.outcomeTransaction.debet : apiTransaction.incomeTransaction.debet)
    },
    invoice: null,
    sum: origin.amount,
    fee: 0
  })

  return true
}

function getMasterAccountId (debet) {
  return debet.cardAccount ? debet.cardAccount.id : debet.id
}

export function parsePayee (apiTransaction, transaction) {
  console.assert(![
    'perevod mezhdu schetami/kartami'
  ].some(detail =>
    apiTransaction.details.indexOf(detail) >= 0
  ), 'Incorrect merchant description!')

  if ([
    /^Карта \*\d{4} (.+)/,
    /^(.\*\*\*\*\*\*. .+)/
  ].some(pattern => {
    const match = apiTransaction.details.match(pattern)
    if (match) {
      transaction.merchant = {
        city: null,
        country: null,
        mcc: null,
        location: null,
        title: match[1]
      }
      return true
    }
    return false
  })) {
    return false
  }
  if (
    apiTransaction.__type === 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto'
  ) {
    if (
      [
        'Перевод денежных средств по картам Банка'
      ].some(description => apiTransaction.details.indexOf(description) >= 0)
    ) {
      // do nothing
    } else if (
      [
        'Payment From Contract',
        'Debit Account'
      ].some(description => apiTransaction.details.indexOf(description) >= 0)
    ) {
      transaction.comment = apiTransaction.details
    } else if (
      [
        'Пополнение',
        'Зачисление',
        'Списание по карте',
        'Начисленные %'
      ].some(pattern => new RegExp(pattern).test(apiTransaction.details))
    ) {
      transaction.comment = apiTransaction.details
      if (apiTransaction.order && apiTransaction.order.operationInfo && apiTransaction.order.operationInfo.categoryId === '6') {
        transaction.merchant = {
          title: apiTransaction.order.description,
          city: null,
          country: null,
          location: null,
          mcc: null
        }
      }
    } else {
      const purchaseMerchantData =
        /^Покупка /.test(apiTransaction.details)
          ? {
            fullTitle: apiTransaction.details.replace(/^Покупка /, '').trim()
          }
          : {
            city: null,
            country: null,
            title: apiTransaction.details
          }
      transaction.merchant = {
        ...purchaseMerchantData,
        mcc: null,
        location: null
      }
    }
  } else {
    transaction.comment = apiTransaction.details
  }
  return false
}

function getInstrument (code) {
  switch (code) {
    case 'RUR':
      return 'RUB'
    default:
      return parseMetalInstrument(code) || code
  }
}

function parseMetalInstrument (code) {
  switch (code) {
    case 'GLD':
      return 'XAU'
    case 'SLR':
      return 'XAG'
    case 'PLT':
      return 'XPT'
    case 'PLD':
      return 'XPD'
    default:
      return null
  }
}

function getOrigin (apiTransaction) {
  let transactionAmount
  if (apiTransaction.transactionAmountInAccountCurrency && apiTransaction.transactionAmountInAccountCurrency.sum !== 0) {
    transactionAmount = apiTransaction.transactionAmountInAccountCurrency
  } else {
    transactionAmount = apiTransaction.transactionAmount
  }

  let invoice = null
  if (apiTransaction.transactionAmountInAccountCurrency &&
    apiTransaction.transactionAmountInAccountCurrency.currency.currencyCode !== apiTransaction.transactionAmount.currency.currencyCode) {
    invoice = {
      instrument: apiTransaction.transactionAmount.currency.currencyCode,
      sum: apiTransaction.transactionAmount.sum
    }
  }

  let transactionFeeSum = (apiTransaction.feeAmount && apiTransaction.feeAmount.sum) || 0

  if (parseMetalInstrument(apiTransaction.transactionAmount.currency.currencyCode)) {
    invoice.sum /= GRAMS_IN_OZ
  }

  return {
    amount: transactionAmount.sum,
    instrument: getInstrument(transactionAmount.currency.currencyCode),
    invoice,
    fee: transactionFeeSum
  }
}

export const getDistinctApiTransactions = (transactionAccountPairs) => {
  return commonDistinctTransactions({
    transactions: transactionAccountPairs,
    makeEqualityObject: (x) => ({ ...x.apiTransaction, id: undefined, debet: undefined })
  })
}

const isWithinMaxTransferDelay = ({ income, outcome }, timeout) =>
  Math.abs(new Date(outcome.apiTransaction.transactionDate).getTime() - new Date(income.apiTransaction.transactionDate).getTime()) <= timeout

const isInternalTransfer = ({ items, apiAccountsByIdLookup }) => {
  const inouts = [
    'Перевод денежных средств по картам Банка',
    'Перевод между собственными счетами и картами'
  ]

  const outcomes = [
    'Перевод на счет',
    'Перевод на накопительный счет',
    'TransferCreditOnLine'
  ]

  const incomes = [
    'Зачисление со счета',
    'Зачисление с накопительного счета'
  ]

  const MAX_TRANSFER_DELAY = 20 * 60 * 1000 // 20 minutes max

  return items.every(
    item => []
      .concat(outcomes)
      .concat(incomes)
      .concat(inouts)
      .some(description =>
        item.apiTransaction.details.indexOf(description) >= 0
      )) &&
    (items => {
      const [outcome, income] = [[...outcomes, ...inouts], [...incomes, ...inouts]]
        .map(descriptions => items.find(item => descriptions.some(description => item.apiTransaction.details.indexOf(description) >= 0)))

      const outcomeAccount = apiAccountsByIdLookup[outcome.accountId]
      console.assert(outcomeAccount, 'Transfer outcome account not found!')
      const outcomeProduct =
        _.find(outcomeAccount.products, { id: outcome.apiTransaction.debet.id, type: outcome.apiTransaction.debet.__type })
      console.assert(outcomeProduct, 'Transfer outcome product not found!')

      const incomeAccount = apiAccountsByIdLookup[income.accountId]
      console.assert(incomeAccount, 'Transfer income account not found!')
      const incomeProduct =
        _.find(incomeAccount.products, { id: income.apiTransaction.debet.id, type: income.apiTransaction.debet.__type })
      console.assert(incomeProduct, 'Transfer income product not found!')

      return (
        (
          income.apiTransaction.details.indexOf(outcomeProduct.apiAccount.number.slice(-4)) >= 0 ||
          outcome.apiTransaction.details.indexOf(incomeProduct.apiAccount.number.slice(-4)) >= 0
        ) && isWithinMaxTransferDelay({ income, outcome }, MAX_TRANSFER_DELAY)
      )
    })(items)
}

const isOutcomeGroup = ({ items }) => {
  return items.every(item => Math.sign(item.apiTransaction.transactionAmount.sum) === 1)
}

const isIncomeGroup = ({ items }) => {
  return items.every(item => Math.sign(item.apiTransaction.transactionAmount.sum) === -1)
}

const isPossiblyTransfer = ({ reference, items, apiAccountsByIdLookup }) => {
  let referencedItems = []

  const match = reference.match(/oid#(\d+)/)
  if (match && items.length > 2) {
    referencedItems = _.filter(items, { apiTransaction: { order: { id: match[1] } } })
    if (referencedItems.length > 2) {
      referencedItems = _.filter(referencedItems, item => Math.abs(item.apiTransaction.transactionAmount.sum) === item.apiTransaction.order.amount.sum)
    }
  } else {
    referencedItems = items
  }

  // TODO: extract to plugin-defined functions, add hook
  if (isOutcomeGroup({ items: referencedItems }) || isIncomeGroup({ items: referencedItems })) {
    // skip all-in and all-out groups, convert them one-by-one
    return false
  }

  return [
    isInternalTransfer
  ].some(fn => fn({ items: referencedItems, apiAccountsByIdLookup }))
}

const createReference = apiMovement => {
  const movementDate = new Date(apiMovement.transactionDate)
  const movementAmount = apiMovement.order ? apiMovement.order.amount : apiMovement.transactionAmountInAccountCurrency || apiMovement.transactionAmount
  if (!movementAmount) {
    console.warn(apiMovement)
  }
  const pattern = `${Math.abs(movementAmount.sum)}${movementAmount.currency.currencyCode} @ ${new Date(
    movementDate.getUTCFullYear(),
    movementDate.getUTCMonth() + 1,
    movementDate.getUTCDay(),
    movementDate.getUTCHours(),
    movementDate.getUTCMinutes()
  ).getTime()}`

  let ref = `#${apiMovement.debet.number.slice(-4)} : ${pattern}`
  const refs = [
    ref,
    pattern
  ]

  if ([
    /TransferCreditOnLine/i,
    /Зачисление со счета \*\d{4}/i,
    /Зачисление с накопительного счета \*\d{4}/i,
    /Перевод на счет \*\d{4}/i,
    /Перевод на накопительный счет \*\d{4}/i,
    /Перевод денежных средств по картам Банка/i,
    /Перевод между собственными счетами и картами/i
  ].some(detailPattern => new RegExp(detailPattern).test(apiMovement.details))) {
    const extraReference = `${Math.abs(movementAmount.sum)}${movementAmount.currency.currencyCode} @ ${new Date(
      movementDate.getUTCFullYear(),
      movementDate.getUTCMonth() + 1
    ).getTime()}`
    refs.push(extraReference)
  }

  if (apiMovement.order) {
    ref = `oid#${apiMovement.order.id}`
    refs.push(apiMovement.order.id)
  }

  return _.fromPairs([[ref, refs]])
}

const getItemReferenceKey = (reference, refs) => {
  const [[ref, patterns]] = _.toPairs(reference)
  const foundRefs = refs.map(refItem => {
    const [[refItemKey, refItemPatterns]] = _.toPairs(refItem)
    const found = _.intersection(patterns, refItemPatterns)
    if (found.length) {
      return refItemKey
    }
    return null
  }).filter(x => x)
  if (foundRefs.length) {
    return foundRefs[0]
  }
  return ref
}

export const composeReferencedMovement = ({ movement, relatedMovements }) => {
  let outcome, income

  // [
  // TODO: extract as plugin function

  if (relatedMovements.length === 2) {
    [outcome, income] =
      [-1, 1].map(amountSign => relatedMovements.find(rMovement => Math.sign(rMovement.apiTransaction.transactionAmount.sum) === amountSign))
  } else {
    let pair
    if (movement.apiTransaction.order) {
      pair = (
        filtered => filtered.length === 2 && filtered[0].apiTransaction.order.id === filtered[1].apiTransaction.order.id && filtered
      )(_.filter(relatedMovements, { apiTransaction: { order: { id: movement.apiTransaction.order.id } } }))

      if (!pair) {
        pair = (
          filtered =>
            filtered.length === 2 && filtered
        )(_.filter(relatedMovements,
          rMovement => Math.abs(rMovement.apiTransaction.transactionAmount.sum) === Math.abs(movement.apiTransaction.transactionAmount.sum)))
      }
    }
    if (!pair) {
      pair = (
        filtered => filtered.length === 2 && filtered[0].apiTransaction.order.id === filtered[1].apiTransaction.order.id && filtered
      )(_.filter(relatedMovements, rMovement => rMovement.apiTransaction.order))
    }
    if (!pair) {
      pair = (
        filtered => filtered.length === 2 && filtered
      )(_.filter(relatedMovements, rMovement => Math.abs(rMovement.apiTransaction.transactionAmount.sum)))
    }

    if (!pair) {
      const refs = []
      const groups = _.groupBy(relatedMovements, rMovement => getItemReferenceKey(createReference(rMovement.apiTransaction), refs))
      pair = (
        filtered => filtered.length === 2 &&
          filtered.some(item => item.apiTransaction.order === null) &&
          Math.abs(filtered[0].apiTransaction.transactionAmount.sum) === Math.abs(filtered[1].apiTransaction.transactionAmount.sum) && filtered
      )(_.filter(_.toPairs(groups), ([key, items]) => items.length !== 2).reduce((all, [key, items]) => all.concat(items), []))
    }

    if (pair) {
      [outcome, income] =
        [-1, 1].map(amountSign => pair.find(rMovement => Math.sign(rMovement.apiTransaction.transactionAmount.sum) === amountSign))

      if (Math.abs(outcome.apiTransaction.transactionAmount.sum) !== Math.abs(income.apiTransaction.transactionAmount.sum)) {
        outcome = null
        income = null
      }
    } else {
      if (movement.apiTransaction.order && relatedMovements.length > 2) {
        return movement
      } else {
        console.assert(false, 'Too much movements without explicit reference!', movement, relatedMovements)
      }
    }
  }
  // ]

  if (!income || !outcome) {
    return movement
  }

  return {
    ...movement,
    apiTransaction: {
      ...movement.apiTransaction,
      outcomeTransaction: outcome.apiTransaction,
      incomeTransaction: income.apiTransaction
    }
  }
}

const complementTransferSides = (apiMovements, apiAccountsByIdLookup) => {
  const refs = []

  const relatedMovementsByReferenceLookup = _.fromPairs(_.toPairs(_.groupBy(apiMovements, x => {
    const { apiTransaction } = x
    const ref = createReference(apiTransaction)
    const reference = getItemReferenceKey(ref, refs)
    // [
    // add reference or update patterns
    const refIndex = _.findIndex(refs, item => _.has(item, reference))
    if (refIndex < 0) {
      refs.push(ref)
    } else {
      const [[, patterns]] = _.toPairs(ref)
      refs[refIndex][reference] = _.uniq(refs[refIndex][reference].concat(patterns))
    }
    // ]
    return reference
  })).filter(
    ([key, items]) => items.length > 1 && isPossiblyTransfer({ reference: key, items, apiAccountsByIdLookup })
  ))

  const movements = apiMovements.map((item) => {
    const { apiTransaction } = item
    const ref = createReference(apiTransaction)
    const reference = getItemReferenceKey(ref, refs)
    const relatedMovements = relatedMovementsByReferenceLookup[reference]
    if (!relatedMovements) {
      return item
    }

    return composeReferencedMovement({ movement: item, relatedMovements })
  })

  return [movements, refs]
}

const isTransferItem = ({ apiMovement, readableTransaction }) => {
  if (readableTransaction.movements.length > 1) {
    return false
  }

  if ([
    /^Перевод с карты \*(\d{4})/,
    /^Перевод на счет \*(\d{4})/,
    /^Перевод на накопительный счет \*(\d{4})/,
    /^Зачисление со счета \*(\d{4})/,
    /^Зачисление с накопительного счета \*(\d{4})/,
    /^Перевод между собственными счетами и картами/,
    /^Перевод денежных средств по картам Банка/
  ].some(pattern => pattern.test(apiMovement.details))) {
    return true
  }

  return false
}

const generateAccountLookup = apiAccounts => apiAccounts.reduce((all, apiAccount) => ({
  ...all,
  [apiAccount.id]: apiAccount,
  ...(
    (apiAccount.cards && apiAccount.cards.length)
      ? apiAccount.cards.reduce(
      (allCards, card) => ({
        ...allCards,
        [card.id]: apiAccount
      }),
      {}
      )
      : {}
  )
}), {})

export const convertApiTransactionsToReadableTransactions = (apiTransactionsByAccountId, apiAccounts) => {
  const accountsByIdLookup = generateAccountLookup(apiAccounts)
  const preprocessedMovements = _.toPairs(apiTransactionsByAccountId)
    .reduce(
      (all, [accountId, apiTransactions]) => all.concat(
        apiTransactions.map(apiTransaction => ({ accountId, apiTransaction }))
      ),
      []
    )
  const movementsWithoutDuplicates = getDistinctApiTransactions(preprocessedMovements)
  const [movementsWithCompleteSides, refs] = complementTransferSides(movementsWithoutDuplicates, accountsByIdLookup)

  const movementsWithCompleteSidesWithoutDuplicates = commonDistinctTransactions({
    transactions: movementsWithCompleteSides,
    makeEqualityObject: ({ apiTransaction }) =>
      (apiTransaction.incomeTransaction && apiTransaction.outcomeTransaction)
        ? {
          incomeTransaction: apiTransaction.incomeTransaction,
          outcomeTransaction: apiTransaction.outcomeTransaction
        }
        : { ...apiTransaction, id: null }
  })

  const processedMovements = movementsWithCompleteSidesWithoutDuplicates.map(
    ({ accountId, apiTransaction }) => {
      const account = accountsByIdLookup[accountId]
      if (!account) {
        return null
      }

      const readableTransaction = convertTransaction(apiTransaction, account)
      if (!readableTransaction) {
        return null
      }

      return {
        apiMovement: apiTransaction,
        account,
        readableTransaction
      }
    }
  )

  const processedMovementsWithoutNonAccountableArtifacts = processedMovements.filter((processedMovement) => {
    if (processedMovement === null) {
      return false
    }
    return true
  })

  return commonMergeTransfers({
    items: processedMovementsWithoutNonAccountableArtifacts,
    selectReadableTransaction: (item) => item.readableTransaction,
    makeGroupKey: (item) =>
      isTransferItem(item)
        ? (reference => getItemReferenceKey(reference, refs))(createReference(item.apiMovement))
        : null,
    mergeComments: null
  })
}
