import * as _ from 'lodash'
import { parseXml } from '../../common/network'

export function convertAccounts (xml, shouldHideBalance) {
  const accounts = {}
  const json = _.get(parseXml(xml), 'response.data.info.cardbalance')
  if (!json) {
    return accounts
  }
  const account = {
    type: 'ccard',
    title: json.card.acc_name,
    instrument: json.card.currency,
    syncID: []
  }
  if (shouldHideBalance) {
    account.balance = null
  } else {
    account.balance = parseFloat(json.balance)
    account.creditLimit = parseFloat(json.fin_limit)
  }
  let id = json.card.account
  if (id.length === 19) {
    id = id.substring(0, id.length - 3)
  }
  account.id = id
  account.syncID.push(id)
  accounts[id] = account
  const cardId = json.card.card_number
  if (account.syncID.indexOf(cardId) < 0) {
    account.syncID.push(cardId)
    accounts[cardId] = account
  }
  if (!account.title) {
    account.title = '*' + account.syncID[account.syncID.length - 1].slice(-4)
  }
  return accounts
}

export function convertTransactions (xml, accounts) {
  const transactions = []
  let jsonArray = _.get(parseXml(xml), 'response.data.info.statements.statement')
  if (jsonArray) {
    jsonArray = _.castArray(jsonArray)
    for (const json of jsonArray) {
      const transaction = convertTransactionJson(json)
      if (transaction) {
        checkTransactionAccount(json.card, accounts)
        transactions.push(transaction)
      }
    }
  }
  return transactions
}

export function convertTransactionJson (json) {
  const description = cleanDescription(json.description)
  if (description && /кредитного лимита/i.test(description)) {
    return null
  }
  const transaction = {}
  const opAmount = parseAmount(json.amount)
  const amount = parseAmount(json.cardamount)
  if (json.appcode) {
    if (amount.sum > 0) {
      transaction.incomeBankID = json.appcode
    } else {
      transaction.outcomeBankID = json.appcode
    }
  }
  transaction.date = new Date(json.trandate + 'T' + json.trantime)
  transaction.comment = description
  transaction.incomeAccount = json.card
  transaction.income = amount.sum > 0 ? amount.sum : 0
  transaction.outcomeAccount = json.card
  transaction.outcome = amount.sum < 0 ? -amount.sum : 0
  if (opAmount.sum !== 0 && opAmount.instrument !== amount.instrument) {
    if (amount.sum > 0) {
      transaction.opIncome = Math.abs(opAmount.sum)
      transaction.opIncomeInstrument = opAmount.instrument
    } else {
      transaction.opOutcome = Math.abs(opAmount.sum)
      transaction.opOutcomeInstrument = opAmount.instrument
    }
  }
  if (transaction.comment) {
    [
      parseHold,
      parseTransfer,
      parseCashWithdrawal,
      parseCashReplenishment,
      parseInnerTransferTo,
      parseInnerTransferFrom,
      parsePayee
    ].some(parser => parser(transaction, opAmount))
  }
  if (!transaction.comment) {
    delete transaction.comment
  }
  return transaction
}

export function checkTransactionAccount (id, accounts) {
  if (!id || !accounts || accounts[id]) {
    return
  }
  const account = accounts[Object.keys(accounts)[0]]
  account.syncID.push(id)
  accounts[id] = account
}

