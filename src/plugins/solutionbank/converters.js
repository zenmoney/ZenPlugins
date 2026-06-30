import { MD5 } from 'jshashes'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
const BANK_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000
const MERCHANT_ID_PREFIX_LENGTH = 25
const SAFE_MERCHANT_PREFIX_MIN_LENGTH = 16
const CANONICAL_TRANSACTION_ID_SOURCE_FIELD = 'transactionIdSource'
const GENERIC_ACCOUNT_INCOME_NAME = 'ЗАЧИСЛЕНИЕ НА СЧЕТ'
const CAPITALIZATION_OPERATION_NAME_PREFIX = 'КАПИТАЛИЗАЦИЯ '
const md5 = new MD5()

export function convertAccount (json) {
  const card = json.cards[0]
  const cardLast4 = card.cardNumberMasked.slice(-4)
  const retailCardId = card.retailCardId ? String(card.retailCardId) : null
  const account = {
    id: retailCardId ? `${json.cardAccountNumber}-${retailCardId}` : card.cardHash,
    type: 'card',
    instrument: codeToCurrencyLookup[card.currency || json.currency],
    instrumentCode: card.currency || json.currency,
    balance: parseAmount(json.balance),
    syncID: [retailCardId, cardLast4].filter(Boolean),
    productType: json.productName,
    cardHash: card.cardHash,
    cardLast4,
    internalAccountId: json.internalAccountId,
    cardAccountNumber: json.cardAccountNumber,
    bankCode: json.bankCode,
    accountType: json.accountType,
    rkcCode: json.rkcCode
  }

  if (!account.title) {
    account.title = json.productName + '*' + cardLast4
  }

  return account
}

