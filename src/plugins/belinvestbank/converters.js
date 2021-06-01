export function convertAccount (json) {
  return {
    id: json.id,
    type: 'card',
    title: json.finalName + '*' + json.num.slice(-4),
    instrument: json.currency,
    balance: Number.parseFloat(json.freeAmt.replace(/\s/g, '')),
    creditLimit: Number.parseFloat(json.overdraftAmt !== null ? json.overdraftAmt.replace(/\s/g, '') : 0),
    syncID: [json.num.slice(-4)]
  }
}

export function convertTransaction (json, account) {
  if ((json.status !== 'ПРОВЕДЕНО' && json.status !== 'ЗАБЛОКИРОВАНО') || json.accountAmt === '') {
    return null
  }

  const transaction = {
    date: getDate(json.date),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: getSumAmount(json),
        fee: 0
      }
    ],
    merchant: null,
    comment: null,
    hold: json.status === 'ЗАБЛОКИРОВАНО'
  };

  [
    parseCash,
    parseOuterTransfer,
    parsePayee
  ].some(parser => parser(transaction, json))

  return transaction
}

function parseOuterTransfer (transaction, json) {
  for (const pattern of [
    /^Перевод /
  ]) {
    const match = json.type?.match(pattern)
    if (match) {
      makeOuterTransfer(transaction, json)
      return true
    }
  }

  for (const pattern of [
    /P2P/
  ]) {
    const match = json.cardAcceptor?.match(pattern)
    if (match) {
      makeOuterTransfer(transaction, json)
      return true
    }
  }
  return false
}

function parseCash (transaction, json) {
  if (json.type === 'Выдача наличных') {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: json.accountAmtCurrency || 'BYN',
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(json),
      fee: 0
    })
  }
  return false
}

function parsePayee (transaction, json) {
  // интернет-платежи отображаем без получателя
  if (!json.cardAcceptor) {
    return false
  }

  transaction.merchant = {
    mcc: null,
    location: null
  }
  const merchant = json.cardAcceptor.split('>')
  if (merchant.length === 1) {
    if (json.cardAcceptor.trim() !== 'ЗАЧИСЛЕНИЕ НА СЧЕТ') {
      transaction.merchant.fullTitle = json.cardAcceptor.trim()
    } else {
      transaction.merchant.fullTitle = 'Bank'
    }
  } else if (merchant.length === 2) {
    const country = merchant[1].split(/\s+/)[1]?.trim()
    transaction.merchant.city = merchant[1].split(/\s+/)[0].trim()
    transaction.merchant.country = country || null
    transaction.merchant.title = merchant[0]
    if (merchant[0] === 'SMS OPOVESCHENIE') {
      transaction.comment = merchant[0]
      transaction.merchant = null
    }
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + json.cardAcceptor)
  }
}

function getSumAmount (json) {
  const amount = Number.parseFloat(json.accountAmt.replace(',', '.').replace(' ', ''))
  let sum = null
  if (json.sign) {
    sum = json.sign === '+' ? amount : -amount
  } else {
    sum = json.type === 'ПОПОЛНЕНИЕ' ? amount : -amount
  }
  return sum
}

function makeOuterTransfer (transaction, json) {
  transaction.merchant = null
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      type: 'ccard',
      instrument: json.accountAmtCurrency || 'BYN',
      syncIds: null
    },
    invoice: null,
    sum: -getSumAmount(json),
    fee: 0
  })
}

export function getDate (str) {
  const [year, month, day, hour, minute, second] = str.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}
