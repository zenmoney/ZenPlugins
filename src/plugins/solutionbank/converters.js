import { MD5 } from 'jshashes'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
const BANK_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000
const MERCHANT_ID_PREFIX_LENGTH = 25
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
  const id = getTransactionId(json)
  const transaction = {
    hold: json.hold || false,
    date: json.transactionDate || json.date,
    movements: [
      {
        id,
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
  return md5.hex(getTransactionIdSource(json))
}

function getTransactionIdSource (json) {
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
    getAmountIdValue(getFirstPresent(json.transactionAmount, json.operationAmount, json.sum)),
    getFirstPresent(json.transactionCurrencyCode, json.operationCurrencyCode, json.accountCurrencyCode, json.currencyCode, json.currency),
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

function getMerchantIdValue (value) {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, MERCHANT_ID_PREFIX_LENGTH)
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
  const operationKeys = new Set(indexedOperations.map(getTransactionMatchKey))
  return [
    ...indexedOperations,
    ...indexedTransactions.filter(transaction => !operationKeys.has(getTransactionMatchKey(transaction)))
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
