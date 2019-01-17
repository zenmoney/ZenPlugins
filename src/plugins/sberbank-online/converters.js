import * as _ from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'

export function convertTransaction (apiTransaction, account, accountsById) {
  const invoice = apiTransaction.operationAmount && apiTransaction.operationAmount.amount && {
    sum: parseDecimal(apiTransaction.operationAmount.amount),
    instrument: apiTransaction.operationAmount.currency.code
  }
  if (!invoice || !invoice.sum) {
    return null
  }
  const transaction = {
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice,
        sum: null,
        fee: null
      }
    ],
    date: parseDate(apiTransaction.date),
    hold: apiTransaction.state === 'AUTHORIZATION',
    merchant: null,
    comment: null
  };
  [
    parseInnerTransfer,
    parseSum,
    parseCashReplenishment,
    parseCashWithdrawal,
    parseOuterIncomeTransfer,
    parseOutcomeTransfer,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account, accountsById))
  return transaction
}

function parseSum (transaction, apiTransaction, account) {
  const invoice = transaction.movements[0].invoice
  if (invoice.instrument === account.instrument) {
    transaction.movements[0].sum = invoice.sum
    transaction.movements[0].invoice = null
  } else {
    const sumStr = _.get(apiTransaction, 'details.amount.moneyType.value')
    if (sumStr) {
      transaction.movements[0].sum = parseDecimal(Math.abs(parseDecimal(sumStr)) * Math.sign(invoice.sum))
    }
  }
}

function parseCashWithdrawal (transaction, apiTransaction, account) {
  if (apiTransaction.form !== 'ExtCardCashOut') {
    return false
  }
  const invoice = transaction.movements[0].invoice || { sum: transaction.movements[0].sum, instrument: account.instrument }
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
    fee: null
  })
  return true
}

function parseCashReplenishment (transaction, apiTransaction, account) {
  if (apiTransaction.form !== 'ExtCardCashIn') {
    return false
  }
  const invoice = transaction.movements[0].invoice || { sum: transaction.movements[0].sum, instrument: account.instrument }
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
    fee: null
  })
  return true
}

function parseInnerTransfer (transaction, apiTransaction, account, accountsById) {
  if ([
    'InternalPayment',
    'AccountOpeningClaim',
    'AccountClosingPayment'
  ].indexOf(apiTransaction.form) < 0) {
    return false
  }

  const instrument = transaction.movements[0].invoice.instrument
  const outcomeAccount = getAccountForResource(_.get(apiTransaction, 'details.fromResource'), accountsById)
  let incomeAccount = getAccountForResource(_.get(apiTransaction, 'details.toResource'), accountsById)
  if (!incomeAccount) {
    const match = apiTransaction.to.match(/\s{10}(\d[\d*\s]+)$/)
    if (match) {
      incomeAccount = accountsById[getId(instrument, removeWhitespaces(match[1]))]
    }
  }
  if (!incomeAccount && !outcomeAccount) {
    return false
  }

  const isIncomeInvoice = apiTransaction.form === 'AccountClosingPayment'
  const invoiceSum = Math.abs(transaction.movements[0].invoice.sum)
  const sumStr =
    _.get(apiTransaction, 'details.sellAmount.moneyType.value') ||
    _.get(apiTransaction, 'details.destinationAmount.moneyType.value')
  const sum = sumStr ? parseDecimal(sumStr) : invoiceSum

  transaction.movements = []
  if (outcomeAccount) {
    transaction.movements.push({
      id: apiTransaction.id,
      account: { id: outcomeAccount.id },
      invoice: isIncomeInvoice || invoiceSum === sum ? null : { sum: -invoiceSum, instrument },
      sum: isIncomeInvoice ? -invoiceSum : -sum,
      fee: null
    })
  }
  if (incomeAccount) {
    transaction.movements.push({
      id: apiTransaction.id,
      account: { id: incomeAccount.id },
      invoice: isIncomeInvoice && invoiceSum !== sum ? { sum: invoiceSum, instrument } : null,
      sum: isIncomeInvoice ? sum : invoiceSum,
      fee: null
    })
  }
  if (apiTransaction.description && (!incomeAccount || !outcomeAccount)) {
    transaction.comment = apiTransaction.description
  }

  return true
}

