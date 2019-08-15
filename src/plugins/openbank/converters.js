import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    let converter
    const type = apiAccount.loan ? 'credit' : apiAccount.productType && apiAccount.productType.toLowerCase()
    switch (type) {
      case 'card':
        converter = convertCard
        break
      case 'accumulation':
      case 'current':
        converter = convertAccount
        break
      case 'metal':
        converter = convertMetalAccount
        break
      case 'credit':
        converter = convertLoan
        break
      default:
        console.assert(false, 'unsupported account', apiAccount)
    }
    const account = converter(apiAccount)
    if (account) {
      accounts.push(account)
    }
  }
  return accounts
}

function convertLoan (apiAccount) {
  if (apiAccount.status === 'CLOSED') {
    return null
  }
  const startDate = new Date(apiAccount.openDate + 'T00:00:00+03:00')
  const endDate = new Date(apiAccount.endDate + 'T00:00:00+03:00')
  const account = {
    id: apiAccount.id,
    type: 'loan',
    title: apiAccount.name,
    instrument: apiAccount.account.currency,
    syncID: [
      apiAccount.account.accNum
    ],
    balance: apiAccount.debt ? -Math.abs(apiAccount.debt) : 0,
    startBalance: apiAccount.loan,
    startDate,
    capitalization: true,
    percent: apiAccount.percent,
    payoffStep: 1,
    payoffInterval: 'month'
  }
  const { interval, count } = getIntervalBetweenDates(startDate, endDate)
  account.endDateOffset = count
  account.endDateOffsetInterval = interval
  return {
    account,
    product: {
      id: account.id,
      type: 'loan'
    }
  }
}

function convertCard (apiAccount) {
  if (apiAccount.status.code !== 'NORMAL') {
    return null
  }
  return {
    product: {
      id: apiAccount.cardId,
      type: 'card'
    },
    account: {
      id: apiAccount.cardId,
      type: 'ccard',
      title: apiAccount.tariffPlan.name,
      instrument: apiAccount.balance.currency,
      syncID: [
        apiAccount.maskCardNum,
        apiAccount.accNum
      ],
      balance: apiAccount.balance.amount
    }
  }
}

function convertAccount (apiAccount) {
  if (apiAccount.status.code !== 'NORMAL') {
    return null
  }
  return {
    product: {
      id: apiAccount.idExt,
      type: 'account'
    },
    account: {
      id: apiAccount.idExt,
      type: 'checking',
      title: (apiAccount.productType === 'ACCUMULATION' && apiAccount.name) || apiAccount.accName,
      instrument: apiAccount.balance.currency,
      syncID: [
        apiAccount.accNum
      ],
      balance: apiAccount.balance.amount,
      ...apiAccount.productType === 'ACCUMULATION' && { savings: true }
    }
  }
}

const GRAMS_IN_OZ = 31.1034768

function convertMetalAccount (apiAccount) {
  if (apiAccount.status.code !== 'NORMAL') {
    return null
  }
  const instrument = parseMetalInstrument(apiAccount.balance.currency)
  console.assert(instrument, 'unexpected metal account', apiAccount)
  const balance = apiAccount.balance.amount / GRAMS_IN_OZ
  return {
    product: {
      id: apiAccount.idExt,
      type: 'account'
    },
    account: {
      id: apiAccount.idExt,
      type: 'checking',
      title: apiAccount.name || apiAccount.accName,
      instrument,
      syncID: [
        apiAccount.accNum
      ],
      balance
    }
  }
}

function parseMetalInstrument (instrument) {
  switch (instrument) {
    case 'AUR':
    case 'A98':
      return 'XAU'
    case 'ARG':
    case 'A99':
      return 'XAG'
    case 'PTR':
    case 'A76':
      return 'XPT'
    case 'PDR':
    case 'A33':
      return 'XPD'
    default:
      return null
  }
}

export function parseDate (str) {
  return new Date(str.slice(0, -2) + ':' + str.slice(-2))
}

export function convertTransaction (apiTransaction, account) {
  const invoice = {
    sum: apiTransaction.authAmount.amount,
    instrument: apiTransaction.authAmount.currency
  }
  const transaction = {
    hold: apiTransaction.status.code === 'ACCEPTED',
    date: parseDate(apiTransaction.authDate),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: apiTransaction.transAmount.amount,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account))
  return transaction
}

function parsePayee (transaction, apiTransaction) {
  const description = apiTransaction.place && apiTransaction.place.trim()
  if (!description) {
    return false
  }
  if ([
    'Комиссия',
    'OPEN.RU CARD2CARD'
  ].some(str => description.indexOf(str) >= 0)) {
    transaction.comment = description
    return false
  }
  let mcc = apiTransaction.mccCode ? parseInt(apiTransaction.mccCode) : NaN
  if (isNaN(mcc)) {
    mcc = null
  }
  transaction.merchant = {
    country: null,
    city: null,
    title: description,
    mcc,
    location: null
  }
  return false
}
