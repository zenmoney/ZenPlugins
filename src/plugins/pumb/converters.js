import { uniqBy } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

const REAL_MONEY_MULTIPLIER = 0.01
const KYIV_STANDARD_OFFSET_MINUTES = 2 * 60
const KYIV_DAYLIGHT_OFFSET_MINUTES = 3 * 60

function getField (value, camelCaseName, snakeCaseName) {
  return value?.[camelCaseName] ?? value?.[snakeCaseName]
}

function getFloatMoneyAmount (amount) {
  return +(Number(amount || 0) * REAL_MONEY_MULTIPLIER).toFixed(2)
}

function getLastSundayOfMonth (year, month) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  return lastDay.getUTCDate() - lastDay.getUTCDay()
}

function getKyivOffsetMinutes ({ year, month, day, hour }) {
  const localTimestamp = Date.UTC(year, month - 1, day, hour)
  // Current-era Kyiv time changes at 03:00 on the last Sunday in March and at 04:00 on the last Sunday in October.
  const daylightStart = Date.UTC(year, 2, getLastSundayOfMonth(year, 2), 3)
  const daylightEnd = Date.UTC(year, 9, getLastSundayOfMonth(year, 9), 4)
  return localTimestamp >= daylightStart && localTimestamp < daylightEnd
    ? KYIV_DAYLIGHT_OFFSET_MINUTES
    : KYIV_STANDARD_OFFSET_MINUTES
}

function parseDateInKyiv (dateParts) {
  const localTimestamp = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    dateParts.hour,
    dateParts.minute,
    dateParts.second
  )
  return new Date(localTimestamp - getKyivOffsetMinutes(dateParts) * 60000 + dateParts.millisecond)
}

function parseDateParts (value) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(value)
  const legacyMatch = /^(\d{2})\.(\d{2})\.(\d{4})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(value)
  const match = isoMatch || legacyMatch
  if (!match) {
    return null
  }
  return {
    year: Number(isoMatch ? match[1] : match[3]),
    month: Number(match[2]),
    day: Number(isoMatch ? match[3] : match[1]),
    hour: Number(match[4] || 0),
    minute: Number(match[5] || 0),
    second: Number(match[6] || 0),
    millisecond: Number((match[7] || '').slice(0, 3).padEnd(3, '0')),
    timezone: match[8] || null
  }
}

function isValidDateParts (dateParts) {
  const date = new Date(Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    dateParts.hour,
    dateParts.minute,
    dateParts.second,
    dateParts.millisecond
  ))
  return date.getUTCFullYear() === dateParts.year &&
    date.getUTCMonth() === dateParts.month - 1 &&
    date.getUTCDate() === dateParts.day &&
    date.getUTCHours() === dateParts.hour &&
    date.getUTCMinutes() === dateParts.minute &&
    date.getUTCSeconds() === dateParts.second
}

function getTimezoneOffsetMinutes (timezone) {
  if (timezone === 'Z') {
    return 0
  }
  const match = /^([+-])(\d{2}):?(\d{2})$/.exec(timezone)
  console.assert(match, `could not parse timezone offset ${timezone}`)
  const offset = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '+' ? offset : -offset
}

function parseBankDate (value) {
  if (typeof value !== 'string') {
    return null
  }
  const dateParts = parseDateParts(value)
  if (!dateParts || !isValidDateParts(dateParts)) {
    return null
  }
  if (!dateParts.timezone) {
    return parseDateInKyiv(dateParts)
  }
  return new Date(Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    dateParts.hour,
    dateParts.minute,
    dateParts.second,
    dateParts.millisecond
  ) - getTimezoneOffsetMinutes(dateParts.timezone) * 60000)
}

function getCards (apiAccount) {
  return uniqBy(Array.isArray(apiAccount.cards) ? apiAccount.cards : [], card => card.number)
}

