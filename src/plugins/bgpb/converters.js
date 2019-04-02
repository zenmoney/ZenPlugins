import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (ob) {
  return {
    id: ob.Id,
    transactionsAccId: null,
    type: 'card',
    title: ob.CustomName + '*' + ob.No.slice(-4),
    currencyCode: ob.Currency,
    cardNumber: ob.No,
    instrument: codeToCurrencyLookup[ob.Currency],
    balance: 0,
    syncID: [ob.No.slice(-4)],
    productType: ob.ProductType
  }
}

export function convertTransaction (apiTransaction, accounts) {
  const account = accounts.find(account => {
    return account.syncID.indexOf(apiTransaction.cardNum) !== -1
  })

  const transaction = {
    date: getDate(apiTransaction.date),
    movements: [ getMovement(apiTransaction, account) ],
    merchant: null,
    comment: null,
    hold: false
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
    sum: getSumAmount(apiTransaction.type, apiTransaction.amount),
    fee: 0
  }

  if (apiTransaction.currencyReal !== account.instrument) {
    movement.invoice = {
      sum: getSumAmount(apiTransaction.type, apiTransaction.amountReal),
      instrument: apiTransaction.currencyReal
    }
  }

  return movement
}

function parseCash (transaction, apiTransaction) {
  if (apiTransaction.description.indexOf('наличных на карту') > 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: apiTransaction.currency,
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(apiTransaction.type, apiTransaction.amount),
      fee: 0
    })
    return true
  }
}

function parsePayee (transaction, apiTransaction) {
  if (!apiTransaction.place) {
    return false
  }

  transaction.merchant = {
    mcc: Number(apiTransaction.mcc),
    location: null
  }
  const merchant = apiTransaction.place.split(', ')
  if (merchant.length === 1) {
    transaction.merchant.fullTitle = apiTransaction.place
  } else if (merchant.length > 1) {
    const [country, title, city] = apiTransaction.place.match(/([a-zA-Z]{2}) (.*), (.*)/).slice(1)
    transaction.merchant.title = title
    transaction.merchant.city = city
    transaction.merchant.country = country
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + apiTransaction.place)
  }
}

function parseComment (transaction, apiTransaction) {
  if (!apiTransaction.description) { return false }

  switch (apiTransaction.description) {
    // переводы между счетами и зачисление полезной информации не несут, гасим сразу
    case 'Внесение наличных на карту':
      return true

    // в покупках комментарии не оставляем
    case 'Безналичная оплата':
      return false

    default:
      transaction.comment = apiTransaction.description
      return false
  }
}

function getSumAmount (debitFlag, strAmount) {
  const amount = Number.parseFloat(strAmount.replace(' ', '').replace(',', '.'))
  return debitFlag === 'ЗАЧИСЛЕНИЕ' ? amount : -amount
}

export function getDate (str) {
  const [day, month, year, hour, minute] = str.match(/(\d{2}).(\d{2}).(\d{4}) (\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+03:00`)
}
