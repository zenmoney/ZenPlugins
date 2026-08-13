import { isEmpty } from 'lodash'

function convertAccount (apiAccount, products) {
  const number = apiAccount.type === 'card'
    ? apiAccount.parentNumber
    : apiAccount.number || apiAccount.ancestorNumber
  return {
    ...!apiAccount.ancestorNumber
      ? {
          mainProduct: {
            id: apiAccount.id
          }
        }
      : { },
    account: {
      id: apiAccount.id.toString(),
      type: 'ccard',
      title: products.length > 0 ? products[0].number.slice(-5) : '*' + apiAccount.number.slice(-4),
      instrument: apiAccount.currency,
      syncID: [number].concat(products.map(card => card.number)),
      ...!isEmpty(apiAccount.balances)
        ? apiAccount.balances.cr_limit.value > 0
          ? {
              available: +apiAccount.balances.available.value,
              creditLimit: +apiAccount.balances.cr_limit.value
            }
          : {
              balance: +apiAccount.balances.available.value
            }
        : { balance: null }
    }
  }
}

export function convertAccounts (apiAccounts) {
  const productsByParentNumber = {}
  const accounts = []
  const parentAccountsByNumbers = {}
  const loneAccounts = []
  for (const apiAccount of apiAccounts) {
    if (apiAccount.parentNumber && apiAccount.type === 'card') {
      if (productsByParentNumber[apiAccount.parentNumber]) {
        productsByParentNumber[apiAccount.parentNumber].push(apiAccount)
      } else {
        productsByParentNumber[apiAccount.parentNumber] = [apiAccount]
      }
    } else if (apiAccount.type !== 'card') {
      parentAccountsByNumbers[apiAccount.number] = apiAccount
      if (!productsByParentNumber[apiAccount.number]) {
        loneAccounts.push(apiAccount)
      }
    }
  }

  for (const key in productsByParentNumber) {
    if (!parentAccountsByNumbers[key]) {
      const products = productsByParentNumber[key]
      const parentAccount = products[products.length - 1]
      parentAccount.id = parentAccount.parentId
      accounts.push(convertAccount(parentAccount, products.reverse() || []))
    } else {
      accounts.push(convertAccount(parentAccountsByNumbers[key], productsByParentNumber[key] || []))
    }
  }

  for (const account of loneAccounts) {
    accounts.push(convertAccount(account, []))
  }

  return accounts
}

export function convertTransactions (apiTransactions, account) {
  const transactions = []
  for (const apiTransaction of apiTransactions) {
    const transaction = convertTransaction(apiTransaction, account)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return transactions
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.totalAmount?.value === 0 || apiTransaction.status?.match(/failed/i)) {
    return null
  }
  const invoice = (apiTransaction.transAmount && {
    sum: +apiTransaction.transAmount.value,
    instrument: apiTransaction.transAmount.currency
  }) || ((apiTransaction.totalAmount && {
    sum: +apiTransaction.totalAmount.value,
    instrument: apiTransaction.totalAmount.currency
  })) || null
  const transaction = {
    hold: apiTransaction.status === 'holds' || apiTransaction.status === 'waiting', // maybe wrong
    date: new Date(apiTransaction.operationTime.replace(/(\+\d{2})(\d{2})/, '$1:$2')),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: invoice && invoice.instrument === account.instrument ? null : invoice,
        sum: +apiTransaction.totalAmount?.value ? (+apiTransaction.totalAmount?.value - (+apiTransaction.fees.totalFee?.value || 0)) || +apiTransaction.totalAmount?.value : invoice.sum,
        fee: apiTransaction.fees?.totalFee && apiTransaction && (Math.abs(+apiTransaction.totalAmount?.value) - Math.abs(+apiTransaction.fees.totalFee.value) !== 0) ? +apiTransaction.fees.totalFee.value : 0
      }
    ],
    merchant: null,
    comment: null
  }
  const parsers = [
    parseComment,
    parseInnerTransfer,
    parseOuterTransfer,
    parseCashTransfer,
    parsePayee
  ]
  parsers.some(parser => parser(transaction, apiTransaction, account, invoice))

  return transaction
}

