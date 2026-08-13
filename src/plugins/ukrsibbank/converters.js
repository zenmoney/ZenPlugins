import { parseOuterAccountData } from '../../common/accounts'
import { toISODateString } from '../../common/dateUtils'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiProducts) {
  const data = []
  data.push(...apiProducts.accounts.map(apiAccount => convertAccount(apiAccount, apiProducts.cards.filter(card => card.accountId === apiAccount.id))))
  data.push(...apiProducts.loans.map(convertLoan))
  data.push(...apiProducts.deposits.map(convertDeposit))
  return data.filter(d => d)
}

const ACCOUNT_TYPES = {
  CARD: 'CARD_ACCOUNT',
  CURRENT: 'CURRENT_ACCOUNT',
  SAVINGS: 'SAVINGS_ACCOUNT',
  REVOLVING: 'REVOLVING_ACCOUNT',
  DREAMS: 'DREAMS_ACCOUNT',
  CREDIT: 'CREDIT_ACCOUNT'
}

export function convertAccount (apiAccount, apiCards) {
  console.assert([
    ACCOUNT_TYPES.CARD,
    ACCOUNT_TYPES.CURRENT,
    ACCOUNT_TYPES.SAVINGS,
    ACCOUNT_TYPES.REVOLVING,
    ACCOUNT_TYPES.DREAMS,
    ACCOUNT_TYPES.CREDIT
  ].indexOf(apiAccount.type.name) >= 0, `unsupported account type ${apiAccount.type.name}`)
  const creditLimit = apiAccount.overdraft?.overdraftLimit?.sum || 0
  const type = apiCards && apiCards.length > 0 ? 'ccard' : 'checking'
  return {
    product: {
      id: apiAccount.id,
      category: apiAccount.category
    },
    account: {
      id: apiAccount.id,
      type,
      title: apiAccount.name || (apiCards && apiCards.length > 0 ? apiCards[0].name : type),
      instrument: apiAccount.balance.currency.name,
      balance: apiAccount.balance.sum - creditLimit,
      syncID: (apiCards ? apiCards.map(card => card.number.replace(/\s/ig, '')) : []).concat(apiAccount.number.replace(/\s/g, '')),
      ...apiAccount.type.name === ACCOUNT_TYPES.SAVINGS && { savings: true },
      ...creditLimit && { creditLimit }
    }
  }
}

export function convertLoan (apiAccount) {
  if (apiAccount.status.name === 'ARCHIVED') {
    return null
  }
  const account = {
    id: apiAccount.id,
    type: 'loan',
    title: apiAccount.name,
    instrument: apiAccount.loanAmount.currency.name,
    balance: apiAccount.paidAmount.sum - apiAccount.loanAmount.sum,
    syncID: [apiAccount.number.replace(/\s/g, '')],
    startBalance: apiAccount.loanAmount.sum,
    startDate: apiAccount.startDate,
    capitalization: true,
    percent: Math.max(0.01, apiAccount.interestRate),
    payoffStep: 1,
    payoffInterval: 'month'
  }
  const { interval, count } = getIntervalBetweenDates(apiAccount.startDate, apiAccount.endDate)
  account.endDateOffset = count
  account.endDateOffsetInterval = interval
  return {
    account,
    product: {
      id: apiAccount.id,
      category: apiAccount.category
    }
  }
}

export function convertDeposit (apiAccount) {
  if (apiAccount.status.name === 'ARCHIVE') {
    return null
  }
  const account = {
    id: apiAccount.id,
    type: 'deposit',
    title: apiAccount.name || apiAccount.alias,
    instrument: apiAccount.balance.currency.name,
    startDate: apiAccount.openDate,
    startBalance: 0,
    balance: apiAccount.balance.sum,
    percent: Math.max(0.01, apiAccount.rate),
    capitalization: true,
    payoffInterval: 'month',
    payoffStep: 1,
    syncID: [apiAccount.number.replace(/\s/g, '')]
  }
  let interval = null
  let count = null
  if (apiAccount.closeDate) {
    ({ interval, count } = getIntervalBetweenDates(apiAccount.openDate, apiAccount.closeDate))
  } else {
    interval = 'day'
  }
  if (interval === 'day') {
    account.endDateOffset = apiAccount.period || 30
    account.endDateOffsetInterval = 'day'
  } else {
    account.endDateOffset = count
    account.endDateOffsetInterval = interval
  }
  return {
    account,
    product: {
      id: apiAccount.id,
      category: apiAccount.category
    }
  }
}

