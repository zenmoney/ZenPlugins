/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import _ from 'lodash'
import * as helper from './helpers'

function getInvoice (apiTransaction) {
  const sign = apiTransaction.money.income ? 1 : -1
  return {
    sum: sign * Math.abs(Math.round(parseFloat(apiTransaction.money.amount) * 100) / 100),
    instrument: apiTransaction.money.currency
  }
}

const converter = (apiTransaction, mapContractToAccount = {}) => {
  const invoice = getInvoice(apiTransaction)
  const sign = apiTransaction.money.income ? 1 : -1
  const accountId = resolveAccountId(apiTransaction, mapContractToAccount)
  const transaction = {
    comment: null,
    date: new Date(apiTransaction.date),
    hold: !/DONE/.test(apiTransaction.status),
    merchant: null,
    movements: [
      {
        id: apiTransaction.id.toString() || null,
        account: { id: accountId },
        invoice: apiTransaction.money.accountAmount?.currency && invoice.instrument !== apiTransaction.money.accountAmount.currency
          ? invoice
          : null,
        sum: sign * Math.abs(Math.round(parseFloat(apiTransaction.money.accountAmount?.amount || apiTransaction.money.amount) * 100) / 100),
        fee: 0
      }
    ]
  };
  [
    parseCashTransfer,
    parseInnerTransfer,
    parseOuterTransfer,
    parseComment,
    parsePayee
    // parseAll
  ].some(parser => parser(transaction, apiTransaction, accountId, invoice))
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, accountId, invoice) {
  if (!(apiTransaction.type === 'CASH' ||
    (apiTransaction.type === 'RECHARGE' &&
      (apiTransaction.typeName === 'Пополнение наличными' || apiTransaction.title === 'Пополнение')))) { return false }
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: invoice.instrument,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  transaction.comment = apiTransaction.description || apiTransaction.title.replace('Пополнение', '') || null
  return true
}

function parseInnerTransfer (transaction, apiTransaction, accountId, invoice) {
  if (apiTransaction.type !== 'WALLET') { return false }
  transaction.movements[0].sum = -transaction.movements[0].sum
  if (transaction.movements[0].invoice) { transaction.movements[0].invoice.sum = -transaction.movements[0].invoice.sum }
  transaction.movements.push({
    id: null,
    account: { id: helper.walletUniqueAccountId(apiTransaction.walletId) },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  if (apiTransaction.serviceCode === 'WLT_CLOSE') {
    transaction.movements[1].account = {
      type: 'ccard',
      instrument: invoice.instrument,
      company: null,
      syncIds: null
    }
  }
  transaction.comment = `${apiTransaction.typeName} ${apiTransaction.title}`
  return true
}

function parseOuterTransfer (transaction, apiTransaction, accountId, invoice) {
  if (!([
    'ZKDP', // Перевод «Золотая Корона»
    'FDT_RBS_COMMISSION', // Исходящий
    'TRANSFER'
  ].some(str => str === apiTransaction.type) ||
    (apiTransaction.type === 'RECHARGE' &&
      (/(Перевод|Пополнение) с карты/.test(apiTransaction.typeName) || /(Перевод|Пополнение) с карты/.test(apiTransaction.title)))
  )) {
    return false
  }

  const commission = apiTransaction.money.amountDetail.commission
  let title

  switch (apiTransaction.type) {
    case 'TRANSFER':
      if (apiTransaction.typeName) {
        title = `${apiTransaction.typeName} ${apiTransaction.title}`
      }
      break
    case 'ZKDP':
      if (apiTransaction.serviceCode === 'DP2Wallet') {
        transaction.movements[0].account = { id: helper.walletUniqueAccountId(apiTransaction.walletId) }
      }
      transaction.movements[0].fee = commission > 0 ? -commission : 0
      title = apiTransaction.title
      transaction.comment = apiTransaction.typeName
      break
    case 'FDT_RBS_COMMISSION':
      title = apiTransaction.paymentDetail?.payee || apiTransaction.paymentDetail?.purposePayment || apiTransaction.title
      if (apiTransaction.paymentDetail?.payeeBankName) {
        transaction.comment = apiTransaction.paymentDetail.payeeBankName
      }
      break
    case 'RECHARGE':
      title = apiTransaction.title.replace(/(Перевод|Пополнение) с карты:?/, '').replace(/(MASTERCARD|VISA)/i, '').trim()
  }

  let country = null
  let city = null
  if (apiTransaction.paymentDetail?.city?.indexOf(',') >= 0) {
    const cityArray = apiTransaction.paymentDetail.city.split(',')
    if (cityArray.length > 1) {
      country = cityArray[0].trim()
      city = cityArray[1].trim()
    } else {
      city = cityArray[1].trim()
    }
  }
  if (title || city || country) {
    transaction.merchant = {
      country,
      city,
      title,
      mcc: null,
      location: null
    }
  }

  transaction.movements.push({
    id: null,
    account: {
      type: 'ccard',
      instrument: invoice.instrument,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: commission ? -commission - invoice.sum : -invoice.sum,
    fee: 0
  })
  return true
}

function parseComment (transaction, apiTransaction, accountId, invoice) {
  if ([
    /Комиссия за/
  ].some(regex => regex.test(apiTransaction.typeName))) {
    transaction.comment = apiTransaction.typeName
    if (apiTransaction.description) { transaction.comment += ` ${apiTransaction.description}` }
    return true
  }

  if ([
    'DEPOSIT_PROC'
  ].some(str => str === apiTransaction.type)) {
    transaction.comment = apiTransaction.typeName ? apiTransaction.typeName : apiTransaction.title
    if (apiTransaction.paymentDetail?.depositBankName) {
      transaction.comment += ` ${apiTransaction.paymentDetail.depositBankName}`
    }
    return true
  }
  if ([
    /Начисление процентов/i
  ].some(regex => regex.test(apiTransaction.title))) {
    transaction.comment = apiTransaction.title
    if (apiTransaction.description) { transaction.comment += ` ${apiTransaction.description}` }
    return true
  }
  return false
}

function parsePayee (transaction, apiTransaction, accountId, invoice) {
  if (![
    'PURCHASE',
    'PAYMENT',
    'REFUND'
  ].some(str => str === apiTransaction.type)) {
    return false
  }

  let city = apiTransaction.description?.indexOf(',') >= 0 ? apiTransaction.description.split(',')[1].trim() : null
  if (/\.(com|net|ru|ua|by)$/i.test(city)) { city = null }
  transaction.merchant = {
    country: null,
    city,
    title: apiTransaction.title,
    mcc: apiTransaction.mcc?.code ? parseInt(apiTransaction.mcc.code) : null,
    location: null
  }
  if (/Возврат платежа:/.test(apiTransaction.title)) {
    transaction.merchant.title = transaction.merchant.title.replace('Возврат платежа:', '').trim()
    transaction.comment = 'Возврат платежа'
  } else if (apiTransaction.type === 'REFUND') {
    transaction.comment = apiTransaction.typeName
  }
  return true
}

/**
 * @param item
 * @param contractToAccount
 * @returns {*}
 */
const resolveAccountId = (item, contractToAccount) => {
  let accountId = null

  if (_.has(item, 'contractId')) {
    accountId = contractToAccount[item.contractId]
  } else if (_.has(item, 'cardId')) {
    accountId = helper.cardUniqueAccountId(item.cardId)
  }

  return accountId
}

export {
  converter
}