function parseAmount (value) {
  if (typeof value === 'number') {
    return value
  }
  if (value === undefined || value === null || value === '') {
    return 0
  }
  const parsedValue = Number.parseFloat(String(value).replace(',', '.').replace(/\s/g, ''))
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function convertTransaction (json) {
  const sum = json.operationAmount || json.transactionAmount || json.sum
  if (!sum) {
    return null
  }
  const transaction = {
    hold: json.hold || false,
    date: json.transactionDate || json.date,
    movements: [
      {
        id: getTransactionId(json),
        account: { id: json.account_id },
        invoice: null,
        sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: getComment(json)
  };
  [
    parsePayee
  ].some(parser => parser(transaction, json))

  return transaction
}

function getTransactionId (json) {
  const source = getTransactionIdSource(json)
  console.log('SolutionBank transaction id source', source)
  return md5.hex(source)
}

function getTransactionIdSource (json) {
  if (json[CANONICAL_TRANSACTION_ID_SOURCE_FIELD]) {
    return json[CANONICAL_TRANSACTION_ID_SOURCE_FIELD]
  }
  return [
    getTransactionIdentitySource(json),
    getDuplicateIndex(json)
  ].map(getIdValue).join('|')
}

function getTransactionIdentity (json) {
  return md5.hex(getTransactionIdentitySource(json))
}

function getTransactionIdentitySource (json) {
  return [
    json.account_id,
    getDateIdValue(getFirstPresent(json.transactionDate, json.date, json.operationDate)),
    getAmountIdValue(getTransactionAmountIdValue(json)),
    getTransactionCurrencyIdValue(json),
    getMerchantIdValue(json.merchant) || getFirstPresent(json.operationName, json.transactionName)
  ].map(getIdValue).join('|')
}

function getDuplicateIndex (json) {
  return json.duplicateIndex || 1
}

function getFirstPresent (...values) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

function getDateIdValue (value) {
  if (!(value instanceof Date)) {
    return value
  }
  return new Date(value.getTime() + BANK_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)
}

function getAmountIdValue (value) {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  return parseAmount(value).toFixed(2)
}

function getTransactionAmountIdValue (json) {
  const transactionAmount = getFirstPresent(json.transactionAmount)
  const operationAmount = getFirstPresent(json.operationAmount, json.sum)
  if (isZeroAmount(transactionAmount) && !isZeroAmount(operationAmount)) {
    return operationAmount
  }
  return getFirstPresent(json.transactionAmount, json.operationAmount, json.sum)
}

function getTransactionCurrencyIdValue (json) {
  const transactionAmount = getFirstPresent(json.transactionAmount)
  const operationAmount = getFirstPresent(json.operationAmount, json.sum)
  if (isZeroAmount(transactionAmount) && !isZeroAmount(operationAmount)) {
    return getFirstPresent(json.operationCurrencyCode, json.accountCurrencyCode, json.currencyCode, json.currency, json.transactionCurrencyCode)
  }
  return getFirstPresent(json.transactionCurrencyCode, json.operationCurrencyCode, json.accountCurrencyCode, json.currencyCode, json.currency)
}

function isZeroAmount (value) {
  return value !== undefined && value !== null && value !== '' && parseAmount(value) === 0
}

function getMerchantIdValue (value) {
  return normalizeMerchant(value).slice(0, MERCHANT_ID_PREFIX_LENGTH)
}

function normalizeMerchant (value) {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function getIdValue (value) {
  if (value instanceof Date) {
    return value.getTime()
  }
  return value === undefined || value === null ? '' : String(value)
}

function getComment (json) {
  const operationCurrencyCode = (json.operationCurrencyCode || json.accountCurrencyCode)
  if (json.transactionCurrencyCode !== operationCurrencyCode) {
    const transactionInfo = `Транзакция: ${json.transactionAmount} ${codeToCurrencyLookup[json.transactionCurrencyCode]}`
    return json.hold ? `Внимание, невозможно расчитать корректный курс конверсии. ${transactionInfo}` : transactionInfo
  }

  if (json.operationName && json.operationName.indexOf('Зачисление CashBack') === 0) {
    return 'Зачисление CashBack'
  }
  return null
}

function parsePayee (transaction, json) {
  if (!json.merchant) {
    return false
  }
  transaction.merchant = {
    mcc: parseMcc(json.mcc),
    location: null
  }
  const merchant = json.merchant.replace(/&quot;/g, '"').split(';').map(str => str.trim())
  if (merchant.length === 1) {
    transaction.merchant.title = merchant[0]
    transaction.merchant.city = null
    transaction.merchant.country = null
  } else if (merchant.length === 3) {
    transaction.merchant.title = merchant[0]
    transaction.merchant.city = merchant[1].trim()
    transaction.merchant.country = merchant[2].trim()
  } else if (merchant.length === 4) {
    transaction.merchant.title = merchant[0].trim() + '; ' + merchant[1].trim()
    transaction.merchant.city = merchant[2].trim()
    transaction.merchant.country = merchant[3].trim()
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + json.merchant)
  }
}

function parseMcc (mcc) {
  const parsedMcc = Number.parseInt(mcc)
  return Number.isFinite(parsedMcc) ? parsedMcc : null
}

export function getDate (str) {
  const [year, month, day, hour, minute, second] = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}

export function merge (transactions, operations) {
  const indexedOperations = assignDuplicateIndexes(operations.map(operation => ({
    ...operation,
    hold: false
  })))
  const indexedTransactions = assignDuplicateIndexes(transactions.map(transaction => ({
    ...transaction,
    hold: true
  })))
  const unmatchedTransactionIndexes = new Set(indexedTransactions.map((_, index) => index))
  const matchedOperations = indexedOperations.map(operation => {
    const matchedTransactionIndex = findMatchingTransactionIndex(operation, indexedTransactions, unmatchedTransactionIndexes)
    if (matchedTransactionIndex === null) {
      return operation
    }
    unmatchedTransactionIndexes.delete(matchedTransactionIndex)
    return {
      ...operation,
      [CANONICAL_TRANSACTION_ID_SOURCE_FIELD]: getTransactionIdSource(indexedTransactions[matchedTransactionIndex])
    }
  })
  return [
    ...matchedOperations,
    ...indexedTransactions.filter((_, index) => unmatchedTransactionIndexes.has(index))
  ]
}

function assignDuplicateIndexes (transactions) {
  const items = transactions.map((transaction, index) => ({ transaction, index }))
  const groups = new Map()
  for (const item of items) {
    const key = getTransactionIdentity(item.transaction)
    const group = groups.get(key) || []
    group.push(item)
    groups.set(key, group)
  }
  for (const group of groups.values()) {
    group.sort(compareDuplicateOrder)
    group.forEach((item, index) => {
      item.transaction.duplicateIndex = index + 1
    })
  }
  return items.map(item => item.transaction)
}

function compareDuplicateOrder (left, right) {
  return getDuplicateOrderTime(left.transaction) - getDuplicateOrderTime(right.transaction) ||
    left.index - right.index
}

function getDuplicateOrderTime (json) {
  const value = json.hold
    ? getFirstPresent(json.transactionDate, json.date, json.operationDate)
    : getFirstPresent(json.operationDate, json.transactionDate, json.date)
  return value instanceof Date ? value.getTime() : 0
}

function getTransactionMatchKey (json) {
  return `${getTransactionIdentity(json)}|${getDuplicateIndex(json)}`
}

function findMatchingTransactionIndex (operation, transactions, transactionIndexes) {
  const candidates = [...transactionIndexes].filter(index => {
    return areTransactionsCompatible(operation, transactions[index])
  })
  const exactMatch = candidates.find(index => getTransactionMatchKey(operation) === getTransactionMatchKey(transactions[index]))
  return exactMatch === undefined ? candidates[0] ?? null : exactMatch
}

function areTransactionsCompatible (left, right) {
  return getTransactionBaseKey(left) === getTransactionBaseKey(right) &&
    getDuplicateIndex(left) === getDuplicateIndex(right) &&
    areMerchantValuesCompatible(getTransactionMerchantMatchValue(left), getTransactionMerchantMatchValue(right))
}

function getTransactionBaseKey (json) {
  return [
    json.account_id,
    getDateIdValue(getFirstPresent(json.transactionDate, json.date, json.operationDate)),
    getAmountIdValue(getTransactionAmountIdValue(json)),
    getTransactionCurrencyIdValue(json)
  ].map(getIdValue).join('|')
}

function getTransactionMerchantMatchValue (json) {
  const merchant = normalizeMerchant(json.merchant)
  if (merchant) {
    return {
      value: merchant,
      type: 'merchant',
      allowPrefixMatch: true
    }
  }
  return {
    value: normalizeOperationName(getFirstPresent(json.operationName, json.transactionName)),
    type: 'operationName',
    allowPrefixMatch: false
  }
}

function areMerchantValuesCompatible (left, right) {
  if (left.value === right.value) {
    return true
  }
  if (left.type === 'operationName' && right.type === 'operationName') {
    return areOperationNamesCompatible(left.value, right.value)
  }
  if (!left.allowPrefixMatch || !right.allowPrefixMatch || !left.value || !right.value) {
    return false
  }
  const leftPrefix = left.value.slice(0, MERCHANT_ID_PREFIX_LENGTH)
  const rightPrefix = right.value.slice(0, MERCHANT_ID_PREFIX_LENGTH)
  if (leftPrefix === rightPrefix) {
    return true
  }
  return Math.min(left.value.length, right.value.length) >= SAFE_MERCHANT_PREFIX_MIN_LENGTH &&
    (left.value.startsWith(right.value) || right.value.startsWith(left.value))
}

function normalizeOperationName (value) {
  return value
    ? String(value).replace(/\s+/g, ' ').trim().toUpperCase()
    : ''
}

function areOperationNamesCompatible (left, right) {
  return (isGenericAccountIncomeName(left) && isCapitalizationOperationName(right)) ||
    (isGenericAccountIncomeName(right) && isCapitalizationOperationName(left))
}

function isGenericAccountIncomeName (value) {
  return value === GENERIC_ACCOUNT_INCOME_NAME
}

function isCapitalizationOperationName (value) {
  return value.indexOf(CAPITALIZATION_OPERATION_NAME_PREFIX) === 0
}
