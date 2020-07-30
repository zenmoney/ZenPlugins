import currencies from '../../common/codeToCurrencyLookup'

export function convertAccount (apiAccount) {
  const account = {
    id: apiAccount.account,
    type: 'checking',
    title: `Яндекс.Деньги (${currencies[apiAccount.currency]})`,
    instrument: currencies[apiAccount.currency],
    syncID: [apiAccount.account.slice(-4)]
  }
  if (apiAccount.balance_details && apiAccount.balance_details.available !== apiAccount.balance_details.total) {
    account.balance = apiAccount.balance_details.total
  } else if (apiAccount.balance_details && apiAccount.balance_details.hold) {
    account.balance = apiAccount.balance + apiAccount.balance_details.hold
  } else {
    account.balance = apiAccount.balance
  }
  return account
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.status !== 'success') {
    return null
  }
  if (apiTransaction.amount === 0) {
    return null
  }
  const invoice = {
    sum: apiTransaction.direction === 'in' ? apiTransaction.amount : -apiTransaction.amount,
    instrument: apiTransaction.amount_currency || account.instrument
  }
  const transaction = {
    date: new Date(apiTransaction.datetime),
    hold: false,
    merchant: null,
    movements: [
      {
        id: apiTransaction.operation_id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment: null
  };
  [
    parseMcc,
    parseYandexMoneyTransfer,
    parseTransfer,
    parsePayee
  ].some(parser => parser(apiTransaction, transaction))
  return transaction
}

function parseYandexMoneyTransfer (apiTransaction, transaction) {
  if (!apiTransaction.title) {
    return false
  }
  for (const pattern of [
    /Перевод на счет (\d+(\d{4}))\b/i,
    /Перевод от (\d{4})\b/i
  ]) {
    const match = apiTransaction.title.match(pattern)
    if (match) {
      transaction.merchant = {
        country: null,
        city: null,
        title: `YM ${match[1]}`,
        mcc: (transaction.merchant && transaction.merchant.mcc) || null,
        location: null
      }
      transaction.comment = null
      transaction.movements.push(
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            syncIds: [match[2]],
            company: null
          },
          invoice: null,
          sum: apiTransaction.amount,
          fee: 0
        })
      return true
    }
  }
  return false
}

function parseTransfer (apiTransaction, transaction) {
  if (!apiTransaction.title) {
    return false
  }
  for (const pattern of [
    /Перевод на карту \d+\*+(\d{4})\b/i
    // /Перевод от (\d+)/i
  ]) {
    const match = apiTransaction.title.match(pattern)
    if (match) {
      transaction.merchant = null
      transaction.comment = match[0]
      transaction.movements.push(
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            syncIds: [match[1]],
            company: null
          },
          invoice: null,
          sum: apiTransaction.amount,
          fee: 0
        })
      return true
    }
  }
  return false
}

function parseMcc (apiTransaction, transaction) {
  if (apiTransaction.group_id) {
    const match = apiTransaction.group_id.match(/mcc_(\d{4})/)
    if (match) {
      transaction.merchant = {
        ...(transaction.merchant || {}),
        mcc: parseInt(match[1], 10)
      }
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
      transaction.merchant = {
        country: null,
        city: null,
        title: match[1],
        mcc: (transaction.merchant && transaction.merchant.mcc) || null,
        location: null
      }
      return false
    }
  }
  if (apiTransaction.direction === 'in' || [
    /Пополнение счета (.*)/i
  ].some(pattern => apiTransaction.title.match(pattern))) {
    transaction.comment = apiTransaction.title
  } else if (apiTransaction.direction === 'out' && [
    /Дополнительное (.*)/i
  ].some(pattern => apiTransaction.title.match(pattern))) {
    transaction.comment = apiTransaction.title
  } else if (transaction.merchant && [6011].includes(transaction.merchant.mcc)) {
    // mcc 6011 - cash withdrawal
    transaction.merchant = null
    transaction.comment = apiTransaction.title
    transaction.movements.push(
      {
        id: null,
        account: {
          type: 'cash',
          instrument: 'RUB',
          syncIds: null,
          company: null
        },
        invoice: null,
        sum: apiTransaction.amount,
        fee: 0
      }
    )
  } else {
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.title,
      mcc: (transaction.merchant && transaction.merchant.mcc) || null,
      location: null
    }
  }
}
