import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (json) {
  if (json.cards && json.cards.length > 0) { // only loading card accounts
    const account = {
      id: json.cardAccountNumber,
      type: 'card',
      instrument: codeToCurrencyLookup[json.currency],
      instrumentCode: json.currency,
      balance: Number.parseFloat(json.balance.replace(',', '.').replace(/\s/g, '')),
      syncID: [],
      productType: json.productName,
      cardHash: json.cards[0].cardHash,
      bankCode: json.bankCode,
      accountType: json.accountType,
      rkcCode: json.rkcCode
    }

    for (const el of json.cards) {
      account.syncID.push(el.cardNumberMasked.slice(-4))
    }

    if (!account.title) {
      account.title = json.productName + '*' + account.syncID[0]
    }

    return account
  }
  return null
}

export function convertTransaction (json) {
  if (json.sum === 0 || isNaN(json.sum)) {
    return null
  }
  const transaction = {
    date: json.date,
    movements: [getMovement(json)],
    merchant: null,
    comment: null,
    hold: false
  };
  [
    parsePayee
  ].some(parser => parser(transaction, json))

  return transaction
}

function getMovement (json) {
  return {
    id: null,
    account: { id: json.account_id },
    invoice: null,
    sum: json.sum,
    fee: 0
  }
}

function parsePayee (transaction, json) {
  // интернет-платежи отображаем без получателя
  if (!json.merchant ||
    json.merchant.indexOf('BANK RESHENIE- OPLATA USLUG') >= 0) {
    return false
  }
  transaction.merchant = {
    mcc: null,
    location: null
  }
  const merchant = json.merchant.replace(/&quot;/g, '"').split(';').map(str => str.trim())
  if (merchant.length === 1) {
    transaction.merchant.title = merchant[0]
    transaction.merchant.city = null
    transaction.merchant.country = null
  } else if (merchant.length === 3) {
    transaction.merchant.title = merchant[0]
    transaction.merchant.city = merchant[1].trim()
    transaction.merchant.country = merchant[2].trim()
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + json.merchant)
  }
}

export function getDate (str) {
  const [year, month, day, hour, minute, second] = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}

export function transactionsUnique (array) {
  const a = array.concat()
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i].date.getFullYear() === a[j].date.getFullYear() &&
        a[i].date.getMonth() === a[j].date.getMonth() &&
        a[i].date.getDate() === a[j].date.getDate() &&
        a[i].currencyCode === a[j].currencyCode &&
        a[i].sum === a[j].sum &&
        a[i].merchant.indexOf(a[j].merchant) >= 0 &&
        a[i].account_id === a[j].account_id) {
        a.splice(j--, 1)
      }
    }
  }
  return a
}