export function cleanDescription (description) {
  if (!description) {
    return null
  }
  return description
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&lt;/g, ' ')
    .replace(/&gt;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getTransferSyncId (id) {
  if (id.lastIndexOf('*') < Math.max(0, id.length - 5)) {
    return id.slice(-4)
  } else {
    return `${id.substring(0, 1)}*${id.slice(-2)}`
  }
}

export function getTransferId (transaction, opAmount) {
  return `${transaction.date.getTime() / 1000}_${opAmount.instrument}_${opAmount.sum}`
}

export function parseHold (transaction) {
  if (/Предавторизация/i.test(transaction.comment)) {
    transaction.hold = true
    delete transaction.incomeBankID
    delete transaction.outcomeBankID
  }
  return false
}

export function parseCashWithdrawal (transaction, opAmount) {
  if (transaction.income === 0 && /Снятие нал/i.test(transaction.comment)) {
    transaction.income = opAmount.sum
    transaction.incomeAccount = 'cash#' + opAmount.instrument
    transaction.comment = null
    return true
  }
  return false
}

export function parseCashReplenishment (transaction, opAmount) {
  if (transaction.outcome === 0 &&
    /Пополнение.*наличными/i.test(transaction.comment) &&
    /своей карты/i.test(transaction.comment)) {
    transaction.outcome = opAmount.sum
    transaction.outcomeAccount = 'cash#' + opAmount.instrument
    transaction.comment = null
    return true
  }
  return false
}

export function parseInnerTransferTo (transaction, opAmount) {
  let i = 0
  for (const regex of [
    /Перевод на свою «Копилку»\s+(\d+\*+\d+)/i,
    /Перевод на свою карту\s+(\d+\*+\d+)/i
  ]) {
    const match = transaction.comment.match(regex)
    if (match) {
      transaction.incomeAccount = 'ccard#' + opAmount.instrument + '#' + getTransferSyncId(match[1])
      transaction.income = opAmount.sum
      transaction.comment = i === 0 ? match[0] : null
      transaction._transferId = getTransferId(transaction, opAmount)
      transaction._transferType = 'income'
      return true
    }
    i++
  }
  return false
}

export function parseInnerTransferFrom (transaction, opAmount) {
  const match = transaction.comment.match(/Перевод со своей карты\s+(\d+\*+\d+)/i)
  if (match) {
    transaction.outcomeAccount = 'ccard#' + opAmount.instrument + '#' + getTransferSyncId(match[1])
    transaction.outcome = opAmount.sum
    transaction.comment = null
    transaction._transferId = getTransferId(transaction, opAmount)
    transaction._transferType = 'outcome'
    return true
  }
  return false
}

export function parseTransfer (transaction) {
  for (const regex of [
    /Пополнение наличными.*Плательщик:?\s*тел\.\s*([^.]+)/i,
    /Пополнение наличными.*Плательщик:?\s*([^.]+)/i,
    /еревод на.*Получатель:?\s*([^.]+)/i,
    /Перевод с.*Отправитель:?\s*([^.]+)/i,
    /Зачисление.*с.*Плательщик:?\s*([^.]+)/i,
    /латеж на.*Получатель:?\s*([^.]+)/i,
    /Зарплата,\s+(.+)$/i
  ]) {
    const match = transaction.comment.match(regex)
    if (match) {
      transaction.payee = match[1]
      transaction.comment = null
      return true
    }
  }
  return false
}

export function parsePayee (transaction) {
  if (transaction.comment.indexOf('Авторизация карты') >= 0 &&
    transaction.comment.indexOf('подтверждения') >= 0) {
    return false
  }
  let i = transaction.comment.indexOf(':')
  if (i < 0 || i + 1 >= transaction.comment.length) {
    return false
  }
  let payee = transaction.comment.substring(i + 1)
    .replace(/\.*\s*Код квитанции:.*$/i, '')
    .replace(/^\s*Получатель:\s*/i, '')
    .trim()
  if (!payee) {
    return false
  }
  i = payee.indexOf(',')
  if (i >= 0 && i < payee.length - 1) {
    payee = payee.substring(0, i).trim()
  }
  if (payee) {
    transaction.payee = payee
    transaction.comment = null
    return true
  }
  return false
}

export function parseAmount (text) {
  const parts = text.split(/\s/)
  const sum = parseFloat(parts[0])
  console.assert(!isNaN(sum), `failed to parse sum in ${text}`)
  return {
    sum,
    instrument: parts.length <= 1 ? 'UAH' : parts[1]
  }
}
