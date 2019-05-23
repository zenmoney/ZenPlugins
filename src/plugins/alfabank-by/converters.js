const countries = {
  'minsk': 'BY',
  'brest': 'BY',
  'grodno': 'BY',
  'gomel': 'BY',
  'vitebsk': 'BY',
  'mogilev': 'BY',
  'amsterdam': 'NL',
  'moscow': 'RU'
}

export function convertAccount (json) {
  switch (json.type) {
    case 'ACCOUNT':
      return {
        id: json.id,
        type: 'checking',
        title: json.info.title,
        balance: Number.parseFloat(json.info.amount.amount),
        instrument: json.info.amount.currency,
        syncID: [json.info.description.replace(/\s/g, '')],
        productType: json.type
      }
    case 'CARD':
      return {
        id: json.id,
        type: 'card',
        title: json.info.title,
        balance: Number.parseFloat(json.info.amount.amount),
        instrument: json.info.amount.currency,
        syncID: [json.id.slice(1, 21), json.info.description.slice(-4)], // 53014111MRT0011110000380 -> 3014111MRT0011110000
        productType: json.type
      }
    case 'DEPOSIT':
      return {
        id: json.id,
        type: 'checking',
        title: json.info.title,
        balance: Number.parseFloat(json.info.amount.amount),
        instrument: json.info.amount.currency,
        syncID: [json.info.description.replace(/\s/g, '')],
        productType: json.type,
        savings: true
      }
    default:
      return null
  }
}

export function convertTransaction (json, accounts) {
  if (json.operation === 'RATE_ORDER' ||
      json.info.amount.amount === 0) {
    return null
  }
  const account = accounts.find(account => {
    return json.iban.replace(/\s/g, '').indexOf(account.syncID[0]) !== -1
  })

  const transaction = {
    date: parseDate(json.date),
    movements: [ getMovement(json, account) ],
    merchant: null,
    comment: null,
    hold: json.status !== 'NORMAL'
  };

  [
    parseP2P,
    parseCash,
    parsePayee,
    parseComment
  ].some(parser => parser(transaction, json))

  return transaction
}

function getMovement (json, account) {
  const movement = {
    id: json.id || null,
    account: { id: account.id },
    invoice: null,
    sum: json.info.amount.amount,
    fee: 0
  }

  if (json.operationAmount && json.operationAmount.currency !== account.instrument) {
    var amount = json.operationAmount.amount
    if ((movement.sum > 0 && amount < 0) || (movement.sum < 0 && amount > 0)) {
      amount *= -1
    }
    movement.invoice = {
      sum: amount,
      instrument: json.operationAmount.currency
    }
  }

  return movement
}

function parseP2P (transaction, json) {
  if (json.description.indexOf('P2P') > 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'ccard',
        instrument: json.info.amount.currency,
        syncIds: null
      },
      invoice: null,
      sum: -json.info.amount.amount,
      fee: 0
    })
    return true
  }
}

function parseCash (transaction, json) {
  if (json.description.indexOf('Получение денег в банкомате') > 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: json.info.amount.currency,
        syncIds: null
      },
      invoice: null,
      sum: -json.info.amount.amount,
      fee: 0
    })
    return true
  } else if (json.operation === 'CURRENCYEXCHANGE') {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: json.operationAmount.currency,
        syncIds: null
      },
      invoice: null,
      sum: json.operationAmount.amount,
      fee: 0
    })
  }
}

function parsePayee (transaction, json) {
  if (json.description.indexOf('Покупка товара') >= 0 ||
    json.description.split(' ').length === 2) {
    transaction.merchant = {
      mcc: null,
      location: null
    }
    let location = json.description.split(' ')
    var country = ''
    if (location.length === 2) {
      country = location[1]
    } else {
      country = countries[location[0].toLowerCase()]
    }
    if (country !== undefined) {
      transaction.merchant.title = json.info.title
      transaction.merchant.city = location[0]
      transaction.merchant.country = country
    } else {
      transaction.merchant.fullTitle = json.info.title
    }
    return true
  }
}

function parseComment (transaction, json) {
  if (!json.description) { return false }

  // переводы между счетами полезной информации не несут, гасим сразу
  if (json.description.indexOf('P2P') >= 0 ||
    json.operation === 'CURRENCYEXCHANGE') {
    return true
  } else if (json.description.indexOf('за обслуживание карточки') >= 0 ||
    json.description.indexOf('Вознаграждение за обслуживание') >= 0) {
    transaction.comment = json.info.title
    return false
  } else if (json.description.indexOf('Покупка товара') >= 0) {
    let location = json.description.split(' ')
    transaction.comment = json.description.replace(json.info.title, '') // Убираем место покупки
    transaction.comment = transaction.comment.replace(location[0], '').trim() // Убираем город покупки
    return false
  } else if (json.description.indexOf('ERIP') >= 0) {
    transaction.comment = json.info.title
    return false
  }
  transaction.comment = json.description
  return false
}

export function parseDate (str) {
  const [year, month, day, hour, minute, second] = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}
