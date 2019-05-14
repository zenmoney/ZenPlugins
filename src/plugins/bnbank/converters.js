import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
export const card = 'card'
export const deposit = 'deposit'

export function convertCard (json) {
  return convertAccount(json, card)
}

export function convertDeposit (json) {
  return convertAccount(json, deposit)
}

export function convertAccount (json, accountType) {
  switch (accountType) {
    case card:
      if (json.cards && json.cards.length > 0) { // only loading card accounts
        const account = {
          id: json.internalAccountId,
          type: card,
          title: json.productName,
          currencyCode: json.currency,
          instrument: codeToCurrencyLookup[json.currency],
          balance: Number.parseFloat(json.cards[0].balance),
          syncID: [json.internalAccountId],
          rkcCode: json.rkcCode,
          cardHash: json.cards[0].cardHash
        }

        json.cards.forEach(function (el) {
          account.syncID.push(el.cardNumberMasked.slice(-4))
        })

        return account
      }
      return null
    case deposit:
      return {
        id: json.internalAccountId,
        type: deposit,
        title: 'Депозит ' + json.productName,
        currencyCode: json.currency,
        instrument: codeToCurrencyLookup[json.currency],
        balance: Number.parseFloat(json.balanceAmount),
        syncID: [json.internalAccountId],
        capitalization: true,
        startDate: new Date(json.openDate),
        endDateOffset: new Date(json.endDate).getTime() / 1000,
        percent: json.interestRate,
        endDateOffsetInterval: 'month',
        payoffInterval: 'month',
        payoffStep: 1,
        rkcCode: json.rkcCode
      }
    default:
      return null
  }
}

export function convertTransaction (json, accounts) {
  const account = accounts.find(account => {
    return account.syncID.indexOf(json.accountNumber) !== -1
  })

  const transaction = {
    date: new Date(json.transactionDate),
    movements: [ getMovement(json, account) ],
    merchant: null,
    comment: null,
    hold: false
  };

  [
    parseCash,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, json))

  return transaction
}

export function convertLastTransaction (json, accounts) {
  const account = accounts.find(account => {
    return account.syncID.indexOf(json.accountNumber) !== -1
  })
  if (json.trans_iso_currency !== account.instrument) {
    // Пока не понятно как конверсировать валюты, поэтому такие платежи вносим корректировками
    return null
  }
  json.operationPlace = json.card_acceptor
  json.operationCode = 3
  json.operationAmount = Number.parseFloat(json.auth_amount)
  json.operationName = json.transac_type === '1' ? 'Снятие наличных' : ''

  const transaction = {
    date: new Date(getLastTransactionDate(json.auth_date)),
    movements: [ getMovement(json, account) ],
    merchant: null,
    comment: null,
    hold: false
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
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: json.operationCode === 3 ? -json.operationAmount : json.operationAmount,
    fee: 0
  }
  if (json.operationName.indexOf('Удержано подоходного налога') >= 0) {
    let nameSplit = json.operationName.split(' ')
    movement.fee = Number.parseFloat(nameSplit[nameSplit.length - 1])
  }
  return movement
}

function parseCash (transaction, json) {
  if (json.operationName.indexOf('наличных') > 0 ||
    json.operationName.indexOf('Снятие денег со счета') > 0 ||
    json.operationName.indexOf('Пополнение наличными') > 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: json.trans_iso_currency ? json.trans_iso_currency : codeToCurrencyLookup[json.operationCurrency],
        syncIds: null
      },
      invoice: null,
      sum: Number.parseFloat(json.auth_amount ? json.auth_amount : json.operationAmount),
      fee: 0
    })
    return false
  }
}

function parsePayee (transaction, json) {
  // интернет-платежи отображаем без получателя
  if (!json.operationPlace ||
    json.operationPlace.indexOf('BNB - OPLATA USLUG') >= 0 ||
    json.operationPlace.indexOf('OPLATA USLUG - KOMPLAT BNB') >= 0) {
    return false
  }
  transaction.merchant = {
    mcc: null,
    location: null
  }
  const merchant = json.operationPlace.split('>').map(str => str.trim())
  if (merchant.length === 1) {
    transaction.merchant.fullTitle = json.operationPlace
  } else if (merchant.length === 2) {
    transaction.merchant.title = merchant[0]
    let geo = merchant[1].split(' ')
    transaction.merchant.city = merchant[1].replace(' ' + geo[geo.length - 1], '').trim()
    transaction.merchant.country = geo[geo.length - 1]
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + json.operationPlace)
  }
}

function parseComment (transaction, json) {
  if (!json.operationName) { return false }

  if (json.operationName.indexOf('Капитализация. Удержано подоходного налога') >= 0) {
    transaction.comment = 'Капитализация'
    return false
  }
  switch (json.operationName) {
    // переводы между счетами полезной информации не несут, гасим сразу
    case 'Списание по операции ПЦ "Перечисление с карты на карту" ':
    case 'On-line пополнение договора (списание с БПК)':
      return true

    // в покупках комментарии не оставляем
    case 'Покупки':
    case 'Покупки(конверсия)':
    case 'Операция в Интернет-Банк':
    case 'Покупка товаров и услуг':
    case 'Списание по операции ПЦ "Оплата услуг в ИБ" ':
      return false

    default:
      transaction.comment = json.operationName
      return false
  }
}

export function getLastTransactionDate (str) {
  const [day, month, year, hour, minute, second] = str.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}