export function convertAccount (apiAccount) {
  const cards = getCards(apiAccount)
  const creditInfo = getField(apiAccount, 'creditInfo', 'credit_info')
  const overdraftInfo = getField(apiAccount, 'overdraftInfo', 'overdraft_info')
  const currencyCode = getField(apiAccount, 'currencyCode', 'currency_code')
  const overdraftFlag = getField(apiAccount, 'overdraftFlag', 'overdraft_flag')
  const paymentDueDate = getField(creditInfo, 'paymentDueDate', 'payment_due_date')
  const dueDate = parseBankDate(paymentDueDate)
  const account = {
    id: apiAccount.id.toString(),
    type: 'ccard',
    title: cards.length > 0 ? cards[0].number.slice(-5) : `*${apiAccount.iban.slice(-4)}`,
    instrument: currencyCode,
    syncIds: [apiAccount.iban, ...cards.map(card => card.number)],
    balance: getFloatMoneyAmount(apiAccount.balance),
    ...creditInfo && {
      balance: getFloatMoneyAmount(getField(creditInfo, 'ownMoney', 'own_money')) -
        getFloatMoneyAmount(getField(creditInfo, 'useAmount', 'use_amount')),
      creditLimit: getFloatMoneyAmount(getField(creditInfo, 'totalCreditLimit', 'total_credit_limit'))
    },
    ...overdraftFlag && {
      balance: getFloatMoneyAmount(getField(overdraftInfo, 'ownMoney', 'own_money')) -
        getFloatMoneyAmount(getField(overdraftInfo, 'useAmount', 'use_amount')),
      creditLimit: getFloatMoneyAmount(overdraftInfo?.amount)
    },
    ...dueDate && {
      totalAmountDue: getFloatMoneyAmount(getField(creditInfo, 'useAmount', 'use_amount')),
      gracePeriodEndDate: dueDate
    }
  }

  return {
    product: {
      id: apiAccount.id,
      type: 'account'
    },
    account
  }
}