function getAccountForResource (resource, accountsById) {
  const id = _.get(resource, 'resourceType.availableValues.valueItem.value')
  if (!id) {
    return null
  }
  const instrument = _.get(resource, 'resourceType.availableValues.valueItem.currency')
  let syncId = _.get(resource, 'resourceType.availableValues.valueItem.displayedValue')
  if (syncId) {
    const i = syncId.search(/[^\d\s*]/)
    syncId = i >= 0 ? syncId.substring(0, i).replace(/[^\d*]/g, '') : ''
  }
  return accountsById[id] || accountsById[getId(instrument, syncId)]
}

function parseOuterIncomeTransfer (transaction, apiTransaction, account) {
  if (apiTransaction.form !== 'ExtCardTransferIn') {
    return false
  }
  const match = apiTransaction.from && apiTransaction.from.match(/(\d{4})$/)
  if (!match) {
    return false
  }
  const invoice = transaction.movements[0].invoice || { sum: transaction.movements[0].sum, instrument: account.instrument }
  transaction.movements.push({
    id: null,
    account: {
      type: null,
      instrument: invoice.instrument,
      company: { title: apiTransaction.to },
      syncIds: [match[1]]
    },
    invoice: null,
    sum: -invoice.sum,
    fee: null
  })
  return true
}

function parseOutcomeTransfer (transaction, apiTransaction, account) {
  if (apiTransaction.form !== 'RurPayment') {
    return false
  }
  const receiver = _.get(apiTransaction, 'details.receiverAccount.stringType.value')
  const match = receiver && receiver.match(/(\d{4})$/)
  if (!match) {
    return false
  }
  const feeStr = _.get(apiTransaction, 'details.commission.amount')
  const fee = feeStr && parseDecimal(feeStr)
  if (fee) {
    transaction.movements[0].fee = -Math.abs(fee)
  }
  const invoice = transaction.movements[0].invoice || { sum: transaction.movements[0].sum, instrument: account.instrument }
  transaction.movements.push({
    id: null,
    account: {
      type: null,
      instrument: invoice.instrument,
      company: apiTransaction.description === 'Перевод клиенту Сбербанка' ? { id: '4624' } : null,
      syncIds: [match[1]]
    },
    invoice: null,
    sum: -invoice.sum,
    fee: null
  })
  const receiverName = _.get(apiTransaction, 'details.receiverName.stringType.value')
  if (receiverName) {
    transaction.merchant = {
      title: receiverName,
      city: null,
      country: null,
      mcc: null,
      location: null
    }
  }
  return true
}

function parsePayee (transaction, apiTransaction) {
  let payee = ['ExtDepositCapitalization'].indexOf(apiTransaction.form) >= 0 ? null : apiTransaction.to
  if (payee) {
    if (apiTransaction.form === 'RurPayJurSB') {
      const parts = payee.split(/\s\s+/)
      if (parts.length > 1) {
        payee = parts.slice(0, parts.length - 1).join(' ')
      }
    }
    transaction.merchant = {
      title: payee,
      city: null,
      country: null,
      mcc: null,
      location: null
    }
    const fullTitle = _.get(apiTransaction, 'details.description.stringType.value')
    if (fullTitle) {
      const parts = fullTitle.split(/\s\s+/)
      if (parts.length > 2) {
        transaction.merchant.country = parts[parts.length - 1]
        transaction.merchant.city = parts[parts.length - 2]
      }
    }
  }
  if (['Капитализация по вкладу/счету', 'Комиссии'].indexOf(apiTransaction.description) >= 0) {
    transaction.comment = apiTransaction.description
  }
}

export function convertLoanTransaction (apiTransaction, account) {
  if (apiTransaction.state !== 'paid') {
    return null
  }
  return {
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: parseDecimal(apiTransaction.totalPaymentAmount.amount),
        fee: null
      }
    ],
    date: parseDate(apiTransaction.date),
    hold: false,
    merchant: null,
    comment: null
  }
}

export function formatDateSql (date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('-')
}

export function convertAccounts (apiAccountsByType) {
  const accountData = []
  const accountsById = {}
  for (const type of ['account', 'loan', 'card', 'target']) {
    for (const data of convertAccountsWithType(apiAccountsByType[type], type)) {
      const dataForTheSameAccount = accountData.find(d => d.zenAccount.id === data.zenAccount.id)
      if (dataForTheSameAccount) {
        for (const syncId of data.zenAccount.syncID) {
          if (dataForTheSameAccount.zenAccount.syncID.indexOf(syncId) < 0) {
            dataForTheSameAccount.zenAccount.syncID.push(syncId)
          }
        }
      } else {
        accountData.push(data)
      }
    }
  }
  for (const data of accountData) {
    for (const product of data.products) {
      accountsById[getId(product.type, product.id)] = data.zenAccount
    }
    for (const syncId of data.zenAccount.syncID) {
      accountsById[getId(data.zenAccount.instrument, syncId)] = data.zenAccount
    }
  }
  return { accountData, accountsById }
}

