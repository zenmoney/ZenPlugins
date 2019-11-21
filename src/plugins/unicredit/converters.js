import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { MD5 } from 'jshashes'
const md5 = new MD5()

export function convertAccounts (apiAccounts) {
  const types = Object.keys(apiAccounts)
  const accounts = []
  for (const type of types) {
    let converter = null
    switch (type) {
      case 'account':
        converter = convertAccount
        break
      case 'card': {
        for (const apiAccount of apiAccounts[type]) {
          const account = convertCard(apiAccount)
          if (account) {
            const existing = accounts.find(acc => acc.product.id === account.product.id)
            if (existing) {
              for (const syncId of account.account.syncID) {
                if (existing.account.syncID.indexOf(syncId) < 0) {
                  existing.account.syncID.splice(existing.account.syncID.length - 1, 0, syncId)
                }
              }
            } else {
              accounts.push(account)
            }
          }
        }
        continue
      }
      case 'credit':
        converter = convertLoan
        break
      case 'deposit':
        converter = convertDeposit
        break
      default:
        throw new Error(`unsupported account type ${type}`)
    }
    for (const apiAccount of apiAccounts[type]) {
      const account = converter(apiAccount)
      if (account) {
        accounts.push(account)
      }
    }
  }
  return accounts
}

function cleanSyncId (syncId) {
  return syncId.replace(/\s+/g, '').replace(/[^\d*]/g, str => {
    const hash = md5.hex(str).replace(/[^\d*]/g, '')
    return hash.length < str.length ? hash : hash.substring(0, str.length)
  })
}

export function convertAccount (apiAccount) {
  return {
    product: { id: apiAccount.number, type: 'account' },
    account: {
      id: apiAccount.number,
      type: 'checking',
      title: apiAccount.nick || apiAccount.name,
      instrument: getInstrument(apiAccount.iso),
      syncID: [cleanSyncId(apiAccount.number)],
      balance: parseDecimal(apiAccount.rest)
    }
  }
}

export function convertCard (apiAccount) {
  const { account } = convertAccount(apiAccount)
  const creditLimit = parseDecimal(apiAccount.credlim)
  if (creditLimit > 0) {
    account.balance -= creditLimit
    account.creditLimit = creditLimit
  }
  account.id = apiAccount.account
  account.type = 'ccard'
  if (apiAccount.account.length === 20) {
    account.syncID.push(apiAccount.account)
  }
  return {
    product: { id: apiAccount.account, type: 'card' },
    account
  }
}

export function convertLoan (apiAccount) {
  const account = convertAccount(apiAccount).account
  return {
    product: null,
    account: {
      ...account,
      type: 'loan',
      balance: -account.balance,
      startBalance: parseDecimal(apiAccount.amount),
      startDate: parseDate(apiAccount.date),
      capitalization: true,
      percent: parseDecimal(apiAccount.prc),
      payoffStep: 1,
      payoffInterval: 'month',
      endDateOffset: 1,
      endDateOffsetInterval: 'month'
    }
  }
}

export function convertDeposit (apiAccount) {
  const account = convertAccount(apiAccount).account
  const startDate = parseDate(apiAccount.date)
  const { interval, count } = getIntervalBetweenDates(startDate, parseDate(apiAccount.edate))
  return {
    product: null,
    account: {
      ...account,
      id: apiAccount.ref,
      type: 'deposit',
      syncID: [cleanSyncId(apiAccount.ref)],
      startBalance: parseDecimal(apiAccount.orig),
      startDate,
      capitalization: true,
      percent: parseDecimal(apiAccount.prc),
      payoffStep: 1,
      payoffInterval: 'month',
      endDateOffset: count,
      endDateOffsetInterval: interval
    }
  }
}

function parseDate (str) {
  const match = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  console.assert(match, `unexpected date string ${str}`)
  return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
}

function parseDecimal (str) {
  const num = parseFloat(str.replace(/\s+/g, ''))
  console.assert(!isNaN(num), `unexpected number string ${str}`)
  return num
}

export function filterCardTransactions (apiTransactions, product) {
  return apiTransactions.filter(apiTransaction => apiTransaction.card && apiTransaction.card.indexOf(product.id) === 0)
}

export function convertTransaction (apiTransaction, account) {
  const invoice = { sum: parseDecimal(apiTransaction.amount), instrument: getInstrument(apiTransaction.iso) }
  if (!invoice.sum) {
    return null
  }
  const transaction = {
    hold: apiTransaction.st === 'O',
    date: parseDate(apiTransaction.date),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: invoice.instrument !== account.instrument ? invoice : null,
        sum: invoice.instrument === account.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    merchant: null,
    comment: apiTransaction.descr || null
  };
  [
    parseCashTransfer,
    parseOuterTransfer,
    parseInnerTransfer,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function getInstrument (code) {
  return code === 'RUR' ? 'RUB' : code
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (!apiTransaction.descr || ![
    'Операция с наличными в банкомате'
  ].some(str => apiTransaction.descr.indexOf(str) >= 0)) {
    return false
  }
  transaction.comment = null
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

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (apiTransaction.name && [
    'перевод  НДС не облагается'
  ].indexOf(apiTransaction.name) >= 0) {
    transaction.comment = apiTransaction.name
  } else {
    return false
  }
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

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if (apiTransaction.name && [
    'Перевод собственных средств'
  ].indexOf(apiTransaction.name) >= 0) {
    transaction.comment = apiTransaction.name
  } else if (apiTransaction.descr && [
    'Перевод'
  ].indexOf(apiTransaction.descr) >= 0) {
    transaction.comment = apiTransaction.descr
  } else {
    return false
  }
  transaction.groupKeys = [
    `${apiTransaction.date}_${invoice.instrument}_${Math.abs(invoice.sum)}`
  ]
  return true
}

function parsePayee (transaction, apiTransaction) {
  if (apiTransaction.name && [
    'Salary'
  ].some(str => apiTransaction.name.indexOf(str) >= 0)) {
    transaction.comment = apiTransaction.name
    return false
  } else if (apiTransaction.descr && [
    'Начисление процентов',
    'Погашение основного долга',
    'Погашение процентов',
    'Перевод'
  ].indexOf(apiTransaction.descr) >= 0) {
    transaction.comment = apiTransaction.descr
    return false
  } else if (!apiTransaction.name || [
    'Principal Disbursement'
  ].indexOf(apiTransaction.name) >= 0) {
    return false
  }
  const parts = apiTransaction.name.replace(/\s+/g, ' ').trim().split(',').map(x => x.trim())
  if (parts.length === 2 && parts[0] && parts[1]) {
    let mcc = apiTransaction.mcc ? parseInt(apiTransaction.mcc) : NaN
    if (isNaN(mcc)) {
      mcc = null
    }
    transaction.merchant = {
      country: null,
      city: parts[1],
      title: parts[0],
      mcc,
      location: null
    }
  } else {
    transaction.comment = apiTransaction.name
  }
  return false
}