export function convertDeposit (apiDeposit, startDate) {
  const id = apiDeposit.id
  const maturityDate = parseBankDate(getField(apiDeposit, 'maturityDate', 'maturity_date'))
  const endDateInterval = getIntervalBetweenDates(startDate, maturityDate)
  const balance = getFloatMoneyAmount(apiDeposit.balance)
  return {
    product: {
      id,
      type: 'deposit'
    },
    account: {
      id: id.toString(),
      type: 'deposit',
      title: getField(apiDeposit, 'programName', 'program_name'),
      instrument: getField(apiDeposit, 'currencyCode', 'currency_code'),
      syncIds: [id.toString()],
      balance,
      startBalance: balance,
      capitalization: true,
      percent: getFloatMoneyAmount(getField(apiDeposit, 'interestRate', 'interest_rate')),
      startDate,
      endDateOffsetInterval: endDateInterval.interval,
      endDateOffset: endDateInterval.count > 0 ? endDateInterval.count : 1,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

export function convertLoan (apiLoan) {
  if ((apiLoan.__typename && apiLoan.__typename !== 'ActiveLoanInfo') || apiLoan.isRefunded === true) {
    return null
  }
  const id = getField(apiLoan, 'loanId', 'id')
  const startDate = parseBankDate(getField(apiLoan, 'openDate', 'open_date'))
  const endDate = parseBankDate(getField(apiLoan, 'closeDate', 'close_date'))
  const endDateInterval = getIntervalBetweenDates(startDate, endDate)
  const interestRate = getField(apiLoan, 'interestRate', 'interest_rate')
  const nextPaymentDate = getField(apiLoan, 'nextPaymentDate', 'next_payment_date')
  return {
    product: {
      id,
      type: 'loan'
    },
    account: {
      id: id.toString(),
      type: 'loan',
      startBalance: getFloatMoneyAmount(getField(apiLoan, 'agreementAmount', 'agreement_amount')),
      title: getField(apiLoan, 'productName', 'program_name'),
      instrument: getField(apiLoan, 'currencyCode', 'currency_code'),
      syncIds: [id.toString()],
      balance: -getFloatMoneyAmount(getField(apiLoan, 'totalPaymentAmount', 'total_payment_amount')),
      capitalization: true,
      startDate,
      percent: interestRate == null ? null : getFloatMoneyAmount(interestRate),
      endDateOffsetInterval: endDateInterval.interval,
      endDateOffset: endDateInterval.count,
      payoffInterval: nextPaymentDate ? 'month' : null,
      payoffStep: 1
    }
  }
}

function getTransactionAccount (apiTransaction, accountOrAccounts) {
  const accounts = Array.isArray(accountOrAccounts) ? accountOrAccounts : [accountOrAccounts]
  const apiAccountId = apiTransaction.account_id?.toString()
  const accountCurrency = apiTransaction.transaction_details?.account_amount?.currency_code
  return accounts.find(account => account.id === apiAccountId) ||
    accounts.find(account => account.instrument === accountCurrency) ||
    accounts[0]
}

function getCommission (apiTransaction) {
  const value = apiTransaction.transaction_details?.commission_amount?.value
  const amount = getFloatMoneyAmount(value)
  return amount === 0 ? 0 : -Math.abs(amount)
}

function parseComment (transaction, apiTransaction) {
  const description = typeof apiTransaction.description === 'string'
    ? apiTransaction.description.replace(/^\. \./, '').replace(/\s+/g, ' ').trim()
    : ''
  transaction.comment = description || null
  return false
}

function getTransferReference (apiTransaction) {
  const details = apiTransaction.transaction_details || {}
  const reference = details.operation_id ??
    details.operationId ??
    details.transaction_ref ??
    details.transactionRef ??
    apiTransaction.external_transaction_id ??
    apiTransaction.externalTransactionId ??
    apiTransaction.source_system_id
  return reference == null ? null : String(reference)
}

function getTransferFallbackKey (apiTransaction, invoice) {
  const transactionDate = apiTransaction.transaction_details?.transaction_date || ''
  const legacyDate = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(transactionDate)
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(transactionDate)
  const date = legacyDate
    ? `${legacyDate[3]}-${legacyDate[2]}-${legacyDate[1]}`
    : isoDate
      ? `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`
      : ''
  return `${date}_${invoice.instrument}_${Math.abs(invoice.sum)}`
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if (!/(?:Переказ між своїми|Перевод между своими)/i.test(apiTransaction.description || '')) {
    return false
  }
  transaction.comment = null
  transaction.merchant = null
  transaction.groupKeys = [
    getTransferReference(apiTransaction),
    getTransferFallbackKey(apiTransaction, invoice)
  ]
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /(?:Перевод|Переказ)/i,
    /Money Transfer/i,
    /TFR DEBIT/i,
    /ACCOUNT.*TO/i,
    /Master Card Money Send/i
  ].some(regexp => regexp.test(apiTransaction.description || ''))) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: /(?:по карте|card)/i.test(apiTransaction.description || '') ? 'ccard' : null,
      instrument: invoice.instrument,
      company: null,
      syncIds: /CARD\*(\d{4})/i.test(apiTransaction.description || '')
        ? [apiTransaction.description.match(/CARD\*(\d{4})/i)[1]]
        : null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /сервис cash to card/i,
    /Выдача наличности/i,
    /Внесення готівки/i,
    /Внесение наличных денежных/i
  ].some(regexp => regexp.test(apiTransaction.description || ''))) {
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

export function convertTransaction (apiTransaction, accountOrAccounts) {
  const amount = apiTransaction.transaction_amount
  const accountAmount = apiTransaction.transaction_details?.account_amount || amount
  if (amount?.value == null || (amount.value === 0 && accountAmount?.value === 0)) {
    return null
  }
  const account = getTransactionAccount(apiTransaction, accountOrAccounts)
  if (!account) {
    return null
  }
  const invoice = {
    sum: getFloatMoneyAmount(amount.value),
    instrument: amount.currency_code
  }
  const transaction = {
    hold: String(apiTransaction.transaction_type).toLowerCase() === 'holds',
    date: parseTransactionDate(apiTransaction),
    movements: [{
      id: apiTransaction.source_system_id == null ? null : String(apiTransaction.source_system_id),
      account: { id: account.id },
      invoice: invoice.instrument === account.instrument ? null : invoice,
      sum: getFloatMoneyAmount(accountAmount.value),
      fee: getCommission(apiTransaction)
    }],
    merchant: null,
    comment: null
  }

  parseComment(transaction, apiTransaction)
  ;[
    parseInnerTransfer,
    parseCashTransfer,
    parseOuterTransfer
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

export function parseTransactionDate (apiTransaction) {
  return parseBankDate(getField(apiTransaction, 'orderDate', 'order_date')) ||
    parseBankDate(getField(apiTransaction.transaction_details, 'transactionDate', 'transaction_date'))
}