function parseComment (transaction, apiTransaction, account, invoice) {
  if (apiTransaction.description?.match(/^.*Зарахування переказу на рахунок.*$/i) ||
  ([
    /^.*ATM.*$/,
    /^.*АТМ.*$/
  ].some(regexp => regexp.test(apiTransaction.description)) && !apiTransaction.description?.match(/Inquiry Fee/i))) {
    return false
  }
  if (apiTransaction.description?.match(/Inquiry Fee/i)) {
    transaction.comment = apiTransaction.description
    return false
  }
  if (apiTransaction.location && apiTransaction.location.city && apiTransaction.location.merchant) {
    transaction.merchant = {
      title: apiTransaction.location.merchant,
      mcc: null,
      location: null,
      city: apiTransaction.location.city.replace(/^\s+/g, '').replace(/\s+$/g, ''),
      country: apiTransaction.location.country
    }
  } else if (apiTransaction.service?.shortFields && apiTransaction.operationType?.match(/payment/i)) {
    const merchantData = apiTransaction.description?.match(/[A-Z\- ]+$/)[0].split(' ')
    if (merchantData && merchantData.slice(3).join(' ') === '') {
      transaction.comment = apiTransaction.description
    } else if (merchantData) {
      transaction.merchant = {
        title: apiTransaction.service?.shortFields?.BILLER_NAME ? apiTransaction.service.shortFields.BILLER_NAME : merchantData[1],
        mcc: null,
        location: null,
        city: apiTransaction.service?.shortFields?.BILLER_NAME ? merchantData[1] : merchantData[2],
        country: merchantData.slice(3).join(' ')
      }
    }
  } else if ([
    /^.*Zarakhuvannia bezghotivkovykh koshtiv.*$/,
    /^.*Зарахування безготівкових коштів.*$/
  ].some(regexp => regexp.test(apiTransaction.description))) {
    const merchantData = (apiTransaction.description.match(/від: (.*)$/) || apiTransaction.description.match(/#([а-яА-Яa-zA-Zі ]+)/))
    if (Array.isArray(merchantData) && merchantData.length > 1) {
      transaction.merchant = {
        title: (apiTransaction.description.match(/від: (.*)$/) || apiTransaction.description.match(/#([а-яА-Яa-zA-Zі ]+)/))[1],
        mcc: null,
        location: null,
        city: null,
        country: null
      }
    } else {
      transaction.comment = apiTransaction.description
    }
  } else {
    transaction.comment = apiTransaction.description || null
  }
  return false
}

function parseInnerTransfer (transaction, apiTransaction) {
  if (![
    /^.*Зарахування переказу на рахунок.*$/i
  ].some(regexp => regexp.test(apiTransaction.description)) &&
    !(apiTransaction.operationType?.match(/transfer/i) &&
    apiTransaction.payment?.type.match(/intra_bank_transfer/i)) &&
    !apiTransaction.service?.id?.match(/TRANSFER_TO_SAV/i)) {
    return false
  }
  if (apiTransaction.operationType?.match(/transfer/i) && apiTransaction.payment) {
    transaction.groupKeys = [
      `${apiTransaction.payment.beneficiary?.id}_${Math.abs(+apiTransaction.transAmount.value)}_${apiTransaction.operationTime.substring(0, 10)}`
    ]
  } else {
    transaction.groupKeys = [
      `${apiTransaction.contractId}_${Math.abs(+apiTransaction.transAmount.value)}_${apiTransaction.operationTime.substring(0, 10)}`
    ]
  }
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /^.*Direct P2P.*$/i,
    /^.*Zarakhuvannia bezghotivkovykh koshtiv.*$/,
    /^.*Зарахування безготівкових коштів.*$/,
    /Переказ/i
  ].some(regexp => regexp.test(apiTransaction.description)) ||
    [
      /transfer/i
    ].some(regexp => regexp.test(apiTransaction.operationType))) {
    const syncIds = apiTransaction.service?.shortFields?.DESTINATION?.match(/[0-1A-Z]+/)
    transaction.movements.push({
      id: null,
      account: {
        type: /^.*картки.*$/i.test(apiTransaction.description) || apiTransaction.service?.name.match(/карт/i) || apiTransaction.service?.name.match(/card/i) ? 'ccard' : 'checking',
        instrument: invoice.instrument,
        company: null,
        syncIds: syncIds
          ? [apiTransaction.service.shortFields.DESTINATION]
          : null
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
    return true
  }
  return false
}

function parseCashTransfer (transaction, apiTransaction) {
  if (([
    /^.*ATM.*$/,
    /^.*АТМ.*$/
  ].some(regexp => regexp.test(apiTransaction.description)) ||
    [
      /^Cash withdrawal without a card$/
    ].some(regexp => regexp.test(apiTransaction.service?.name))) && !apiTransaction.description?.match(/Inquiry Fee/i)) {
    transaction.movements.push(
      {
        id: null,
        account: {
          type: 'cash',
          instrument: apiTransaction.transAmount.currency,
          company: null,
          syncIds: null
        },
        invoice: null,
        sum: -apiTransaction.transAmount.value,
        fee: 0
      }
    )
    return true
  }
  return false
}

function parsePayee (transaction, apiTransaction) {
  return false
}