export function getId (type, id) {
  return type + ':' + id
}

function convertAccountsWithType (apiAccountsArray, type) {
  if (type !== 'card') {
    const accountData = []
    for (const apiAccount of apiAccountsArray) {
      let data
      switch (type) {
        case 'loan':
          data = convertLoan(apiAccount.account, apiAccount.details)
          break
        case 'target':
          data = convertTarget(apiAccount.account, apiAccount.details)
          break
        default:
          data = apiAccount.account.rate && apiAccount.details.detail.period && parseDecimal(apiAccount.account.rate) > 2
            ? convertDeposit(apiAccount.account, apiAccount.details)
            : convertAccount(apiAccount.account, apiAccount.details)
          break
      }
      if (data) {
        accountData.push(data)
      }
    }
    return accountData
  }
  return convertCards(apiAccountsArray)
}

function toMoscowDate (date) {
  return new Date(date.getTime() + (date.getTimezoneOffset() + 180) * 60000)
}

export function convertTarget (apiTarget) {
  if (apiTarget.status === 'accountDisabled') {
    return null
  }
  return {
    products: [
      {
        id: apiTarget.account.id,
        type: 'account',
        instrument: apiTarget.account.value.currency.code
      }
    ],
    zenAccount: {
      id: 'account:' + apiTarget.account.id,
      type: 'checking',
      title: apiTarget.comment || apiTarget.name,
      instrument: apiTarget.account.value.currency.code,
      balance: parseDecimal(apiTarget.account.value.amount),
      savings: true,
      syncID: [
        apiTarget.id
      ]
    }
  }
}

