import _ from 'lodash'
import { parseOuterAccountData } from '../../common/accounts'

export function convertAccounts (apiAccounts, now) {
  const accounts = []
  const apiLoans = []
  for (const apiAccount of _.orderBy(apiAccounts, apiAccount => apiAccount.type === 'card')) {
    let account = null
    switch (apiAccount.type) {
      case 'account':
        account = convertAccount(apiAccount)
        break
      case 'card':
        account = accounts.find(({ mainProduct }) => mainProduct.id === apiAccount.id && mainProduct.type === 'account')
        console.assert(account, 'unexpected card without account', apiAccount)
        account.account.type = 'ccard'
        account.account.syncID.push(apiAccount.info.number.replace(/\s/g, ''))
        account = null
        break
      case 'deposit':
        account = convertDeposit(apiAccount, now)
        break
      case 'credit':
        apiLoans.push(apiAccount)
        break
      default:
        console.assert(false, 'unsupported account type', apiAccount)
        break
    }
    if (account) {
      accounts.push(account)
    }
  }
  return linkCreditsToAccountsAndCards(accounts, apiLoans)
}

function linkCreditsToAccountsAndCards (accounts, apiLoans) {
  const apiLoansByAccountId = {}
  const groups = []
  const groupsByAccountId = {}
  let group = null
  for (const apiLoan of _.orderBy(apiLoans, apiLoan => apiLoan.id)) {
    const loanAccounts = accounts.filter(account => account.mainProduct.id.indexOf(apiLoan.id) === 0)
    console.assert(loanAccounts.length === 1, 'unexpected credit', apiLoan)
    const account = loanAccounts[0]
    const accountId = loanAccounts[0].mainProduct.id
    console.assert(!apiLoansByAccountId[accountId], 'there is more than one credit for account', accountId, apiLoan, apiLoansByAccountId[accountId])
    apiLoansByAccountId[accountId] = apiLoan
    if (!group || Math.abs(parseInt(apiLoan.id) - parseInt(group[group.length - 1].apiLoan.id)) !== 1) {
      group = []
      groups.push(group)
    }
    group.push({
      apiLoan,
      account
    })
    groupsByAccountId[accountId] = group
  }
  const filtered = []
  for (const account of accounts) {
    const group = groupsByAccountId[account.mainProduct.id]
    if (group && account === group[0].account) {
      const acc = {
        ...account.account,
        title: group[0].apiLoan.info.title,
        syncID: _.flatMap(group, ({ account }) => account.account.syncID)
      }
      if (acc.type === 'ccard') {
        acc.available = acc.balance
        delete acc.balance
      } else {
        if (/\d{4}$/.test(group[0].apiLoan.info.number)) {
          acc.syncID.push(group[0].apiLoan.info.number)
        } else {
          acc.syncID.push(group[0].apiLoan.id.replace(/[^\d]/g, ''))
        }
      }
      acc.syncID = _.uniq(acc.syncID)
      filtered.push({
        mainProduct: null,
        products: group.map(({ account }) => account.mainProduct),
        account: acc
      })
    } else if (!group) {
      filtered.push(account)
    }
  }
  return filtered
}

function convertAccount (apiAccount) {
  return {
    mainProduct: {
      id: apiAccount.id,
      type: apiAccount.type
    },
    products: [],
    account: {
      id: apiAccount.id,
      type: 'checking',
      title: apiAccount.info.title,
      instrument: apiAccount.info.amount.currIso,
      syncID: [apiAccount.info.number.replace(/\s/g, '')],
      balance: parseFloat(apiAccount.info.amount.amount)
    }
  }
}

function convertDeposit (apiAccount, now) {
  const result = convertAccount(apiAccount)
  result.mainProduct.type = 'deposit'
  result.account = {
    ...result.account,
    type: 'deposit',
    startBalance: 0,
    startDate: now || new Date(),
    capitalization: true,
    percent: 0,
    endDateOffsetInterval: 'month',
    endDateOffset: 1,
    payoffInterval: 'month',
    payoffStep: 1
  }
  return result
}

function parseInstrument (instrument) {
  if (instrument === 'RUR') {
    return 'RUB'
  }
  return instrument
}

