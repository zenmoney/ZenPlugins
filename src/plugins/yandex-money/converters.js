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
  console.log('____??????????____')
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
  console.log('____??????????____')
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
    parsePayee
  ].some(parser => parser(apiTransaction, transaction))
  console.log(transaction)
  return transaction
}

function parseYandexMoneyTransfer (apiTransaction, transaction) {
  if (!apiTransaction.title) {
    return false
  }
  for (const pattern of [
    /Перевод на счет (\d+)/i, // title: 'Перевод на карту 553691******2743' ????
    /Перевод от (\d+)/i
  ]) {
    const match = apiTransaction.title.match(pattern)
    console.log('____??????????____')
    if (match) {
      transaction.merchant = { // YM 4100148118398
        country: null,
        city: null,
        title: `YM ${match[1]}`,
        mcc: (transaction.merchant && transaction.merchant.mcc) || null,
        location: null
      }
      console.log('____??????????____')
      return true
    }
  }
  console.log('____??????????____')
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
      console.log('____??????????____')
    }
  }
  console.log('____??????????____')
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
  console.log('____??????????____')
  for (const pattern of patterns) {
    const match = apiTransaction.title.match(pattern)
    if (match) {
      transaction.merchant = { // 6,542541865986110009   5,Скрытый смысл
        country: null,
        city: null,
        title: match[1],
        mcc: (transaction.merchant && transaction.merchant.mcc) || null,
        location: null
      }
      console.log('____??????????____')
      return false
    }
  }
  if (apiTransaction.direction === 'in' || [ // 4,Дополнительное зачисление по операции   9,Сбербанк, пополнение   10,travelpayouts.ru, пополнение   11,Пополнение с банковской карты
    /Пополнение счета (.*)/i
  ].some(pattern => apiTransaction.title.match(pattern))) {
    transaction.comment = apiTransaction.title
    console.log('____??????????____')
  } else if (apiTransaction.direction === 'out' && [ // 3,Дополнительное списание по операции
    /Дополнительное (.*)/i
  ].some(pattern => apiTransaction.title.match(pattern))) {
    transaction.comment = apiTransaction.title
    console.log('____??????????____')
  } else if (transaction.merchant && [6011].includes(transaction.merchant.mcc)) { // 1,Снятие наличных в банкомате: VB24 D. 15, LIT. G, PR
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
    console.log('____??????????____')
  } else { // 2,541029695812341276   7,PP*2649CODE mcc: 8999  ( 8,SHOP "EVROOPT" MVV mcc: 5411 sum: null ?????
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.title,
      mcc: (transaction.merchant && transaction.merchant.mcc) || null,
      location: null
    }
    console.log('____??????????____')
  }
  console.log('____??????????____')
}
