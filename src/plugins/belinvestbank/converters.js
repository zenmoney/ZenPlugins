function parseAmount (str) {
  if (!str && str !== 0) return null
  const s = String(str).replace(/\s/g, '')
  if (s === '') return null
  const n = Number.parseFloat(s)
  return isNaN(n) ? null : n
}

export function convertAccount (json) {
  const freeAmt = parseAmount(json.freeAmt) ?? 0
  const availableAmt = parseAmount(json.availableAmt) ?? 0
  const overdraftAmt = parseAmount(json.overdraftAmt) ?? 0
  const isCredit = json.isOverdraft || json.isCredit

  let balance, creditLimit
  if (isCredit) {
    // Credit card: balance = available - limit (negative means debt)
    balance = availableAmt - overdraftAmt
    creditLimit = availableAmt
  } else {
    balance = freeAmt !== 0 ? freeAmt : (parseAmount(json.balance) ?? 0)
    creditLimit = Math.max(0, availableAmt - freeAmt)
  }

  return {
    id: json.id,
    type: 'card',
    title: json.finalName + '*' + json.num.slice(-4),
    instrument: json.currency,
    balance: Math.round(balance * 100) / 100,
    creditLimit: Math.round(creditLimit * 100) / 100,
    syncID: [json.num.slice(-4)]
  }
}

export function patchAccountFromSummary (account, summaryData) {
  if (!summaryData) return account
  // Only patch if payments/index returned no balance info
  if (account.balance !== 0 || account.creditLimit !== 0) return account
  const overdraftAmt = parseAmount(summaryData.overdraftSum) ?? 0
  const availableAmt = parseAmount(summaryData.availableSum) ?? 0
  const freeAmt = parseAmount(summaryData.freeSum) ?? 0
  if (overdraftAmt > 0) {
    // Credit card fallback: use availableSum - overdraftSum (settled balance only)
    return {
      ...account,
      balance: Math.round((availableAmt - overdraftAmt) * 100) / 100,
      creditLimit: Math.round(overdraftAmt * 100) / 100
    }
  }
  const bal = freeAmt || availableAmt
  return bal !== 0 ? { ...account, balance: Math.round(bal * 100) / 100 } : account
}

export function convertTransaction (json, account) {
  if ((json.status !== 'ПРОВЕДЕНО' && json.status !== 'ЗАБЛОКИРОВАНО') || json.accountAmt === '') {
    return null
  }

  const sum = getSumAmount(json)
  if (sum === 0) return null

  const transaction = {
    date: getDate(json.date),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum,
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

  if (json.mcc) {
    transaction.comment = transaction.comment
      ? `${transaction.comment} | MCC: ${json.mcc}`
      : `MCC: ${json.mcc}`
  }

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
    transaction.merchant.city = merchant[1].split(/\s+/)[0].trim() || null
    transaction.merchant.country = country || null
    transaction.merchant.title = merchant[0]
    if (merchant[0] === 'SMS OPOVESCHENIE') {
      transaction.comment = merchant[0]
      transaction.merchant = null
    }
  } else if (merchant.length === 3) {
    transaction.merchant.city = merchant[1] + merchant[2].split(' ')[0].trim()
    transaction.merchant.country = merchant[2].slice(-3).trim()
    transaction.merchant.title = merchant[0].trim()
    if (merchant[0] === 'SMS OPOVESCHENIE') {
      transaction.comment = merchant[0]
      transaction.merchant = null
    }
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + json.cardAcceptor)
  }
}

function getSumAmount (json) {
  const amountAccount = Number.parseFloat(json.accountAmt.replace(',', '.').replace(' ', ''))
  const amountReflected = Number.parseFloat(json.reflectedAccountAmt?.replace(',', '.').replace(' ', ''))
  const amountTransaction = Number.parseFloat(json.transactionAmt?.replace(',', '.').replace(' ', ''))
  let amount
  if (amountAccount === 0 && !isNaN(amountReflected) && amountReflected !== 0) {
    amount = amountReflected
  } else if (amountAccount === 0 && !isNaN(amountTransaction) && amountTransaction !== 0) {
    amount = amountTransaction
  } else {
    amount = amountAccount
  }
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