export function parseDescription (description) {
  description = description && description
    .replace(/[\s:]*(Apple|Google)\s+Pay\s*[*\d]+\.?$/i, '')
    .trim()
  if (!description) {
    return { comment: null, merchant: null }
  }
  let isComment = true
  for (const regexp of [
    /^Оплата товарів\\послуг(?: - інтернет)?\s*\\\s*/,
    /^Повернення коштів за товар\\послугу\s*\\\s*/
  ]) {
    const match = description.match(regexp)
    if (match) {
      description = description.replace(regexp, '')
      isComment = false
      break
    }
  }
  if (isComment) {
    return { comment: description, merchant: null }
  }
  const parts = description.split('\\')
  if (parts.length === 4 || parts.length === 5) {
    return {
      comment: null,
      merchant: {
        country: parts[1] || null,
        city: parts[2] || null,
        title: parts.length === 5 ? parts[3] + ' ' + parts[4] : parts[3],
        mcc: null,
        location: null
      }
    }
  } else {
    return { comment: null, merchant: { fullTitle: description, mcc: null, location: null } }
  }
}

const TransactionType = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME'
}
const TransactionStatus = {
  HOLD: 'HOLD',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
}

export function convertTransaction (apiTransaction, account) {
  console.assert(apiTransaction.type && [
    TransactionType.EXPENSE,
    TransactionType.INCOME
  ].indexOf(apiTransaction.type.name) >= 0, 'unexpected transaction type', apiTransaction)

  if (apiTransaction.type.name === TransactionType.EXPENSE &&
    apiTransaction.status.name === TransactionStatus.REJECTED) {
    return null
  }

  console.assert(!!apiTransaction && !!account, 'Internal error!')

  let invoice = null
  let sum = null
  if (apiTransaction.type.name === TransactionType.EXPENSE) {
    if (apiTransaction.postAmount || apiTransaction.blockAmount) {
      invoice = {
        sum: -apiTransaction.operationAmount.sum,
        instrument: apiTransaction.operationAmount.currency.name
      }
      sum = -apiTransaction.postAmount?.sum || -apiTransaction.blockAmount?.sum
    } else {
      sum = -apiTransaction.operationAmount.sum
    }
  } else {
    sum = apiTransaction.operationAmount.sum
  }

  const transaction = {
    date: new Date(apiTransaction.operationDate),
    hold: apiTransaction.status.name !== TransactionStatus.COMPLETED,
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice,
        sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };

  [
    parseCashTransfer,
    parseInnerIncomeTransfer,
    parseInnerOutcomeTransfer,
    parseOuterIncomeTransfer,
    parseOuterOutcomeTransfer,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account))

  return transaction
}

function parsePayee (transaction, apiTransaction) {
  const { merchant, comment } = parseDescription(apiTransaction.alias)
  if (merchant && apiTransaction.category?.id) {
    merchant.category = apiTransaction.category?.id
  }
  transaction.merchant = merchant
  transaction.comment = comment
}

function parseOuterIncomeTransfer (transaction, apiTransaction, account) {
  if (apiTransaction.type.name !== TransactionType.INCOME || !apiTransaction.category || [
    '324668306', // 'Безналичное пополнение'
    '740223117' // 'Перекази на картку'
  ].indexOf(apiTransaction.category.id) < 0) {
    return false
  }
  let match = apiTransaction.alias && apiTransaction.alias.match(/^Переказ на картку від (.*)$/)
  const payee = match && match[1] ? match[1].trim() : null
  match = apiTransaction.sender && apiTransaction.sender.tool && apiTransaction.sender.tool.match(/(\d{4})$/)
  const syncId = match && match[1]
  const accountData = apiTransaction.sender && apiTransaction.sender.bankName && apiTransaction.sender.bankName.indexOf('УКРСИББАНК') >= 0
    ? { company: { id: '15395' } }
    : parseOuterAccountData(apiTransaction.sender && apiTransaction.sender.bankName) || parseOuterAccountData(apiTransaction.alias)
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      ...accountData,
      type: 'ccard',
      instrument: apiTransaction.operationAmount.currency.name,
      syncIds: syncId ? [syncId] : null
    },
    invoice: null,
    sum: -apiTransaction.operationAmount.sum,
    fee: 0
  })
  if (payee) {
    transaction.merchant = {
      country: null,
      city: null,
      title: payee,
      mcc: null,
      location: null
    }
  } else {
    transaction.comment = (apiTransaction.category && apiTransaction.category.name) || null
  }
  return true
}

function parseOuterOutcomeTransfer (transaction, apiTransaction, account) {
  if (!apiTransaction.category ||
    apiTransaction.type.name !== TransactionType.EXPENSE || [
    '25285903',
    '201326042'
  ].indexOf(apiTransaction.category.id) < 0) {
    return false
  }
  let syncId = null
  if (apiTransaction.receiver && apiTransaction.receiver.tool && apiTransaction.receiver.tool.slice(-4).match(/\d\d\d\d/)) {
    syncId = apiTransaction.receiver.tool.slice(-4)
  } else if (apiTransaction.alias) {
    for (const regexp of [
      /Переказ на картк?у [\d*]*\*(\d{4})\s?/
    ]) {
      const match = apiTransaction.alias.match(regexp)
      if (match) {
        syncId = match[1]
        break
      }
    }
  }
  const accountData = apiTransaction.receiver && apiTransaction.receiver.bankName && apiTransaction.receiver.bankName.indexOf('УКРСИББАНК') >= 0
    ? { company: { id: '15395' } }
    : parseOuterAccountData(apiTransaction.receiver && apiTransaction.receiver.bankName)
  if (apiTransaction.receiver && apiTransaction.receiver.name) {
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.receiver.name,
      mcc: null,
      location: null
    }
  }
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      ...accountData,
      type: 'ccard',
      instrument: apiTransaction.operationAmount.currency.name,
      syncIds: syncId ? [syncId] : null
    },
    invoice: null,
    sum: apiTransaction.operationAmount.sum,
    fee: 0
  })
  return true
}

