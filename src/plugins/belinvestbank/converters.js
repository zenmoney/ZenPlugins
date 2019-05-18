export function convertAccount (json) {
  return {
    id: json.id,
    type: 'card',
    title: json.finalName + '*' + json.num.slice(-4),
    instrument: json.currency,
    balance: Number.parseFloat(json.balance.replace(' ', '')),
    syncID: [json.num.slice(-4)]
  }
}

export function convertTransaction (json, accounts) {
  if (json.status !== 'ПРОВЕДЕНО') {
    return null
  }
  const account = accounts.find(account => {
    return account.syncID.indexOf(json.cardNum.slice(-4)) !== -1
  })

  const transaction = {
    date: getDate(json.date),
    movements: [ getMovement(json, account) ],
    merchant: null,
    comment: null,
    hold: false
  };

  [
    parseCash,
    parsePayee
  ].some(parser => parser(transaction, json))

  return transaction
}

function getMovement (json, account) {
  return {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: getSumAmount(json.type, json.accountAmt),
    fee: 0
  }
}

function parseCash (transaction, json) {
  if (json.type === 'Выдача наличных') {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: json.accountAmtCurrency !== '' ? json.accountAmtCurrency : 'BYN',
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(json.type, json.accountAmt),
      fee: 0
    })
    return false
  }
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
    transaction.merchant.title = merchant[0]
    if (merchant[0] === 'SMS OPOVESCHENIE') {
      transaction.comment = merchant[0]
      transaction.merchant.title = ''
    }
    transaction.merchant.city = merchant[1].split(' ')[0].trim()
    transaction.merchant.country = merchant[1].slice(-4).trim()
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + json.cardAcceptor)
  }
}

function getSumAmount (debitFlag, strAmount) {
  const amount = Number.parseFloat(strAmount.replace(',', '.').replace(' ', ''))
  return debitFlag === 'ПОПОЛНЕНИЕ' ? amount : -amount
}

export function getDate (str) {
  const [year, month, day, hour, minute, second] = str.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}
