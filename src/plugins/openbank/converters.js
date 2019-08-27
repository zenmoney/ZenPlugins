import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiAccounts) {
  const accounts = []
  const cardAccounts = {}
  for (const apiAccount of apiAccounts) {
    let converter
    const type = apiAccount.loan || apiAccount.overdue ? 'credit' : apiAccount.contracts ? 'deposit' : apiAccount.productType && apiAccount.productType.toLowerCase()
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
      case 'deposit':
        converter = convertDeposit
        break
      default:
        console.assert(false, 'unsupported account', apiAccount)
    }
    const account = converter(apiAccount)
    if (account) {
      if (type === 'card') {
        const existing = cardAccounts[account.account.id]
        if (existing) {
          existing.products.push(...account.products)
          for (const syncId of account.account.syncID) {
            if (existing.account.syncID.indexOf(syncId) < 0) {
              existing.account.syncID.splice(1, 0, syncId)
            }
          }
          continue
        } else {
          cardAccounts[account.account.id] = account
        }
      }
      accounts.push(account)
    }
  }
  return accounts
}

function convertDeposit (apiAccount) {
  if (apiAccount.status.code !== 'NORMAL') {
    return null
  }
  const startDate = parseDate(apiAccount.openDate)
  const account = {
    id: apiAccount.contracts[0].contractNum,
    type: 'deposit',
    title: apiAccount.productName,
    instrument: apiAccount.contracts[0].balance.currency,
    syncID: [
      apiAccount.contracts[0].contractNum
    ],
    balance: apiAccount.contracts[0].balance.amount,
    startBalance: apiAccount.contracts[0].balance.amount,
    startDate,
    capitalization: true,
    percent: apiAccount.contracts[0].percent,
    payoffStep: 1,
    payoffInterval: 'month'
  }
  if (apiAccount.expDate) {
    const endDate = parseDate(apiAccount.expDate)
    const { interval, count } = getIntervalBetweenDates(startDate, endDate)
    account.endDateOffset = count
    account.endDateOffsetInterval = interval
  } else {
    account.endDateOffset = apiAccount.daysElapsed
    account.endDateOffsetInterval = 'day'
  }
  return {
    account,
    products: [
      {
        id: apiAccount.contracts[0].contractNum,
        type: 'deposit'
      }
    ]
  }
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
    products: [
      {
        id: account.id,
        type: 'loan'
      }
    ]
  }
}

function convertCard (apiAccount) {
  if (apiAccount.status.code !== 'NORMAL') {
    return null
  }
  const syncIds = [apiAccount.maskCardNum]
  const accountNumber = apiAccount.accNum && /^[\d\s]*\d{4}$/.test(apiAccount.accNum) ? apiAccount.accNum : null
  if (accountNumber) {
    syncIds.push(accountNumber)
  }
  return {
    products: [
      {
        id: apiAccount.cardId,
        type: 'card'
      }
    ],
    account: {
      id: accountNumber || apiAccount.maskCardNum,
      type: 'ccard',
      title: apiAccount.tariffPlan.name || apiAccount.name || apiAccount.cardType,
      instrument: apiAccount.balance.currency,
      syncID: syncIds,
      balance: Math.round((apiAccount.balance.amount - (apiAccount.creditLimit || 0)) * 100) / 100,
      ...apiAccount.creditLimit && { creditLimit: apiAccount.creditLimit }
    }
  }
}

