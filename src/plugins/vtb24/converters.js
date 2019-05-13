import * as _ from 'lodash'
import { toISODateString } from '../../common/dateUtils'
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
          } else if (apiAccount.__type === 'ru.vtb24.mobilebanking.protocol.product.DepositContractMto' &&
            apiAccount.account &&
            apiAccount.account.__type === 'ru.vtb24.mobilebanking.protocol.product.DepositAccountMto') {
            converter = convertDeposit
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
    mainProduct: {
      id: apiAccount.id,
      type: apiAccount.__type
    },
    products: [],
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

export function convertCardAccount (apiAccount) {
  const zenAccount = {
    id: apiAccount.id,
    type: 'checking',
    title: apiAccount.name,
    syncID: []
  }
  const mainProduct = {
    id: apiAccount.id,
    type: apiAccount.__type
  }
  const products = []

  let amount = apiAccount.amount
  const cards = apiAccount.cards ? apiAccount.cards.filter(card => {
    return card && card.status && card.status.id === 'ACTIVE' && !card.archived
  }) : []
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
      products.push({
        id: card.id,
        type: card.__type
      })
    })
  }
  amount = convertAmount(amount)
  console.assert(amount, 'unexpected account', apiAccount)

  zenAccount.balance = amount.sum
  zenAccount.instrument = amount.instrument
  const accountSyncId = apiAccount.number.replace(/X/g, '*')
  if (zenAccount.syncID.indexOf(accountSyncId) < 0) {
    zenAccount.syncID.push(accountSyncId)
  }
  if (typeof apiAccount.creditLimit === 'number') {
    zenAccount.creditLimit = apiAccount.creditLimit
  }

  return { mainProduct, products, zenAccount }
}

export function convertAccount (apiAccount) {
  const { mainProduct, products, zenAccount } = convertCardAccount(apiAccount)
  if (apiAccount.contract &&
    apiAccount.contract.__type === 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto') {
    mainProduct.id = apiAccount.contract.id
    mainProduct.type = apiAccount.contract.__type
    zenAccount.id = apiAccount.contract.id
  }
  if ([
    'ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto',
    'ru.vtb24.mobilebanking.protocol.product.InvestmentAccountMto'
  ].indexOf(apiAccount.__type) >= 0) {
    zenAccount.savings = true
  }
  return { mainProduct, products, zenAccount }
}

export function convertDeposit (apiAccount) {
  const zenAccount = {
    id: apiAccount.id,
    type: 'deposit',
    title: apiAccount.name,
    instrument: getInstrument(apiAccount.account.amount.currency.currencyCode),
    startDate: apiAccount.openDate,
    startBalance: 0,
    balance: apiAccount.account.amount.sum,
    percent: apiAccount.account.interestRate,
    capitalization: true,
    payoffInterval: 'month',
    payoffStep: 1,
    syncID: [apiAccount.account.number.replace(/[^\d]/g, '')]
  }
  const contractPeriod = apiAccount.contractPeriod || apiAccount.account.contract.contractPeriod
  if (contractPeriod) {
    switch (contractPeriod.unit.id.toLowerCase()) {
      case 'month':
      case 'year':
      case 'day':
        zenAccount.endDateOffsetInterval = contractPeriod.unit.id.toLowerCase()
        zenAccount.endDateOffset = contractPeriod.value
        break
      default:
        console.assert(false, `unsupported loan contract period ${contractPeriod.unit.id}`)
    }
  } else {
    zenAccount.endDateOffset = 1
    zenAccount.endDateOffsetInterval = 'year'
  }
  const mainProduct = {
    id: apiAccount.id,
    type: apiAccount.__type
  }
  return { mainProduct, products: [], zenAccount }
}