export function convertCards (apiCardsArray, nowDate = new Date()) {
  apiCardsArray = _.sortBy(apiCardsArray.map((apiCard, index) => { return { apiCard, index } }),
    obj => obj.apiCard.account.mainCardId ? 1 : 0,
    obj => obj.index).map(obj => obj.apiCard)

  const dataById = {}
  const mskDate = toMoscowDate(nowDate)
  const minExpireDate = mskDate.getFullYear() + '-' + toAtLeastTwoDigitsString(mskDate.getMonth() + 1)

  const accountData = []

  for (const apiCard of apiCardsArray) {
    const id = apiCard.account.mainCardId || apiCard.account.id
    let data = dataById[id]
    if (!data) {
      data = { accountNumber: apiCard.account.cardAccount, account: null, products: [] }
      dataById[id] = data
    }
    if (apiCard.account.state !== 'active' ||
      ['+-КАРТОЧКА ОТКРЫТА', 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО', 'X-ПЕРЕВЫП., НЕ ВЫДАНА'].indexOf(apiCard.account.statusWay4) < 0 ||
      parseExpireDate(apiCard.account.expireDate) < minExpireDate) {
      continue
    }

    const availableLimit = apiCard.account.availableLimit
    const instrument = availableLimit ? availableLimit.currency.code : 'RUB'
    if (!data.account) {
      const available = availableLimit ? parseDecimal(availableLimit.amount) : null
      const creditLimit = apiCard.account.type === 'credit'
        ? parseDecimal(apiCard.details.detail.creditType.limit.amount)
        : null
      const account = {
        id: 'card:' + apiCard.account.id,
        type: 'ccard',
        title: apiCard.account.name,
        instrument,
        syncID: []
      }
      if (data.accountNumber) {
        account.syncID.push(data.accountNumber)
      }
      if (creditLimit && available) {
        account.creditLimit = creditLimit
        account.balance = parseDecimal(available - creditLimit)
      } else if (creditLimit) {
        account.creditLimit = creditLimit
        account.available = available
      } else {
        account.available = available
      }
      data.account = account
      accountData.push({
        products: data.products,
        zenAccount: data.account
      })
    }
    data.account.syncID.splice(data.account.syncID.length - 1, 0, removeWhitespaces(apiCard.account.number))
    data.products.push({
      id: apiCard.account.id,
      type: 'card',
      instrument
    })
  }

  return accountData
}

export function convertAccount (apiAccount) {
  if (apiAccount.state !== 'OPENED') {
    return null
  }
  return {
    products: [
      {
        id: apiAccount.id,
        type: 'account',
        instrument: apiAccount.balance.currency.code
      }
    ],
    zenAccount: {
      id: 'account:' + apiAccount.id,
      type: 'checking',
      title: apiAccount.name,
      instrument: apiAccount.balance.currency.code,
      balance: parseDecimal(apiAccount.balance.amount),
      savings: apiAccount.rate && parseDecimal(apiAccount.rate) >= 1,
      syncID: [
        apiAccount.number
      ]
    }
  }
}

export function convertLoan (apiLoan, details) {
  if (!details.extDetail || !details.extDetail.origianlAmount) {
    return null
  }
  const zenAccount = {
    id: 'loan:' + apiLoan.id,
    type: 'loan',
    title: apiLoan.name,
    instrument: details.extDetail.origianlAmount.currency.code,
    startDate: parseDate(details.detail.termStart),
    startBalance: parseDecimal(apiLoan.amount
      ? apiLoan.amount.amount
      : details.extDetail.origianlAmount.amount),
    balance: -parseDecimal(details.extDetail.remainAmount
      ? details.extDetail.remainAmount.amount
      : details.extDetail.origianlAmount.amount),
    capitalization: details.detail.repaymentMethod === 'аннуитетный',
    percent: details.extDetail.rate
      ? parseDecimal(details.extDetail.rate)
      : 1,
    syncID: [
      details.detail.accountNumber
    ],
    payoffStep: 1,
    payoffInterval: 'month'
  }
  if (details.detail.termDuration) {
    parseDuration(details.detail.termDuration, zenAccount)
  } else {
    const { interval, count } = getIntervalBetweenDates(
      parseDate(details.detail.termStart),
      parseDate(details.detail.termEnd), ['year', 'month'])
    zenAccount.endDateOffset = count
    zenAccount.endDateOffsetInterval = interval
  }
  return {
    products: [
      {
        id: apiLoan.id,
        type: 'loan',
        instrument: details.extDetail.origianlAmount.currency.code
      }
    ],
    zenAccount
  }
}

export function convertDeposit (apiDeposit, details) {
  const zenAccount = {
    id: 'account:' + apiDeposit.id,
    type: 'deposit',
    title: apiDeposit.name,
    instrument: apiDeposit.balance.currency.code,
    startDate: parseDate(details.detail.open),
    startBalance: 0,
    balance: parseDecimal(apiDeposit.balance.amount),
    capitalization: true,
    percent: parseDecimal(apiDeposit.rate),
    syncID: [
      apiDeposit.number
    ],
    payoffStep: 1,
    payoffInterval: 'month'
  }
  parseDuration(details.detail.period, zenAccount)
  return {
    products: [
      {
        id: apiDeposit.id,
        type: 'account',
        instrument: apiDeposit.balance.currency.code
      }
    ],
    zenAccount
  }
}

function parseDuration (duration, account) {
  const parts = duration.split('-').map(parseDecimal)
  console.assert(parts.length === 3, `unexpected duration of account ${account.id}`)
  if (parts[1] === 0 && parts[2] === 0) {
    account.endDateOffsetInterval = 'year'
    account.endDateOffset = parts[0]
  } else if (parts[2] === 0) {
    account.endDateOffsetInterval = 'month'
    account.endDateOffset = parts[0] * 12 + parts[1]
  } else {
    account.endDateOffsetInterval = 'day'
    account.endDateOffset = parts[0] * 365 + parts[1] * 30 + parts[2]
  }
}

function parseDecimal (str) {
  if (typeof str === 'number') {
    return Math.round(str * 100) / 100
  }
  console.assert(typeof str === 'string', `could not parse decimal ${str}`)
  const number = Number(str.replace(/\s/g, '')
    .replace(/,/g, '.')
    .replace('−', '-')
    .replace('&minus;', '-'))
  console.assert(!isNaN(number), `could not parse decimal ${str}`)
  return number
}

export function parseDate (str) {
  const parts = str.substring(0, 10).split('.')
  console.assert(parts.length >= 3, `unexpected date ${str}`)
  const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}` + (str.length > 10 ? str.substring(10) + '+03:00' : '')
  const date = new Date(dateStr)
  console.assert(!isNaN(date), `unexpected date ${str}`)
  return date
}

function parseExpireDate (str) {
  const parts = str.split('/')
  console.assert(parts.length === 2 && parts[0].length === 2 && parts[1].length === 4, `unexpected expire date ${str}`)
  return `${parts[1]}-${parts[0]}`
}

function removeWhitespaces (text) {
  return text.replace(/\s+/g, '').trim()
}
