export function convertAccount (apiAccount) {
  switch (apiAccount.accType) {
    case 'widget': return null
    case 'card': return convertCard(apiAccount)
    default: throw new Error(`unsupported account type ${apiAccount.accType}`)
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
    id: apiTransaction.id,
    date: parseDate(apiTransaction.sortDate),
    hold: Boolean(apiTransaction.hold),
    income: apiTransaction.credit,
    incomeAccount: account.id,
    outcome: apiTransaction.debit,
    outcomeAccount: account.id
  }
  if (apiTransaction.mcc && !isNaN(parseInt(apiTransaction.mcc))) {
    transaction.mcc = parseInt(apiTransaction.mcc)
  }
  [
    parsePayee
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
