import { getIntervalBetweenDates } from '../../common/dates'

export function convertAccount (apiAccount) {
  switch (apiAccount.accType) {
    case 'widget': return null
    case 'card': return convertCard(apiAccount)
    case 'current': return convertCurrentAccount(apiAccount)
    case 'vklad': return convertDeposit(apiAccount)
    default: throw new Error(`unsupported account type ${apiAccount.accType}`)
  }
}

export function convertDeposit (apiAccount) {
  const { interval, count } = getIntervalBetweenDates(apiAccount.openDate, apiAccount.exp_date)
  return {
    id: apiAccount.account,
    type: 'deposit',
    title: apiAccount.name,
    instrument: 'RUB',
    balance: apiAccount.sum,
    percent: 1,
    capitalization: false,
    startBalance: apiAccount.sum,
    startDate: new Date(apiAccount.openDate),
    endDateOffset: count,
    endDateOffsetInterval: interval,
    payoffStep: 0,
    payoffInterval: null,
    syncID: [apiAccount.account]
  }
}

export function convertCurrentAccount (apiAccount) {
  return {
    id: apiAccount.account,
    type: 'checking',
    title: apiAccount.name,
    instrument: 'RUB',
    balance: apiAccount.sum,
    savings: apiAccount.isNaka === 1,
    syncID: [apiAccount.account]
  }
}

export function convertCard (apiAccount) {
  let title = apiAccount.cardName
  if (title.toLowerCase().indexOf('халва') >= 0) {
    title = 'Халва'
  }
  return {
    id: apiAccount.account,
    type: 'ccard',
    title,
    instrument: 'RUB',
    balance: apiAccount.sum - apiAccount.creditLimit,
    creditLimit: apiAccount.creditLimit,
    syncID: [
      apiAccount.cardBin + '******' + apiAccount.cardEnd,
      apiAccount.account
    ]
  }
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.desc_sh === 'Увеличение лимита') {
    return null
  }
  const transaction = {
    date: parseDate(apiTransaction.sortDate),
    hold: Boolean(apiTransaction.hold),
    income: apiTransaction.credit,
    incomeAccount: account.id,
    outcome: apiTransaction.debit,
    outcomeAccount: account.id
  }
  if (!transaction.hold) {
    transaction.id = apiTransaction.id
  }
  [
    parseCashWithdrawal,
    parsePayee,
    parseMcc
  ].some(parser => parser(apiTransaction, transaction))
  return transaction
}

function parseDate (date) {
  const match = date.match(/(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})/)
  if (!match) {
    throw new Error(`unexpected transaction date ${date}`)
  }
  return new Date(match[1] + 'T' + match[2] + '+03:00')
}

function parsePayee (apiTransaction, transaction) {
  const { payee } = parseDescription(apiTransaction.desc)
  if (payee) {
    transaction.payee = payee
  }
}

function parseMcc (apiTransaction, transaction) {
  if (apiTransaction.mcc && !isNaN(parseInt(apiTransaction.mcc))) {
    transaction.mcc = parseInt(apiTransaction.mcc)
  }
}

function parseCashWithdrawal (apiTransaction, transaction) {
  if (apiTransaction.desc && apiTransaction.desc.indexOf('Выдача AVG_ATM') >= 0 && apiTransaction.debit > 0) {
    transaction.income = transaction.outcome
    transaction.incomeAccount = 'cash#RUB'
    return true
  }
  return false
}

export function parseDescription (description) {
  if (!description || description.indexOf('Платеж. Авторизация №') >= 0) {
    return {}
  }
  description = description.replace(/^Покупка (MD00)?/, '').replace(/SAINT PETER[^\s]*/, 'SANKT-PETERBURG')
  const parts = description.split(' ').filter(part => part)
  if (parts.length > 2 && parts[parts.length - 1] === 'RUS') {
    if (parts[parts.length - 2] === 'G') {
      description = parts.slice(0, parts.length - 3).join(' ')
    } else {
      description = parts.slice(0, parts.length - 2).join(' ')
    }
  }
  return { payee: description }
}