export function convertLoan (apiAccount) {
  const zenAccount = {
    id: apiAccount.id,
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
  const mainProduct = {
    id: apiAccount.id,
    type: apiAccount.__type
  }
  return { mainProduct, products: [], zenAccount }
}

export function getTransactionId (apiTransaction) {
  if (/;/.test(apiTransaction.id)) {
    // apiTransaction.id is [statementId, transactionId] pair
    const [, transactionId] = apiTransaction.id.split(';')
    return transactionId
  }
  // else apiTransaction.id is uuid
  return apiTransaction.id
}

function convertAmount (amount) {
  if (!amount) {
    return null
  }
  const zenAmount = {
    sum: amount.sum,
    instrument: getInstrument(amount.currency.currencyCode)
  }
  if (parseMetalInstrument(amount.currency.currencyCode)) {
    zenAmount.sum = atMostTwoDecimals(zenAmount.sum / GRAMS_IN_OZ)
  }
  return zenAmount
}

export function mergeTransfers (transactions) {
  const firstTransfer = transactions.find(transaction => transaction.groupKeys)
  if (firstTransfer) {
    const groupKeysLength = firstTransfer.groupKeys.length
    for (let i = 0; i < groupKeysLength; i++) {
      transactions = commonMergeTransfers({
        items: transactions,
        throwOnCollision: false,
        getSingleMovement: transaction => transaction.movements.find(movement => Boolean(movement.account.id)),
        makeGroupKey: transaction => {
          return transaction.groupKeys &&
          transaction.groupKeys[i] &&
          transaction.movements.filter(movement => Boolean(movement.account.id)).length === 1
            ? transaction.groupKeys[i]
            : null
        }
      })
    }
    transactions = transactions.map(transaction => _.omit(transaction, ['groupKeys']))
  }
  return transactions
}

function getInvoice (apiTransaction) {
  let amount
  if (apiTransaction.transactionAmount &&
    apiTransaction.transactionAmount.sum === 0 &&
    apiTransaction.transactionAmountInAccountCurrency &&
    apiTransaction.transactionAmountInAccountCurrency.sum !== 0 &&
    apiTransaction.transactionAmountInAccountCurrency.currency.currencyCode === apiTransaction.transactionAmount.currency.currencyCode) {
    amount = apiTransaction.transactionAmountInAccountCurrency
  } else {
    amount = apiTransaction.transactionAmount
  }
  return convertAmount(amount)
}

export function convertTransaction (apiTransaction, account) {
  let amount
  if (apiTransaction.transactionAmountInAccountCurrency && apiTransaction.transactionAmountInAccountCurrency.sum !== 0) {
    amount = apiTransaction.transactionAmountInAccountCurrency
  } else {
    amount = apiTransaction.transactionAmount
  }
  amount = convertAmount(amount)
  if (!amount || amount.sum === 0) {
    return null
  }
  const invoice = getInvoice(apiTransaction)
  amount.sum = Math.sign(invoice.sum) * Math.abs(amount.sum)
  const transaction = {
    comment: null,
    date: new Date(apiTransaction.transactionDate),
    hold: apiTransaction.isHold,
    merchant: null,
    movements: [
      {
        id: getTransactionId(apiTransaction),
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: amount.instrument === account.instrument ? amount.sum : null,
        fee: 0
      }
    ]
  }

  if (apiTransaction.details) {
    [
      parseInnerTransfer,
      parseCashTransaction,
      parsePayee
    ].some(parser => parser(apiTransaction, transaction))
  }
  return transaction
}

function parseInnerTransfer (apiTransaction, transaction) {
  for (const pattern of [
    /^TransferCreditOnLine/,
    /Зачисление с другой карты \(Р2Р\)/,
    /Перевод на другую карту \(Р2Р\)/,
    /^Перевод с карты \*(\d{4})/,
    /^Перевод на счет \*(\d{4})/,
    /^Перевод на накопительный счет \*(\d{4})/,
    /^Зачисление со счета \*(\d{4})/,
    /^Зачисление с накопительного счета \*(\d{4})/,
    /^Перевод между собственными счетами и картами/,
    /^Перевод денежных средств по картам Банка/
  ]) {
    const match = apiTransaction.details.match(pattern)
    if (match) {
      console.assert(transaction.movements.length < 2, 'Too much movements', { transaction, apiTransaction })
      const invoice = getInvoice(apiTransaction)
      transaction.groupKeys = []
      transaction.movements.push({
        id: null,
        account: {
          type: 'ccard',
          instrument: invoice.instrument,
          company: null,
          syncIds: match[1] ? [match[1]] : null
        },
        invoice: null,
        sum: -invoice.sum,
        fee: 0
      })
      if (apiTransaction.order && apiTransaction.order.id) {
        transaction.groupKeys.push(apiTransaction.order.id)
      } else {
        transaction.groupKeys.push(null)
      }
      transaction.groupKeys.push(toISODateString(transaction.date) + '_' + invoice.instrument + '_' + Math.abs(invoice.sum))
      return true
    }
  }

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

  return false
}

function parseCashTransaction (apiTransaction, transaction) {
  if (![
    'Снятие в банкомате',
    'Пополнение через банкомат'
  ].some(pattern => apiTransaction.details.indexOf(pattern) >= 0)) {
    return false
  }
  const invoice = getInvoice(apiTransaction)
  console.assert(transaction.movements.length < 2, 'Too much movements', { transaction, apiTransaction })
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: invoice.instrument,
      syncIds: null,
      company: null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })

  return true
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
        'Начисленные %',
        'Комиссия'
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
