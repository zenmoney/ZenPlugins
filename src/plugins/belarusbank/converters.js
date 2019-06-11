export function convertAccount (acc) {
  console.log(acc)
  switch (acc.type) {
    case 'deposit':
      let start = getDate(acc.details.match(/Дата открытия:\s(.[0-9.]*)/i)[1])
      let stop = getDate(acc.details.match(/Срок возврата вклада:\s(.[0-9.]*)/i)[1])
      let depositDays = (stop - start) / 60 / 60 / 24 / 1000
      return {
        id: acc.id,
        type: 'deposit',
        title: acc.name,
        instrument: acc.currency,
        balance: Number.parseFloat(acc.balance.replace(/\s/g, '')),
        syncID: [acc.id],
        capitalization: true,
        percent: Number.parseFloat(acc.details.match(/Процентная ставка:.*\s(.[0-9]*)%/i)[1]),
        startDate: start,
        endDateOffset: depositDays,
        endDateOffsetInterval: 'day',
        payoffStep: 1,
        payoffInterval: 'month'
      }
  }
}

export function convertTransaction (json, accounts) {
  if (json.amount === '') { // skip frozen operations
    return null
  }
  const account = accounts.find(account => {
    return account.syncID.indexOf(json.accountId) !== -1
  })

  const transaction = {
    date: getDate(json.transDate),
    movements: [ getMovement(json, account) ],
    merchant: null,
    comment: null,
    hold: json.status !== 'T'
  };

  [
    parseCash,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, json))

  return transaction
}

function getMovement (json, account) {
  const movement = {
    id: json.transactionId,
    account: { id: account.id },
    invoice: null,
    sum: getSumAmount(json.debitFlag, json.transAmount),
    fee: 0
  }

  if (json.curr !== account.instrument) {
    movement.invoice = {
      sum: getSumAmount(json.debitFlag, json.amount),
      instrument: json.curr
    }
  }

  return movement
}

function parseCash (transaction, json) {
  if ((json.mcc === '6011' && (json.description === null || json.description.indexOf('Комиссия') === -1)) ||
    json.description.indexOf('нятие наличных в АТМ') > 0 ||
    json.description.indexOf('ополнение нал') > 0 ||
    json.description === 'Внесение наличных' ||
    json.description === 'Выдача наличных') {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: json.curr,
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(json.debitFlag, json.amount),
      fee: 0
    })
    return true
  }
}

function parsePayee (transaction, json) {
  // интернет-платежи отображаем без получателя
  if (!json.place || json.place.indexOf('MTB INTERNET POS') >= 0) {
    return false
  }

  transaction.merchant = {
    mcc: json.mcc ? Number.parseInt(json.mcc) : null,
    location: null
  }
  if (json.city) {
    transaction.merchant.country = json.country
    transaction.merchant.city = json.city
    transaction.merchant.title = json.place
  } else {
    transaction.merchant.fullTitle = json.place
  }
}

function parseComment (transaction, apiTransaction) {
  if (!apiTransaction.description) { return false }

  // переводы между счетами полезной информации не несут, гасим сразу
  if (apiTransaction.description.indexOf('Пополнение при переводе между картами в Интернет-банке в рамках одного клиента') >= 0 ||
    apiTransaction.description.indexOf('Списание при переводе в Интернет-банке в рамках одного клиента') >= 0 ||
    apiTransaction.description.indexOf('Перевод с БПК МТБ в системе Р2Р') >= 0 ||
    apiTransaction.description.indexOf('Перевод на БПК МТБ в системе Р2Р') >= 0 ||
    apiTransaction.description.indexOf('Списание при переводе в Интернет-банке, произвольном платеже, оплате кредита') >= 0 ||
    apiTransaction.description.indexOf('Перевод между своими картами') >= 0) {
    return true
  }
  // в покупках комментарии не оставляем
  if (apiTransaction.description.indexOf('Оплата товаров и услуг') >= 0 ||
    apiTransaction.description.indexOf('Оплата товаров и услуг в сети МТБанка') >= 0 ||
    apiTransaction.description.indexOf('Покупка с карты банка в устройстве партнера') >= 0 ||
    apiTransaction.description.indexOf('Покупка с карты банка в чужом устройстве') >= 0 ||
    apiTransaction.description.indexOf('Оплата в Интернет-банке') >= 0) {
    return false
  }
  // сохраняем комментарий и гасим дальнейшую оработку
  if (apiTransaction.description.indexOf('Перевод на карту другого клиента') >= 0) {
    transaction.comment = apiTransaction.description
    return true
  }
  transaction.comment = apiTransaction.description
  return false
}

function getSumAmount (debitFlag, strAmount) {
  const amount = Number.parseFloat(strAmount)
  return debitFlag === '1' ? amount : -amount
}

export function getDate (str) {
  const [day, month, year] = str.match(/(\d{2}).(\d{2}).(\d{4})/).slice(1)
  return new Date(`${year}-${month}-${day}T00:00:00+03:00`)
}
