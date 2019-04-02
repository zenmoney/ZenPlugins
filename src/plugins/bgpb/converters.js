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

  console.log(getDate(apiTransaction.date))
  const transaction = {
    date: getDate(apiTransaction.date),
    movements: [ getMovement(apiTransaction, account) ],
    merchant: null,
    comment: null,
    hold: false
  };

  [
    // parseCash,
    // parseComment,
    // parsePayee
  ].some(parser => parser(transaction, apiTransaction))

  return transaction
}

function getMovement (apiTransaction, account) {
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: Number.parseFloat(apiTransaction.amount.replace(' ', '').replace(',', '.')),
    fee: 0
  }

  if (apiTransaction.currency !== account.instrument) {
    movement.invoice = {
      sum: Number.parseFloat(apiTransaction.amountReal.replace(' ', '').replace(',', '.')),
      instrument: apiTransaction.currencyReal
    }
  }

  return movement
}

/* function parseCash (transaction, apiTransaction) {
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
} */

export function getDate (str) {
  const [day, month, year, hour, minute] = str.match(/(\d{2}).(\d{2}).(\d{4}) (\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+03:00`)
}
