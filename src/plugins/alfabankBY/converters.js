export function convertAccount (json) {
  if (json.objectType === 'ACCOUNT') { // only loading card accounts
    return {
      id: json.id,
      type: 'card',
      title: json.icon.title,
      balance: Number.parseFloat(json.tagBalance),
      syncID: [json.objectId],
      productType: json.type
    }
  } else {
    return null
  }
}

export function addAccountInfo (account, json) {
  account.instrument = json.info.amount.currency
  account.syncID.push(json.iban)
  return account
}

export function convertTransaction (apiTransaction, accounts) {
  const account = accounts.find(account => {
    return account.syncID.indexOf(apiTransaction.accountId) !== -1
  })

  const transaction = {
    date: getDate(apiTransaction.transDate),
    movements: [ getMovement(apiTransaction, account) ],
    merchant: null,
    comment: null,
    hold: apiTransaction.status !== 'T'
  };

  [
    parseCash,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction))

  return transaction
}

function getMovement (apiTransaction, account) {
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: getSumAmount(apiTransaction.debitFlag, apiTransaction.transAmount),
    fee: 0
  }

  if (apiTransaction.curr !== account.instrument) {
    movement.invoice = {
      sum: getSumAmount(apiTransaction.debitFlag, apiTransaction.amount),
      instrument: apiTransaction.curr
    }
  }

  return movement
}

function parseCash (transaction, apiTransaction) {
  if (apiTransaction.description.indexOf('нятие нал') > 0 ||
    apiTransaction.description.indexOf('ополнение нал') > 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: apiTransaction.curr,
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(apiTransaction.debitFlag, apiTransaction.amount),
      fee: 0
    })
    return true
  }
}

function parsePayee (transaction, apiTransaction) {
  // интернет-платежи отображаем без получателя
  if (!apiTransaction.place || apiTransaction.place.indexOf('MTB INTERNET POS') >= 0) {
    return false
  }

  transaction.merchant = {
    mcc: null,
    location: null
  }
  const merchant = apiTransaction.place.split(' / ').map(str => str.trim())
  if (merchant.length === 1) {
    transaction.merchant.fullTitle = merchant[0]
  } else if (merchant.length === 3) {
    transaction.merchant.title = merchant[0]
    transaction.merchant.city = merchant[1]
    transaction.merchant.country = merchant[2]
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + apiTransaction.place)
  }
}

function parseComment (transaction, apiTransaction) {
  if (!apiTransaction.description) { return false }

  switch (apiTransaction.description) {
    // переводы между счетами полезной информации не несут, гасим сразу
    case 'Пополнение при переводе между картами в Интернет-банке в рамках одного клиента':
    case 'Списание при переводе в Интернет-банке в рамках одного клиента':
    case 'Перевод с БПК МТБ в системе Р2Р':
    case 'Перевод на БПК МТБ в системе Р2Р':
    case 'Списание при переводе в Интернет-банке, произвольном платеже, оплате кредита':
    case 'Перевод между своими картами':
      return true

    // в покупках комментарии не оставляем
    case 'Оплата товаров и услуг':
    case 'Оплата товаров и услуг в сети МТБанка':
      return false

    // сохраняем комментарий и гасим дальнейшую оработку
    case 'Перевод на карту другого клиента':
    case 'Оплата в Интернет-банке':
      transaction.comment = apiTransaction.description
      return true

    default:
      transaction.comment = apiTransaction.description
      return false
  }
}

function getSumAmount (debitFlag, strAmount) {
  const amount = Number.parseFloat(strAmount)
  return debitFlag === '1' ? amount : -amount
}

export function getDate (str) {
  const [year, month, day, hour, minute, second] = str.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}
