export function convertAccounts (apiAccounts) {
  const types = Object.keys(apiAccounts)
  const accounts = []
  for (const type of types) {
    let converter = null
    switch (type) {
      case 'account':
        converter = convertAccount
        break
      case 'card':
        converter = convertCard
        break
      case 'credit':
        converter = convertLoan
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

export function convertAccount (apiAccount) {
  return {
    product: { id: apiAccount.number },
    account: {
      id: apiAccount.number,
      type: 'checking',
      title: apiAccount.nick || apiAccount.name,
      instrument: getInstrument(apiAccount.iso),
      syncID: [apiAccount.number],
      balance: parseDecimal(apiAccount.rest)
    }
  }
}

export function convertCard (apiAccount) {
  const { account, product } = convertAccount(apiAccount)
  const creditLimit = parseDecimal(apiAccount.credlim)
  if (creditLimit > 0) {
    account.balance -= creditLimit
    account.creditLimit = creditLimit
  }
  product.id = apiAccount.account
  account.id = apiAccount.account
  account.type = 'ccard'
  if (apiAccount.account.length === 20) {
    account.syncID.push(apiAccount.account)
  }
  return {
    product,
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

export function convertTransaction (apiTransaction, account) {
  const invoice = { sum: parseDecimal(apiTransaction.amount), instrument: getInstrument(apiTransaction.iso) }
  return {
    hold: false,
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
  }
}

function getInstrument (code) {
  return code === 'RUR' ? 'RUB' : code
}
