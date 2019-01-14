/* eslint-disable no-labels */
import * as _ from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'

export function parseApiDate (str) {
  const parts = str.substring(0, 10).split('.')
  console.assert(parts.length >= 3, `unexpected date ${str}`)
  let dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`
  if (str.length > 10) {
    if (dateStr >= '2018-06-16') {
      dateStr += str.substring(10) + '+03:00'
    } else {
      dateStr += str.substring(10)
    }
  }
  const date = new Date(dateStr)
  console.assert(!isNaN(date), `unexpected date ${str}`)
  return date
}

export function parseApiDescription (description) {
  description = description ? reduceWhitespaces(description) : null
  description = description || null
  const result = { description, payee: null }
  if (!description) {
    return result
  }
  description = description
    .replace('IDT:0614 2', 'CH Payment')
    .replace('IDT:0513 1', 'CH Debit')
  for (const parser of [
    { getPosition: (p, i, n) => p * i },
    { getPosition: (p, i, n) => p === 0 ? 0 : n - i, hasDescriptionOnly: true }
  ]) {
    const parts = parseDuplicates(description, parser.getPosition)
    if (parts) {
      result.description = parts.duplicate
      if (parser.hasDescriptionOnly) {
        if (parts.rest) {
          result.description += ' ' + parts.rest
        }
      } else {
        result.payee = parts.rest
      }
      break
    }
  }
  return result
}

function parseDuplicates (str, getPosition) {
  let j = -1
  let j1
  let j2
  let duplicate

  const parts = str.split(' ')

  for (let i = 1; 2 * i <= parts.length; i++) {
    let i1 = getPosition(0, i, parts.length)
    let i2 = getPosition(1, i, parts.length)
    if (i2 < i1) {
      const k = i1
      i1 = i2
      i2 = k
    }
    if (i1 >= 0 && i1 < i && i2 >= 0 && i2 + i <= parts.length) {
      const part1 = parts.slice(i1, i).join(' ')
      const part2 = parts.slice(i2, i2 + i).join(' ')
      if (part1 === part2 && i > j) {
        j = i
        j1 = i1
        j2 = i2
        duplicate = part1
      }
    }
  }

  if (j >= 0) {
    // Ensure that the rest is continuous and doesn't have gaps
    if (j1 === 0) {
      if (j2 === j) {
        return {
          duplicate,
          rest: j2 + j < parts.length ? parts.slice(j2 + j).join(' ') : null
        }
      } else if (j2 === parts.length - j) {
        return {
          duplicate,
          rest: j1 + j < j2 ? parts.slice(j1 + j, j2).join(' ') : null
        }
      }
    } else {
      if (j2 === j1 + j && j2 + j === parts.length) {
        return {
          duplicate,
          rest: j1 > 0 ? parts.slice(0, j1).join(' ') : null
        }
      }
    }
  }

  return null
}

export function convertApiTransaction (apiTransaction, zenAccount) {
  if (!apiTransaction.sum || !apiTransaction.sum.amount) {
    return null
  }
  const origin = {
    amount: parseDecimal(apiTransaction.sum.amount),
    instrument: apiTransaction.sum.currency.code
  }
  const transaction = {
    date: parseApiDate(apiTransaction.date),
    hold: null,
    ...parseApiDescription(apiTransaction.description)
  }
  if (origin.instrument === zenAccount.instrument) {
    transaction.posted = origin
  } else {
    transaction.origin = origin
  }
  return transaction
}

export function convertPayment (apiTransaction, account) {
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
    date: parseApiDate(apiTransaction.date),
    hold: apiTransaction.state === 'AUTHORIZATION',
    merchant: null,
    comment: null
  };
  [
    parsePaymentInnerTransfer,
    parsePaymentSum,
    parsePaymentCashReplenishment,
    parsePaymentCashWithdrawal,
    parsePaymentOuterIncomeTransfer,
    parsePaymentOutcomeTransfer,
    parsePaymentPayee
  ].some(parser => parser(transaction, apiTransaction, account))
  return transaction
}

function parsePaymentSum (transaction, apiTransaction, account) {
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

function parsePaymentCashWithdrawal (transaction, apiTransaction, account) {
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

function parsePaymentCashReplenishment (transaction, apiTransaction, account) {
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

function parsePaymentInnerTransfer (transaction, apiTransaction) {
  if (apiTransaction.form !== 'InternalPayment') {
    return false
  }
  const outcomeAccountId = _.get(apiTransaction, 'details.fromResource.resourceType.availableValues.valueItem.value')
  const incomeAccountId = _.get(apiTransaction, 'details.toResource.resourceType.availableValues.valueItem.value')
  if (!incomeAccountId || !outcomeAccountId) {
    return false
  }
  const invoice = transaction.movements[0].invoice
  const sumStr = _.get(apiTransaction, 'details.sellAmount.moneyType.value')
  const sum = sumStr ? parseDecimal(sumStr) : -invoice.sum
  const incomeMovement = {
    id: apiTransaction.id,
    account: { id: incomeAccountId },
    invoice: null,
    sum: Math.abs(invoice.sum),
    fee: null
  }
  const outcomeMovement = {
    id: apiTransaction.id,
    account: { id: outcomeAccountId },
    invoice: invoice && invoice.sum !== -sum ? invoice : null,
    sum: -sum,
    fee: null
  }
  transaction.movements = [outcomeMovement, incomeMovement]
  return true
}

function parsePaymentOuterIncomeTransfer (transaction, apiTransaction, account) {
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

function parsePaymentOutcomeTransfer (transaction, apiTransaction, account) {
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

function parsePaymentPayee (transaction, apiTransaction, account) {
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

export function convertLoanTransaction (apiTransaction) {
  if (apiTransaction.state !== 'paid') {
    return null
  }
  return {
    date: parseApiDate(apiTransaction.date),
    hold: false,
    posted: {
      amount: parseDecimal(apiTransaction.totalPaymentAmount.amount),
      instrument: apiTransaction.totalPaymentAmount.currency.code
    }
  }
}

export function formatDateSql (date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join('-')
}

export function convertToZenMoneyTransaction (zenAccount, transaction) {
  if (transaction.movements) {
    return transaction
  }

  const zenMoneyTransaction = {
    date: transaction.date,
    hold: transaction.hold,
    income: transaction.posted ? transaction.posted.amount > 0 ? transaction.posted.amount : 0 : null,
    incomeAccount: zenAccount.id,
    outcome: transaction.posted ? transaction.posted.amount < 0 ? -transaction.posted.amount : 0 : null,
    outcomeAccount: zenAccount.id
  }
  if (transaction.id) {
    const origin = transaction.origin || transaction.posted
    if (origin.amount > 0) {
      zenMoneyTransaction.incomeBankID = transaction.id
    } else {
      zenMoneyTransaction.outcomeBankID = transaction.id
    }
  }
  if (transaction.origin) {
    if (transaction.origin.amount > 0) {
      zenMoneyTransaction.outcome = 0
      zenMoneyTransaction.opIncome = transaction.origin.amount
      zenMoneyTransaction.opIncomeInstrument = transaction.origin.instrument
    } else {
      zenMoneyTransaction.income = 0
      zenMoneyTransaction.opOutcome = -transaction.origin.amount
      zenMoneyTransaction.opOutcomeInstrument = transaction.origin.instrument
    }
  }
  if (transaction.location) {
    zenMoneyTransaction.latitude = parseFloat(transaction.location.latitude)
    zenMoneyTransaction.longitude = parseFloat(transaction.location.longitude)
  }
  [
    parseCashTransaction,
    parseOuterTransfer,
    parseInnerTransfer,
    parsePayee
  ].some(parser => parser(transaction, zenMoneyTransaction))
  return zenMoneyTransaction
}

export function convertAccounts (apiAccountsArray, type) {
  if (type !== 'card') {
    const accounts = []
    for (const apiAccount of apiAccountsArray) {
      let account
      switch (type) {
        case 'loan':
          account = convertLoan(apiAccount.account, apiAccount.details)
          break
        case 'target':
          account = convertTarget(apiAccount.account, apiAccount.details)
          break
        default:
          account = apiAccount.account.rate && apiAccount.details.detail.period &&
          parseDecimal(apiAccount.account.rate) > 2
            ? convertDeposit(apiAccount.account, apiAccount.details)
            : convertAccount(apiAccount.account, apiAccount.details)
          break
      }
      if (!account) {
        continue
      }
      accounts.push(account)
    }
    return accounts
  }
  return convertCards(apiAccountsArray)
}

export function toMoscowDate (date) {
  return new Date(date.getTime() + (date.getTimezoneOffset() + 180) * 60000)
}

export function convertTarget (apiTarget, details) {
  if (apiTarget.status === 'accountDisabled') {
    return null
  }
  return {
    ids: [apiTarget.account.id],
    type: 'account',
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
  apiCardsArray = _.sortBy(apiCardsArray,
    json => json.account.mainCardId || json.account.id,
    json => json.account.mainCardId ? 1 : 0)
  const accounts = []
  const mskDate = toMoscowDate(nowDate)
  const minExpireDate = mskDate.getFullYear() + '-' + toAtLeastTwoDigitsString(mskDate.getMonth() + 1)
  for (const apiCard of apiCardsArray) {
    if (apiCard.account.state !== 'active' ||
      (apiCard.account.statusWay4 !== '+-КАРТОЧКА ОТКРЫТА' &&
        apiCard.account.statusWay4 !== 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО' &&
        apiCard.account.statusWay4 !== 'X-ПЕРЕВЫП., НЕ ВЫДАНА') ||
      parseExpireDate(apiCard.account.expireDate) < minExpireDate) {
      continue
    }
    // if (apiCard.account.statusWay4 === "X-ПЕРЕВЫП., НЕ ВЫДАНА"
    //         && (parseDecimal(apiCard.account.availableLimit.amount) <= 0
    //         || (apiCard.account.type === "credit"
    //             && parseDecimal(apiCard.details.detail.creditType.limit.amount) ===
    //                parseDecimal(apiCard.account.availableLimit.amount)))) {
    //     continue;
    // }
    if (apiCard.account.mainCardId) {
      const account = accounts[accounts.length - 1]
      console.assert(account.ids[0] === apiCard.account.mainCardId, `unexpected additional card ${apiCard.account.id}`)
      account.ids.push(apiCard.account.id)
      account.zenAccount.syncID.splice(account.zenAccount.syncID.length - 2, 0,
        removeWhitespaces(apiCard.account.number))
      continue
    }
    const availableLimit = apiCard.account.availableLimit
    const zenAccount = {
      id: 'card:' + apiCard.account.id,
      type: 'ccard',
      title: apiCard.account.name,
      instrument: availableLimit ? availableLimit.currency.code : 'RUB',
      syncID: [removeWhitespaces(apiCard.account.number)],
      available: availableLimit ? parseDecimal(availableLimit.amount) : null
    }
    if (apiCard.account.type === 'credit') {
      const creditLimit = parseDecimal(apiCard.details.detail.creditType.limit.amount)
      if (creditLimit > 0) {
        zenAccount.creditLimit = creditLimit
        zenAccount.balance = parseDecimal(zenAccount.available - zenAccount.creditLimit)
        delete zenAccount.available
      }
    } else if (apiCard.account.cardAccount) {
      zenAccount.syncID.push(apiCard.account.cardAccount)
    }
    accounts.push({
      ids: [apiCard.account.id],
      type: 'card',
      zenAccount
    })
  }
  return accounts
}

export function convertAccount (apiAccount) {
  if (apiAccount.state !== 'OPENED') {
    return null
  }
  return {
    ids: [apiAccount.id],
    type: 'account',
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
    ids: [apiLoan.id],
    type: 'loan',
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
    ids: [apiDeposit.id],
    type: 'account',
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

export function parseDate (str) {
  const parts = str.substring(0, 10).split('.')
  console.assert(parts.length === 3, `unexpected date ${str}`)
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

function parseExpireDate (str) {
  const parts = str.split('/')
  console.assert(parts.length === 2 && parts[0].length === 2 && parts[1].length === 4, `unexpected expire date ${str}`)
  return `${parts[1]}-${parts[0]}`
}

function parseCashTransaction (transaction, zenMoneyTransaction) {
  if (transaction.categoryId) {
    if (transaction.categoryId !== 203 && transaction.categoryId !== 214) {
      return false
    }
  } else {
    if (!transaction.description ||
      !['ATM', 'ITT', 'Note Acceptance'].some(word => transaction.description.indexOf(word) >= 0)) {
      return false
    }
  }
  const origin = transaction.origin || transaction.posted
  if (origin) {
    if (origin.amount > 0) {
      zenMoneyTransaction.outcomeAccount = 'cash#' + origin.instrument
      zenMoneyTransaction.outcome = origin.amount
    } else {
      zenMoneyTransaction.incomeAccount = 'cash#' + origin.instrument
      zenMoneyTransaction.income = -origin.amount
    }
  }
  return true
}

function parseInnerTransfer (transaction, zenMoneyTransaction) {
  let type = 0 // 0 - card -> card, 1 - account -> card, 2 - card -> account
  if (transaction.categoryId) {
    if (transaction.categoryId === 227) { // Перевод со вклада
      type = 1
    } else if (transaction.categoryId === 228) { // Перевод на вклад
      type = 2
    } else if ([
      1475, // Перевод между своими картами
      1476 // Перевод между своими картами
    ].indexOf(transaction.categoryId) < 0) {
      return false
    }
  } else {
    if (!transaction.description) {
      return false
    }
    if ([
      'BP Acct - Card',
      'Частичная выдача'
    ].some(word => transaction.description.indexOf(word) >= 0)) {
      type = 1
    } else if ([
      'BP Card - Acct',
      'Дополнительный взнос'
    ].some(word => transaction.description.indexOf(word) >= 0)) {
      type = 2
    } else if (![
      'CH Debit',
      'CH Payment'
    ].some(word => transaction.description.indexOf(word) >= 0)) {
      return false
    }
  }
  const origin = transaction.origin || transaction.posted
  if (transaction.payee) {
    zenMoneyTransaction.comment = transaction.payee
  }
  zenMoneyTransaction._transferType = origin.amount > 0 ? 'outcome' : 'income'
  if (type === 0) {
    zenMoneyTransaction._transferId = `${Math.round(transaction.date.getTime())}_${origin.instrument}_${parseDecimal(Math.abs(origin.amount))}`
  } else {
    zenMoneyTransaction._transferId = `${formatDateSql(toMoscowDate(transaction.date))}_${type}_${origin.instrument}_${parseDecimal(Math.abs(origin.amount))}`
  }
  return true
}

function parseOuterTransfer (transaction, zenMoneyTransaction) {
  const isOuterTransfer = (transaction.categoryId &&
    [
      202, // Перевод на карту другого банка
      215, // Зачисления
      216 // Перевод с карты другого банка
    ].indexOf(transaction.categoryId) >= 0) || (transaction.description && [
    'Payment To 7000',
    'CARD2CARD',
    'Card2Card',
    'Visa Direct'
  ].some(word => transaction.description.indexOf(word) >= 0 ||
    (transaction.payee && transaction.payee.indexOf(word) >= 0)))
  if (!isOuterTransfer) {
    return false
  }
  const origin = transaction.origin || transaction.posted
  if (origin.amount > 0) {
    zenMoneyTransaction.comment = 'Зачисление'
  } else {
    zenMoneyTransaction.comment = 'Перевод с карты'
  }
  zenMoneyTransaction.hold = false
  return true
}

function parsePayee (transaction, zenMoneyTransaction) {
  if (transaction.payee) {
    if ([
      'Оплата услуг',
      'Сбербанк Онлайн',
      'AUTOPLATEZH',
      'SBOL',
      'SBERBANK ONL@IN PLATEZH RU',
      'SBERBANK ONL@IN PLATEZH'
    ].indexOf(transaction.payee) >= 0) {
      zenMoneyTransaction.comment = transaction.payee
    } else {
      zenMoneyTransaction.payee = transaction.merchant || transaction.payee
    }
  } else if (transaction.description) {
    switch (transaction.description) {
      case 'Mobile Fee 3200':
        zenMoneyTransaction.comment = 'Оплата Мобильного банка'
        break
      default:
        break
    }
  }
}

export function reduceWhitespaces (text) {
  return text.replace(/\s+/g, ' ').trim()
}

export function removeWhitespaces (text) {
  return text.replace(/\s+/g, '').trim()
}