export function convertTransaction (apiTransaction, account) {
  const invoice = apiTransaction.operationAmount
    ? {
        sum: apiTransaction.operationAmount.amount,
        instrument: parseInstrument(apiTransaction.operationAmount.currIso)
      }
    : {
        sum: apiTransaction.amount.amount,
        instrument: parseInstrument(apiTransaction.amount.currIso)
      }
  if (!invoice.sum ||
    Math.abs(apiTransaction.amount.amount) < 0.01 ||
    (!account.syncID.includes(apiTransaction.number.replace(/\s/g, '')) && account.type !== 'deposit')) {
    return null
  }
  let sum = apiTransaction.operationAmount ? apiTransaction.amount.amount || null : null
  if (Math.sign(invoice.sum) * Math.sign(apiTransaction.amount.amount) < 0) {
    invoice.sum = Math.sign(apiTransaction.amount.amount) * Math.abs(invoice.sum)
  }
  if (apiTransaction.title?.match(/CARD2CARD/i) && apiTransaction.description?.match(/6537/)) {
    invoice.sum = Math.abs(invoice.sum)
    sum = Math.abs(sum)
  }
  const transaction = {
    hold: apiTransaction.status === 'hold' || !apiTransaction.amount.amount,
    date: new Date(apiTransaction.date + '+03:00'),
    movements: [
      {
        id: apiTransaction.id || null,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument
          ? invoice.sum
          : sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parseCashTransfer,
    parseInnerTransfer,
    parseOuterTransfer,
    parsePayee,
    parseComment
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /ПОПОЛНЕНИЕ КАРТСЧЕТОВ ТЕРМИНАЛ/,
    /Получение денег в банкомате/i,
    /6011/,
    /6010/
  ].some(regexp => regexp.test(apiTransaction.description)) && (!apiTransaction.title || ![
    /(?:^|\s)ATM(?:$|\s)/,
    /Снятие\s+наличных/i
  ].some(regexp => regexp.test(apiTransaction.title)))) {
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

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if (!apiTransaction.id || ['ownAccountsTransfer', 'currencyExchange', 'creditTransfer', 'depositTransfer'].indexOf(apiTransaction.operationType) < 0) {
    return false
  }
  transaction.groupKeys = [
    apiTransaction.id
  ]
  if (apiTransaction.operationType === 'depositTransfer') {
    transaction.movements[0].sum = -transaction.movements[0].sum
  }
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  let isTransferToSelf = false
  if ([
    /Оплата товаров\/услуг/,
    /ЗАЧИСЛЕНИЕ СРЕДСТВ НА ТЕКУЩИЙ СЧЕТ.*ЧЕРЕЗ СИСТЕМУ ЕРИП/
  ].some(regexp => regexp.test(apiTransaction.description))) {
    isTransferToSelf = true
  }
  if (apiTransaction.title && [
    /Popolnenie kartochki/,
    /Пополнение/,
    /CARD2CARD/i
  ].some(regexp => regexp.test(apiTransaction.title))) {
    isTransferToSelf = true
    transaction.comment = apiTransaction.title || null
  }
  if (!isTransferToSelf && ['personTransferAbb'].indexOf(apiTransaction.operationType) < 0) {
    return false
  }
  const outerAccountData = parseOuterAccountData(apiTransaction.title)

  transaction.movements.push({
    id: null,
    account: {
      type: null,
      instrument: invoice.instrument,
      company: null,
      syncIds: null,
      ...outerAccountData
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  if ([
    /Оплата товаров\/услуг/
  ].some(regexp => regexp.test(apiTransaction.description))) {
    transaction.comment = apiTransaction.title
  }
  return isTransferToSelf
}

function parsePayee (transaction, apiTransaction, account, invoice) {
  for (const pattern of [
    [/(.*) Перевод между счетами\s+физических лиц через АК/, 'title'],
    [/(.*) Покупка товара \/ получение услуг (.*) \((\d{4})\)$/, 'city', 'title', 'mcc'],
    [/(.*) Покупка товара \/ получение услуг (.*)(\(\d{4}\))?/, 'city', 'title']
  ]) {
    const match = apiTransaction.description.match(pattern[0])
    if (match) {
      const merchant = {
        country: null,
        city: null,
        title: null,
        mcc: null,
        location: null
      }
      let i = 0
      for (const key of pattern.slice(1)) {
        merchant[key] = match[i + 1].trim() || null
        if (key === 'mcc') {
          merchant.mcc = Number(merchant.mcc)
        }
        if (key === 'title' && apiTransaction.title) {
          merchant.title = apiTransaction.title
        }
        i++
      }
      transaction.merchant = merchant
      return true
    }
  }
  if (!apiTransaction.title) {
    return false
  }
  let index = apiTransaction.description.lastIndexOf(' ')
  if (index < 0) {
    return false
  }
  let country = apiTransaction.description.substring(index).trim()
  let city = apiTransaction.description.substring(0, index).trim()
  let mcc
  const match = country.match(/(\((\d{4})\))/)
  if (match) {
    index = city.lastIndexOf(' ')
    if (index < 0) {
      return false
    }
    country = city.substring(index).trim()
    city = city.substring(0, index).trim()
    mcc = Number(match[2])
  }
  if (country.length !== 3 || !city) {
    return false
  }
  transaction.merchant = {
    country,
    city,
    title: apiTransaction.title,
    mcc: mcc || null,
    location: null
  }
  return true
}

function parseComment (transaction, apiTransaction) {
  transaction.comment = apiTransaction.title || apiTransaction.description || null
}