function parseCashTransfer (transaction, apiTransaction) {
  if (!apiTransaction.alias || ![
    'Отримання готівки',
    'Поповнення готівко'
  ].some(str => apiTransaction.alias.indexOf(str) >= 0)) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: apiTransaction.operationAmount.currency.name,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: (apiTransaction.type.name === TransactionType.EXPENSE ? 1 : -1) * apiTransaction.operationAmount.sum,
    fee: 0
  })
  return true
}

function parseInnerIncomeTransfer (transaction, apiTransaction) {
  if (
    apiTransaction.type.name === TransactionType.INCOME &&
    apiTransaction.category && [
      '42403883',
      '25285887',
      '40311952' // 'Перевод между своими счетами'
    ].indexOf(apiTransaction.category.id) >= 0 &&
    apiTransaction.alias && [
      'Переказ на картку',
      'Переказ на власний рахунок',
      'з іншого рахунку Клієнта',
      'Перенесення залишку'
    ].some(str => apiTransaction.alias.indexOf(str) >= 0)
  ) {
    const sender = apiTransaction.sender && apiTransaction.sender.tool && apiTransaction.sender.tool.match(/(\d+)$/)
    const receiver = apiTransaction.userTool && apiTransaction.userTool.match(/(\d+)$/)
    transaction.groupKeys = []
    if (sender && receiver) {
      transaction.groupKeys.push(`${toISODateString(transaction.date)}_` +
        `${apiTransaction.operationAmount.currency.name}_` +
        `${apiTransaction.operationAmount.sum}_` +
        `${sender && sender[1]}_${receiver && receiver[1]}`)
    } else {
      transaction.groupKeys.push(null)
    }
    transaction.groupKeys.push(`${toISODateString(transaction.date)}_` +
      `${apiTransaction.operationAmount.currency.name}_` +
      `${apiTransaction.operationAmount.sum}`)
    return true
  }
  if (
    apiTransaction.type.name === TransactionType.INCOME &&
    apiTransaction.category && [
      '42403883',
      '25285887'
    ].indexOf(apiTransaction.category.id) >= 0 &&
    apiTransaction.alias && [
      'конвертації, купівлі/продажу інозем./нац. валюти',
      'іноземної валюти'
    ].some(str => apiTransaction.alias.indexOf(str) >= 0)
  ) {
    transaction.comment = apiTransaction.alias
    transaction.groupKeys = [
      toISODateString(transaction.date),
      null
    ]
    return true
  }
  return false
}

function parseInnerOutcomeTransfer (transaction, apiTransaction) {
  if (
    apiTransaction.type.name === TransactionType.EXPENSE &&
    apiTransaction.category && [
      '40311952' // 'Перевод между своими счетами'
    ].indexOf(apiTransaction.category.id) >= 0 &&
    apiTransaction.alias && [
      'Переказ на власний рахунок',
      'Переказ на картку'
    ].some(str => apiTransaction.alias.indexOf(str) >= 0)
  ) {
    const sender = apiTransaction.userTool && apiTransaction.userTool.match(/(\d+)$/)
    const receiver = apiTransaction.receiver && apiTransaction.receiver.tool && apiTransaction.receiver.tool.match(/(\d+)$/)
    transaction.groupKeys = []
    if (sender && receiver) {
      transaction.groupKeys.push(`${toISODateString(transaction.date)}_` +
        `${apiTransaction.operationAmount.currency.name}_` +
        `${apiTransaction.operationAmount.sum}_` +
        `${sender && sender[1]}_${receiver && receiver[1]}`)
    } else {
      transaction.groupKeys.push(null)
    }
    transaction.groupKeys.push(`${toISODateString(transaction.date)}_` +
      `${apiTransaction.operationAmount.currency.name}_` +
      `${apiTransaction.operationAmount.sum}`)
    return true
  }
  if (
    apiTransaction.type.name === TransactionType.EXPENSE &&
    apiTransaction.category && [
      '25285886',
      '40311952'
    ].indexOf(apiTransaction.category.id) >= 0 &&
    apiTransaction.alias && [
      'Перерахування для купівлі/продажу іноземної валюти',
      'іноземної валюти'
    ].some(str => apiTransaction.alias.indexOf(str) >= 0)
  ) {
    transaction.comment = apiTransaction.alias
    transaction.groupKeys = [
      toISODateString(transaction.date),
      null
    ]
    return true
  }
  return false
}
