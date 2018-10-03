import currencies from '../belswissbank/codeToCurrencyLookup'

export function convertAccount (apiAccount) {
  return {
    id: apiAccount.account,
    type: 'checking',
    title: `Яндекс.Деньги (${currencies[apiAccount.currency]})`,
    instrument: currencies[apiAccount.currency],
    balance: apiAccount.balance,
    syncID: [apiAccount.account.slice(-4)]
  }
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.status !== 'success') {
    return null
  }
  const transaction = {
    id: apiTransaction.operation_id,
    date: new Date(apiTransaction.datetime),
    income: apiTransaction.direction === 'in' ? apiTransaction.amount : 0,
    incomeAccount: account.id,
    outcome: apiTransaction.direction === 'out' ? apiTransaction.amount : 0,
    outcomeAccount: account.id
  };
  [
    parseMcc,
    parseYandexMoneyTransfer,
    parsePayee
  ].some(parser => parser(apiTransaction, transaction))
  return transaction
}

function parseYandexMoneyTransfer (apiTransaction, transaction) {
  if (!apiTransaction.title) {
    return false
  }
  for (const pattern of [
    /Перевод на счет (\d+)/i,
    /Перевод от (\d+)/i
  ]) {
    const match = apiTransaction.title.match(pattern)
    if (match) {
      transaction.payee = `YM ${match[1]}`
      return true
    }
  }
  return false
}

function parseMcc (apiTransaction, transaction) {
  if (apiTransaction.group_id) {
    const match = apiTransaction.group_id.match(/mcc_(\d{4})/)
    if (match) {
      transaction.mcc = parseInt(match[1], 10)
    }
  }
  return false
}

function parsePayee (apiTransaction, transaction) {
  if (!apiTransaction.title) {
    return false
  }
  const patterns = apiTransaction.direction === 'in'
    ? [
      /Зачисление: (.*)/i,
      /Возврат: (.*)/i
    ]
    : [
      /Поддержка проекта [«"]?([^"»]*)["»]?/i,
      /Благодарность проекту [«"]?([^"»]*)["»]?/i,
      /Оплата услуг (.*)/i
    ]
  for (const pattern of patterns) {
    const match = apiTransaction.title.match(pattern)
    if (match) {
      transaction.payee = match[1]
      return false
    }
  }
  if (apiTransaction.direction === 'in' || [
    /Пополнение счета (.*)/i
  ].some(pattern => apiTransaction.title.match(pattern))) {
    transaction.comment = apiTransaction.title
  } else {
    transaction.payee = apiTransaction.title
  }
}