function convertAccount (apiAccount) {
  if (apiAccount.status.code !== 'NORMAL') {
    return null
  }
  return {
    products: [
      {
        id: apiAccount.accNum,
        type: 'account'
      }
    ],
    account: {
      id: apiAccount.accNum,
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

export const GRAMS_IN_OZ = 31.1034768

function convertMetalAccount (apiAccount) {
  if (apiAccount.status.code !== 'NORMAL') {
    return null
  }
  const instrument = parseMetalInstrument(apiAccount.balance.currency)
  console.assert(instrument, 'unexpected metal account', apiAccount)
  const balance = apiAccount.balance.amount / GRAMS_IN_OZ
  return {
    products: [
      {
        id: apiAccount.accNum,
        type: 'account'
      }
    ],
    account: {
      id: apiAccount.accNum,
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
  const description = (apiTransaction.place && apiTransaction.place.trim()) || (apiTransaction.description && apiTransaction.description.trim())
  if (description && [
    'Погашение ссудной задолженности'
  ].indexOf(description) >= 0) {
    return null
  }
  let invoice = apiTransaction.authAmount ? {
    sum: apiTransaction.authAmount.amount,
    instrument: apiTransaction.authAmount.currency
  } : {
    sum: apiTransaction.transAmount.amount,
    instrument: apiTransaction.transAmount.currency
  }
  if (parseMetalInstrument(invoice.instrument)) {
    invoice = {
      instrument: parseMetalInstrument(invoice.instrument),
      sum: invoice.sum / GRAMS_IN_OZ
    }
  }
  let sum = apiTransaction.transAmount.amount
  if (parseMetalInstrument(apiTransaction.transAmount.currency)) {
    sum /= GRAMS_IN_OZ
  }
  const transaction = {
    hold: apiTransaction.status.code === 'ACCEPTED',
    date: parseDate(apiTransaction.authDate),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parseInnerTransfer,
    parseOuterTransfer,
    parseCashWithdrawal,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account, invoice, description))
  return transaction
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice, description) {
  if (!description) {
    return false
  }
  if (![
    /Перевод собств. ср-в/,
    /Перечисление денежных средств для пополнения счета/,
    /Продажа металла клиенту/,
    /Зачисление(.*)клиенту/
  ].some(regexp => regexp.test(description))) {
    return false
  }
  let invoiceSumStr = `${Math.abs(invoice.sum * 100) / 100}`
  const dotIndex = invoiceSumStr.indexOf('.')
  if (dotIndex >= 0 && dotIndex < invoiceSumStr.length - 4) {
    invoiceSumStr = invoiceSumStr.slice(0, dotIndex + 5)
  }
  let detailedGroupKey = null
  for (const regexp of [
    /с карты .*\(([\d*]*).*на счёт ([\d*]*)/,
    /со счёта ([\d*]*).*на карту.*\(([\d*]*)*/
  ]) {
    const match = description.match(regexp)
    if (match) {
      const outcomeSyncId = match[1]
      const incomeSyncId = match[2]
      detailedGroupKey = `${apiTransaction.authDate.substring(0, 10)}_${invoice.instrument}_${invoiceSumStr}` +
        `_${outcomeSyncId.slice(-4)}_${incomeSyncId.slice(-4)}`
      break
    }
  }
  transaction.movements[0].invoice = null
  transaction.groupKeys = [
    detailedGroupKey,
    `${apiTransaction.authDate.substring(0, 10)}_${invoice.instrument}_${invoiceSumStr}`
  ]
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice, description) {
  if (!description) {
    return false
  }
  if (![
    /Перевод по номеру телефона/,
    /OPEN.RU CARD2CARD/i,
    /Перевод СБП/
  ].some(regexp => regexp.test(description))) {
    return false
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
    sum: -invoice.sum,
    fee: 0
  })
  for (const regexp of [
    /Получатель: (.*)/,
    /Перевод СБП от ([^\d]*)/
  ]) {
    const match = description.match(regexp)
    const payee = match && match[1].trim()
    if (payee) {
      transaction.merchant = {
        country: null,
        city: null,
        title: payee,
        mcc: null,
        location: null
      }
    }
  }
  if (!transaction.merchant) {
    transaction.comment = description
  }
  return true
}

function parseCashWithdrawal (transaction, apiTransaction, account, invoice, description) {
  if (apiTransaction.category && [
    'CASH_WITHDRAWAL'
  ].indexOf(apiTransaction.category.code) < 0) {
    return false
  }
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
  return true
}

function parsePayee (transaction, apiTransaction, account, invoice, description) {
  if (!description) {
    return false
  }
  if (apiTransaction.operationType && ['KOM'].indexOf(apiTransaction.operationType.code) >= 0) {
    transaction.comment = description
    return false
  }
  if ([
    'Комиссия',
    'Перечисление аванса',
    'Уплата процентов'
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
