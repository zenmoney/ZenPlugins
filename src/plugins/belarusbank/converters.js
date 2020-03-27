export function convertAccount (acc) {
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
        percent: Number.parseFloat(acc.details.match(/Процентная ставка:.*\s(.[0-9.]*)%/i)[1]),
        startDate: start,
        endDateOffset: depositDays,
        endDateOffsetInterval: 'day',
        payoffStep: 1,
        payoffInterval: 'month'
      }
    case 'ccard':
      const cardsArray = acc.cards.filter(card => card.isActive)
      if (cardsArray.length === 0) return null
      const account = {
        id: acc.accountNum, // acc.accountId,
        type: 'ccard',
        title: acc.accountName,
        syncID: [],
        balance: Number.parseFloat(acc.balance.replace(/\s/g, '')),
        instrument: acc.currency,
        raw: acc
      }
      cardsArray.forEach(card => {
        if (card.number) {
          account.syncID.push(card.number)
        }
      })
      if (account.syncID.indexOf(acc.accountNum) < 0) {
        account.syncID.push(acc.accountNum)
      }
      return account
    case 'account':
      return {
        id: acc.accountNum, // acc.accountId,
        type: 'checking',
        title: acc.accountName,
        syncID: [acc.accountNum],
        balance: Number.parseFloat(acc.balance.replace(/\s/g, '')),
        instrument: acc.currency,
        raw: acc
      }
  }
}

export function convertTransaction (tr, accounts) {
  if (tr.status === 'operResultError') {
    return null
  }
  const account = accounts.find(account => {
    return account.syncID.indexOf(tr.accountID) !== -1
  })

  const transaction = {
    date: getFullDate(tr.date + ' ' + tr.time),
    movements: [ getMovement(tr, account) ],
    merchant: null,
    hold: tr.status !== 'operResultOk'
  };

  [
    parseCash,
    parsePayee
  ].some(parser => parser(transaction, tr))

  return transaction
}

function getMovement (tr, account) {
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: getSumAmount(tr.debitFlag, tr.inAccountSum),
    fee: Math.abs(parseFloat(tr.fee) * 100) / 100
  }

  if (tr.operationCurrency !== account.instrument) {
    movement.invoice = {
      sum: getSumAmount(tr.debitFlag, tr.operationSum),
      instrument: tr.operationCurrency
    }
  }
  return movement
}

function parseCash (transaction, tr) {
  if (tr.comment.indexOf('Пополнение счета') >= 0 || tr.comment.indexOf('Снятие наличных') >= 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: tr.operationCurrency,
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(tr.debitFlag, tr.operationSum),
      fee: Math.abs(parseFloat(tr.fee) * 100) / 100
    })
    return true
  } else {
    return false
  }
}

function parsePayee (transaction, tr) {
  transaction.comment = tr.comment
  // интернет-платежи отображаем без получателя
  if (!tr.place) {
    return false
  }

  tr.place = tr.place.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
  let data = tr.place.split('/')
  var mcc = null
  var fullTitle = null
  if (data.length === 0 ||
    (data[0] === '' && data[1] === '')) {
    return false
  }
  switch (data.length) {
    case 1:
      fullTitle = tr.place
      break
    case 2:
      mcc = Number.parseInt(data[1])
      fullTitle = data[0].trim()
      break
    case 3:
      mcc = Number.parseInt(data[2])
      fullTitle = data[0].trim() + '/' + data[1].trim()
  }
  transaction.merchant = {
    mcc: mcc,
    location: null,
    fullTitle: fullTitle
  }
  return true
}

function getSumAmount (debitFlag, strAmount) {
  const amount = Number.parseFloat(strAmount.replace(/\s/g, ''))
  return debitFlag === '+' ? amount : -amount
}

function getDate (str) {
  const [day, month, year] = str.match(/(\d{2}).(\d{2}).(\d{4})/).slice(1)
  return new Date(`${year}-${month}-${day}T00:00:00+03:00`)
}

export function getFullDate (str) {
  const [day, month, year, hour, minute, second] = str.match(/(\d{2}).(\d{2}).(\d{4}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}
