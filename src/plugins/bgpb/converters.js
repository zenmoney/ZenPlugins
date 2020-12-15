import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (ob) {
  if (ob.Enabled && ob.Enabled === 'N') {
    return null
  }
  const id = ob.Id.split('-')[0]
  if (ob.ProductType !== 'NON_ONUS' && !ZenMoney.isAccountSkipped(id)) {
    // eslint-disable-next-line no-debugger
    return {
      id,
      transactionsAccId: null,
      type: 'card',
      title: ob.CustomName + '*' + ob.No.slice(-4),
      currencyCode: ob.Currency,
      cardNumber: ob.No,
      instrument: codeToCurrencyLookup[ob.Currency],
      balance: 0,
      syncID: [ob.No.slice(-4)],
      productId: ob.Id,
      productType: ob.ProductType
    }
  }
  return null
}

export function addOverdraftInfo (accounts, overdrafts) {
  for (const accountNumber in overdrafts) {
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].accountID === accountNumber) {
        accounts[i].creditLimit = Number.parseFloat(overdrafts[accountNumber].replace(',', '.').replace(/\s/g, ''))
        accounts[i].balance = -(accounts[i].creditLimit - accounts[i].balance)
      }
    }
  }
  return accounts
}

export function convertTransaction (apiTransaction, accounts) {
  const account = accounts.find(account => {
    return account.syncID.indexOf(apiTransaction.cardNum) !== -1
  })

  const transaction = {
    date: getDate(apiTransaction.date),
    movements: [getMovement(apiTransaction, account)],
    merchant: null,
    comment: null,
    hold: false
  };

  [
    parseCash,
    parsePayee,
    parseComment
  ].some(parser => parser(transaction, apiTransaction))

  return transaction
}

export function convertLastTransaction (apiTransaction, accounts) {
  const rawData = apiTransaction.pushMessageText.split('; ')

  if (rawData[0].slice(0, 4) !== 'Card' || rawData[1] === 'Смена статуса карты') {
    // Значит это не транзакция, а просто уведомление банка
    return null
  }

  const account = accounts.find(account => {
    return account.syncID.indexOf(rawData[0].slice(-4)) !== -1
  })
  if (!account) {
    return null
  }
  let amountData = rawData[1].split(': ')
  let currency = amountData[1].slice(-3)
  let amount = amountData[1].replace(' ' + currency, '')
  let date = getDateFromJSON(rawData[2])
  let dateDate = getDateJSON(rawData[2])
  apiTransaction.payeeLastTransaction = rawData[3]

  const isChangePinTransaction = rawData[1] === 'Смена PIN' // Транзакция смены pin имеет не стандартный формат. Нет ни одного теста !!!
  if (isChangePinTransaction) {
    amountData = rawData[2].split(' ')
    currency = amountData[2].slice(-3)
    amount = amountData[1]
    date = getDateFromJSON(rawData[3])
    dateDate = getDateJSON(rawData[3])
  }

  apiTransaction.description = amountData[0]
  apiTransaction.currency = currency
  apiTransaction.type = amountData[0]
  apiTransaction.amount = amount
  apiTransaction.dateDate = dateDate

  const transaction = {
    date: date,
    movements: [getMovement({
      type: amountData[0],
      amount: amount,
      currencyReal: currency,
      amountReal: '' // на текущий момент не понятно как нормально узнать реальное списание при использовании другой валюты, поэтому будем делать такие списания корректировками :(
    }, account)],
    merchant: null,
    comment: null,
    hold: false
  };

  [
    parseP2P,
    parseCash,
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
  if (apiTransaction.description.indexOf('наличных на карту') > 0 ||
    apiTransaction.description === 'Пополнение' ||
    apiTransaction.description === 'Снятие наличных' ||
    apiTransaction.description === 'Наличные в ПОС') {
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
    return false
  } else if (apiTransaction.description === 'Перевод (зачисление)') {
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

function parseP2P (transaction, apiTransaction) {
  if (!apiTransaction.payeeLastTransaction) {
    return false
  }

  for (const pattern of [
    /P2P/
  ]) {
    const match = apiTransaction.payeeLastTransaction.match(pattern)
    if (match) {
      transaction.groupKeys = [
        `${apiTransaction.dateDate}_${apiTransaction.currency}_${Math.abs(getSumAmount(apiTransaction.type, apiTransaction.amount)).toString()}`
      ]
      transaction.merchant = null
      transaction.movements.push({
        id: null,
        account: {
          company: null,
          type: 'ccard',
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
  return false
}

function parsePayee (transaction, apiTransaction) {
  if (!apiTransaction.place && !apiTransaction.payeeLastTransaction) {
    return false
  }
  const mcc = Number(apiTransaction.mcc)
  transaction.merchant = {
    mcc: isNaN(mcc) || mcc === 0 ? null : mcc,
    location: null
  }
  if (apiTransaction.payeeLastTransaction) {
    const merchant = apiTransaction.payeeLastTransaction.split(',')
    if (merchant.length === 1) {
      transaction.merchant.fullTitle = apiTransaction.payeeLastTransaction
    } else if (merchant[0] === '') {
      transaction.merchant = null
    } else if (merchant.length > 1) {
      transaction.merchant.title = merchant[0]
      transaction.merchant.city = merchant[1]
      transaction.merchant.country = merchant[2]
    } else {
      throw new Error('Ошибка обработки транзакции с получателем: ' + apiTransaction.place)
    }
    return
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
  const amount = Number.parseFloat(strAmount.replace(',', '.').replace(/\s/g, ''))
  if (/зачисление/gi.test(debitFlag) || debitFlag.indexOf('Пополнение') === 0) {
    return amount
  }
  return -amount
}

function getDate (str) {
  const [day, month, year, hour, minute] = str.match(/(\d{2}).(\d{2}).(\d{4}) (\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+03:00`)
}

function getDateFromJSON (str) {
  const [day, month, year, hour, minute] = str.match(/(\d{2}).(\d{2}).(\d{2}) (\d{2}):(\d{2}):\d{2}/).slice(1)
  return new Date(`20${year}-${month}-${day}T${hour}:${minute}:00+03:00`)
}

function getDateJSON (str) {
  const [day, month, year] = str.match(/(\d{2}).(\d{2}).(\d{2})/).slice(1)
  return (`20${year}-${month}-${day}`)
}

export function transactionsUnique (array) {
  const a = array.concat()
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i].date.getTime() === a[j].date.getTime() &&
      a[i].movements.length === a[j].movements.length &&
      a[i].movements[0].account.id === a[j].movements[0].account.id &&
        a[i].movements[0].sum === a[j].movements[0].sum) {
        a.splice(j--, 1)
      }
    }
  }
  return a
}
