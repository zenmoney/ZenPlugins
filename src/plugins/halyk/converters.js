import { toISODateString } from '../../common/dateUtils'

export function convertAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    const balance = parseDecimal(apiAccount.balance, apiAccount)
    const available = parseDecimal(apiAccount.available, apiAccount)
    const account = {
      id: apiAccount.accountNumber,
      type: apiAccount.cardNumber ? 'ccard' : 'checking',
      title: apiAccount.accountNumber,
      instrument: apiAccount.currency,
      syncIds: [
        apiAccount.accountNumber,
        apiAccount.cardNumber
      ].filter(x => x),
      balance,
      creditLimit: Math.max(0, available - balance)
    }
    const apiTransactions = apiAccount.transactions || []
    const statementDate = parseDate(apiAccount.statementDate, apiAccount)
    const existingAccount = accounts.find(acc => acc.account.id === account.id)
    if (existingAccount) {
      if (statementDate > existingAccount.statementDate) {
        existingAccount.account = account
        existingAccount.transactions = apiTransactions
      }
    } else {
      accounts.push({
        account,
        apiTransactions,
        statementDate
      })
    }
  }
  return accounts
}

function parseDate (str, debugInfo) {
  let date
  try {
    const parts = str.match(/(\d{2})\.(\d{2})\.(\d{4})/)
    date = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`)
  } catch {
    date = new Date(NaN)
  }
  console.assert(isFinite(date.getTime()), 'unexpected date', str, debugInfo)
  return date
}

function parseDecimal (str, debugInfo) {
  let num
  try {
    num = parseFloat(str.replace(/\s/g, '').replace(/,/, '.'))
  } catch {
    num = NaN
  }
  console.assert(isFinite(num), 'unexpected decimal', str, debugInfo)
  return Math.round(num * 100) / 100
}

export function convertTransaction (apiTransaction, account) {
  let fee = parseDecimal(apiTransaction.fee || '0,00', apiTransaction)
  const income = parseDecimal(apiTransaction.income || '0,00', apiTransaction)
  let expense = parseDecimal(apiTransaction.expense || '0,00', apiTransaction)
  const invoice = {
    sum: parseDecimal(apiTransaction.amount, apiTransaction),
    instrument: apiTransaction.currency
  }
  if (invoice.instrument === account.instrument && expense < invoice.sum) {
    fee = expense - invoice.sum
    expense = invoice.sum
  }
  if (fee < expense) {
    expense += fee
    fee = 0
  }
  const transaction = {
    hold: !income && !expense && !fee,
    date: parseDate(apiTransaction.date, apiTransaction),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: invoice.instrument && invoice.instrument !== account.instrument ? invoice : null,
        sum: income || expense || null,
        fee
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parsePayee,
    parseCashTransfer,
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (apiTransaction.description && [
    /ATM/,
    /Снятие\s+денег\s+через\s+банкомат/i
  ].some(regex => regex.test(apiTransaction.description))) {
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
  return false
}

function parsePayee (transaction, apiTransaction) {
  for (const regex of [
    /Операция\s+оплаты\s+у\s+коммерсанта\s+(.+)/
  ]) {
    const match = apiTransaction.description?.match(regex)
    const payee = match?.[1]?.trim()
    if (payee) {
      transaction.merchant = {
        fullTitle: payee,
        mcc: null,
        location: null
      }
      return false
    }
  }
  transaction.comment = apiTransaction.description || null
  return false
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (apiTransaction.description && [
    /Перевод\s+на\s+другую\s+карту/i,
    /Поступление\s+перевода/i
  ].some(regex => regex.test(apiTransaction.description))) {
    transaction.movements.push({
      id: null,
      account: {
        type: null,
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
  return false
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice, ref) {
  if (apiTransaction.description && [
    /Перевод\s+на\s+депозит/i,
    /Зачисление\s+с\s+депозита/i
  ].some(regex => regex.test(apiTransaction.description))) {
    transaction.groupKeys = [
      `${toISODateString(transaction.date)}_${invoice.instrument}_${Math.round(Math.abs(invoice.sum) * 100) / 100}`
    ]
    return true
  }
  return false
}
