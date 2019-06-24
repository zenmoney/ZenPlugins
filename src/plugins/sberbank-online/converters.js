import * as _ from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { parseOuterAccountData } from '../../common/accounts'

export const GRAMS_IN_OZ = 31.1034768

export function convertTransaction (apiTransaction, account, accountsById) {
  const invoice = apiTransaction.operationAmount && apiTransaction.operationAmount.amount && {
    sum: parseDecimal(apiTransaction.operationAmount.amount),
    instrument: parseInstrument(apiTransaction.operationAmount.currency.code)
  }
  if (!invoice || !invoice.sum) {
    return null
  }
  if (parseMetalInstrument(apiTransaction.operationAmount.currency.code)) {
    invoice.sum /= GRAMS_IN_OZ
  }
  const feeStr = _.get(apiTransaction, 'details.paymentDetails.commission.amount')
  const fee = feeStr ? -parseDecimal(feeStr) : 0
  const transaction = {
    movements: [
      {
        id: apiTransaction.id === '0' ? null : apiTransaction.id,
        account: { id: account.id },
        invoice,
        sum: null,
        fee
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
    fee: 0
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
    fee: 0
  })
  return true
}

function parseInnerTransfer (transaction, apiTransaction, account, accountsById) {
  if ([
    'InternalPayment',
    'AccountOpeningClaim',
    'AccountClosingPayment',
    'IMAOpeningClaim',
    'IMAPayment',
    'ExtCardTransferOut'
  ].indexOf(apiTransaction.form) < 0) {
    return false
  }

  const outcomeAccountData = getAccountDataFromResource(_.get(apiTransaction, 'details.fromResource'))
  if (!outcomeAccountData) {
    return false
  }

  const outcomeAccount =
    accountsById[outcomeAccountData.id] ||
    accountsById[getId(outcomeAccountData.instrument, outcomeAccountData.syncId)] ||
    {
      type: null,
      instrument: outcomeAccountData.instrument,
      syncIds: outcomeAccountData.syncId ? [outcomeAccountData.syncId.slice(-4)] : null,
      company: outcomeAccountData.id ? { id: '4624' } : null
    }

  const incomeAccountData = getAccountDataFromResource(_.get(apiTransaction, 'details.toResource'))
  let incomeAccount = !incomeAccountData
    ? null
    : accountsById[incomeAccountData.id] || accountsById[getId(incomeAccountData.instrument, incomeAccountData.syncId)]
  if (!incomeAccount) {
    const match = apiTransaction.to.match(/\s{10}(\d[\d*\s]+)$/)
    if (match) {
      incomeAccount = accountsById[getId(transaction.movements[0].invoice.instrument, removeWhitespaces(match[1]))]
    }
  }
  if (!incomeAccount) {
    return false
  }

  const outcomeStr =
    _.get(apiTransaction, 'details.sellAmount.moneyType.value') ||
    _.get(apiTransaction, 'details.chargeOffAmount.moneyType.value')
  let outcome = outcomeStr ? parseDecimal(outcomeStr) : Math.abs(transaction.movements[0].invoice.sum)
  if (outcomeAccountData.isMetal) {
    outcome /= GRAMS_IN_OZ
  }
  const incomeStr =
    _.get(apiTransaction, 'details.buyAmount.moneyType.value') ||
    _.get(apiTransaction, 'details.destinationAmount.moneyType.value')
  let income = incomeStr ? parseDecimal(incomeStr) : Math.abs(transaction.movements[0].invoice.sum)
  if (incomeAccountData && incomeAccountData.isMetal) {
    income /= GRAMS_IN_OZ
  }

  const isIncomeInvoice = ['AccountClosingPayment', 'IMAPayment'].indexOf(apiTransaction.form) >= 0
  transaction.movements = [
    {
      id: apiTransaction.id,
      account: outcomeAccount.id ? { id: outcomeAccount.id } : outcomeAccount,
      invoice: !isIncomeInvoice && outcomeAccount.instrument !== incomeAccount.instrument ? { sum: -income, instrument: incomeAccount.instrument } : null,
      sum: -outcome,
      fee: 0
    },
    {
      id: apiTransaction.id,
      account: { id: incomeAccount.id },
      invoice: isIncomeInvoice && outcomeAccount.instrument !== incomeAccount.instrument ? { sum: outcome, instrument: outcomeAccount.instrument } : null,
      sum: income,
      fee: 0
    }
  ]

  return true
}

function getAccountDataFromResource (resource) {
  const id = _.get(resource, 'resourceType.availableValues.valueItem.value')
  if (!id) {
    return null
  }
  const instrumentStr = _.get(resource, 'resourceType.availableValues.valueItem.currency')
  const instrument = parseInstrument(instrumentStr)
  let syncId = _.get(resource, 'resourceType.availableValues.valueItem.displayedValue')
  if (syncId) {
    const i = syncId.search(/[^\d\s*]/)
    syncId = i >= 0 ? syncId.substring(0, i).replace(/[^\d*]/g, '') : ''
  }
  syncId = syncId || null
  return { id, instrument, syncId, isMetal: Boolean(parseMetalInstrument(instrumentStr)) }
}

function parseOuterIncomeTransfer (transaction, apiTransaction, account) {
  if (apiTransaction.form !== 'ExtCardTransferIn') {
    return false
  }
  const match = apiTransaction.from && apiTransaction.from.match(/(\d\d\s*\d\d)$/)
  if (!match) {
    return false
  }
  const invoice = transaction.movements[0].invoice || { sum: transaction.movements[0].sum, instrument: account.instrument }
  const outerAccount = apiTransaction.to === 'Сбербанк Онлайн' ? null : parseOuterAccountData(apiTransaction.to)
  transaction.movements.push({
    id: null,
    account: {
      type: /^\d{4}\s?\d{2}\*{2}\s?\*{4}\s?\d{4}$/.test(apiTransaction.from) ? 'ccard' : outerAccount ? outerAccount.type : null,
      instrument: invoice.instrument,
      company: outerAccount ? outerAccount.company : null,
      syncIds: [removeWhitespaces(match[1])]
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  if (!outerAccount && apiTransaction.to !== 'Сбербанк Онлайн') {
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.to,
      mcc: null,
      location: null
    }
  }
  return true
}

function parseOutcomeTransfer (transaction, apiTransaction, account) {
  if (['UfsInsurancePolicy'].indexOf(apiTransaction.form) >= 0) {
    return false
  }
  const isP2PTransfer = apiTransaction.form === 'P2PExternalBankTransfer'
  let details = apiTransaction.details
  if (details && isP2PTransfer && details.field) {
    const fields = Array.isArray(details.field) ? details.field : [details.field]
    const fieldsMapping = {
      'receiverCardNumber': 'receiverAccount',
      'bankID': 'paymentDetails'
    }
    details = _.omit(details, 'field')
    for (const field of fields) {
      console.assert(field.name, 'unexpected details.fields', apiTransaction)
      const key = fieldsMapping[field.name] || field.name
      let value = field
      if (field.name === 'bankID') {
        if (value.listType && value.listType.availableValues) {
          if (Array.isArray(value.listType.availableValues)) {
            value = value.listType.availableValues[0]
          } else {
            value = value.listType.availableValues
          }
          if (value && value.valueItem && value.valueItem.title) {
            value = { stringType: { value: value.valueItem.title } }
          } else {
            value = null
          }
        }
      }
      details[key] = value
    }
  }
  const outerAccountStr = _.get(details, 'paymentDetails.stringType.value') || apiTransaction.to
  const outerAccount = parseOuterAccountData(outerAccountStr)
  if (['RurPayment', 'P2PExternalBankTransfer'].indexOf(apiTransaction.form) < 0 && !outerAccount) {
    return false
  }
  const receiver = _.get(details, 'receiverAccount.stringType.value') || apiTransaction.to
  const match = receiver && receiver.match(/(\d{2}\s?\d{2})$/)
  if (!match && !outerAccount) {
    return false
  }
  const feeStr = _.get(details, 'commission.amount')
  const fee = feeStr && parseDecimal(feeStr)
  if (fee) {
    transaction.movements[0].fee = -Math.abs(fee)
  }
  const invoice = transaction.movements[0].invoice || { sum: transaction.movements[0].sum, instrument: account.instrument }
  transaction.movements.push({
    id: null,
    account: {
      type: isP2PTransfer ? 'ccard' : outerAccount ? outerAccount.type : null,
      instrument: invoice.instrument,
      company: apiTransaction.description === 'Перевод клиенту Сбербанка' ? { id: '4624' } : outerAccount ? outerAccount.company : null,
      syncIds: match ? [match[1].replace(/\s+/, '')] : null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  const receiverName = (!outerAccount || isP2PTransfer) && _.get(details, 'receiverName.stringType.value')
  if (receiverName) {
    transaction.merchant = {
      title: receiverName,
      city: null,
      country: null,
      mcc: null,
      location: null
    }
  }
  const smsMessage = _.get(details, 'smsMessage.stringType.value')
  if (smsMessage) {
    transaction.comment = smsMessage
  }
  return true
}

function parsePayee (transaction, apiTransaction) {
  if (apiTransaction.to && [
    'Автоплатеж',
    'Sberbank platezh',
    'Зачисление зарплаты'
  ].indexOf(apiTransaction.to) >= 0) {
    transaction.comment = apiTransaction.to
    return
  }

  let payee = ['ExtDepositCapitalization', 'ExtDepositTransferIn', 'ExtDepositOtherCredit'].indexOf(apiTransaction.form) >= 0 ? null : apiTransaction.to
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
        transaction.merchant.city = parts[parts.length - 2].length >= 2 ? parts[parts.length - 2] : null
      }
    }
  }
  if ([
    'Капитализация по вкладу/счету',
    'Комиссии',
    'Входящий перевод на вклад/счет'
  ].indexOf(apiTransaction.description) >= 0) {
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
        fee: 0
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
  for (const type of ['account', 'loan', 'card', 'target', 'ima']) {
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
  if (type === 'ima') {
    type = 'im-account'
  }
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
        case 'ima':
          data = convertMetalAccount(apiAccount.account)
          break
        default:
          data = apiAccount.account.rate && apiAccount.details && apiAccount.details.detail.period && parseDecimal(apiAccount.account.rate) > 2
            ? convertDeposit(apiAccount.account, apiAccount.details)
            : convertAccount(apiAccount.account)
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

export function convertMetalAccount (apiAccount) {
  return {
    products: [
      {
        id: apiAccount.id,
        type: 'ima',
        instrument: parseInstrument(apiAccount.balance.currency.code)
      }
    ],
    zenAccount: {
      id: 'ima:' + apiAccount.id,
      type: 'checking',
      title: apiAccount.name,
      instrument: parseInstrument(apiAccount.balance.currency.code),
      syncID: [apiAccount.number],
      balance: parseDecimal(apiAccount.balance.amount) / GRAMS_IN_OZ
    }
  }
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
        instrument: parseInstrument(apiTarget.account.value.currency.code)
      }
    ],
    zenAccount: {
      id: 'account:' + apiTarget.account.id,
      type: 'checking',
      title: apiTarget.comment || apiTarget.name,
      instrument: parseInstrument(apiTarget.account.value.currency.code),
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
    const accountId = apiCard.account.cardAccount
    const id = apiCard.account.mainCardId || apiCard.account.id
    const data = dataById[id] || dataById[accountId] ||
      { accountNumber: apiCard.account.cardAccount, account: null, products: [] }
    dataById[id] = data
    if (accountId) {
      dataById[accountId] = data
    }
    if (apiCard.account.state !== 'active' ||
      ['+-КАРТОЧКА ОТКРЫТА', 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО', 'X-ПЕРЕВЫП., НЕ ВЫДАНА'].indexOf(apiCard.account.statusWay4) < 0 ||
      parseExpireDate(apiCard.account.expireDate) < minExpireDate) {
      continue
    }

    const availableLimit = apiCard.account.availableLimit
    const instrument = availableLimit ? parseInstrument(availableLimit.currency.code) : 'RUB'
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
        instrument: parseInstrument(apiAccount.balance.currency.code)
      }
    ],
    zenAccount: {
      id: 'account:' + apiAccount.id,
      type: 'checking',
      title: apiAccount.name,
      instrument: parseInstrument(apiAccount.balance.currency.code),
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
    instrument: parseInstrument(details.extDetail.origianlAmount.currency.code),
    startDate: parseDate(details.detail.termStart),
    startBalance: parseDecimal(apiLoan.amount
      ? apiLoan.amount.amount
      : details.extDetail.origianlAmount.amount),
    balance: -parseDecimal(details.extDetail.remainAmount
      ? details.extDetail.remainAmount.amount
      : details.extDetail.origianlAmount.amount),
    capitalization: details.detail.repaymentMethod === 'аннуитетный',
    percent: (details.extDetail.rate && parseDecimal(details.extDetail.rate)) || 1,
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
        instrument: parseInstrument(details.extDetail.origianlAmount.currency.code)
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
    instrument: parseInstrument(apiDeposit.balance.currency.code),
    startDate: parseDate(details.detail.open),
    startBalance: 0,
    balance: parseDecimal(apiDeposit.balance.amount),
    capitalization: true,
    percent: parseDecimal(apiDeposit.rate) || 1,
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
        instrument: parseInstrument(apiDeposit.balance.currency.code)
      }
    ],
    zenAccount
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

function parseInstrument (instrument) {
  return parseMetalInstrument(instrument) || instrument
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

export function parseDecimal (str) {
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

function parseDateAndDateStr (str) {
  const parts = str.substring(0, 10).split('.')
  console.assert(parts.length >= 3, `unexpected date ${str}`)
  const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`
  const date = new Date(dateStr + (str.length > 10 ? str.substring(10) + '+03:00' : ''))
  console.assert(!isNaN(date.getTime()), `unexpected date ${str}`)
  return { date, dateStr }
}

export function parseDate (str) {
  return parseDateAndDateStr(str).date
}

function parseExpireDate (str) {
  const parts = str.split('/')
  console.assert(parts.length === 2 && parts[0].length === 2 && parts[1].length === 4, `unexpected expire date ${str}`)
  return `${parts[1]}-${parts[0]}`
}

function removeWhitespaces (text) {
  return text.replace(/\s+/g, '').trim()
}

export function adjustTransactionsAndCheckBalance (apiTransactions, apiPayments) {
  if (!apiTransactions.length) {
    return { transactions: apiPayments, isBalanceAmbiguous: apiPayments.length > 0 }
  }
  const transactionDataArray = apiTransactions.map(apiTransaction => {
    return {
      ...parseDateAndDateStr(apiTransaction.date),
      amount: { sum: parseDecimal(apiTransaction.sum.amount), instrument: apiTransaction.sum.currency.code },
      apiTransaction,
      apiPayment: null
    }
  })
  const paymentDataArray = apiPayments.map(apiPayment => {
    return {
      ...parseDateAndDateStr(apiPayment.date),
      amount: { sum: parseDecimal(apiPayment.operationAmount.amount), instrument: apiPayment.operationAmount.currency.code },
      apiTransaction: null,
      apiPayment
    }
  })
  const maxDateDeltaMs = 3 * 60 * 1000
  let isBalanceAmbiguous = false
  for (const transactionData of transactionDataArray) {
    let paymentData = null
    let k = -1
    for (let j = 0; j < paymentDataArray.length; j++) {
      const pd = paymentDataArray[j]
      if (pd.dateStr > transactionData.dateStr) {
        continue
      }
      const delta = transactionData.date.getTime() - pd.date.getTime()
      const areDatesEqual = delta <= 2 * 24 * 60 * 60 * 1000
      if (pd.date >= transactionData.date) {
        k = j + 1
      } else if (delta > 2 * 24 * 60 * 60 * 1000) {
        break
      } else if (k < 0) {
        k = j
      }
      if (!pd.apiTransaction && areDatesEqual &&
        pd.amount.instrument === transactionData.amount.instrument &&
        (Math.abs(pd.amount.sum) === Math.abs(transactionData.amount.sum) ||
          Math.abs((pd.amount.sum - transactionData.amount.sum) / transactionData.amount.sum) < 0.1)) {
        if (Math.abs(delta) < maxDateDeltaMs) {
          paymentData = pd
          break
        } else if (paymentData === null) {
          paymentData = pd
        }
      }
    }
    if (paymentData) {
      paymentData.apiTransaction = transactionData.apiTransaction
    } else {
      const payment = convertApiTransactionToPayment(transactionData.apiTransaction)
      if (payment) {
        paymentData = {
          ...transactionData,
          apiPayment: payment
        }
        if (k < 0) {
          paymentDataArray.push(paymentData)
        } else {
          paymentDataArray.splice(k, 0, paymentData)
        }
      }
    }
    if (paymentData) {
      transactionData.apiPayment = paymentData.apiPayment
    }
  }
  if (!isBalanceAmbiguous) {
    let hasPayment = false
    for (let i = transactionDataArray.length - 1; i >= 0; i--) {
      const transactionData = transactionDataArray[i]
      if (transactionData.apiPayment) {
        hasPayment = true
      } else if (hasPayment) {
        isBalanceAmbiguous = true
        break
      }
    }
  }
  if (!isBalanceAmbiguous) {
    const lastTransactionDateStr = transactionDataArray[transactionDataArray.length - 1].dateStr
    let hasTransaction = false
    for (let i = 0; i < paymentDataArray.length; i++) {
      const paymentData = paymentDataArray[i]
      if (paymentData.dateStr <= lastTransactionDateStr) {
        break
      } else if (paymentData.apiTransaction) {
        if (i > 0 && !hasTransaction) {
          isBalanceAmbiguous = true
          break
        }
        hasTransaction = true
      } else {
        hasTransaction = false
      }
    }
  }
  return { transactions: paymentDataArray.map(paymentData => paymentData.apiPayment), isBalanceAmbiguous }
}

function convertApiTransactionToPayment (apiTransaction) {
  if (apiTransaction.description && apiTransaction.description.indexOf('Mobile Fee') >= 0) {
    return {
      autopayable: 'false',
      copyable: 'false',
      date: apiTransaction.date,
      description: 'Комиссии',
      form: 'TakingMeans',
      from: 'MasterCard Mass',
      id: null,
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: apiTransaction.sum,
      state: 'AUTHORIZATION',
      templatable: 'false',
      type: 'payment',
      ufsId: null
    }
  }
  console.debug('inconvertible api transaction', apiTransaction)
  return null
}
