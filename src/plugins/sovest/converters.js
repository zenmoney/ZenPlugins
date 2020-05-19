export function convertAccount (json) {
  const cardNumber = json.cardNumber
  const account = {
    id: 'CLIENT_ID_' + json.clientId,
    type: 'ccard',
    title: 'Совесть',
    instrument: 'RUB',
    balance: json.amount - json.limit,
    creditLimit: json.limit,
    syncID: []
  }

  if (cardNumber) {
    account.syncID.push(cardNumber.slice(-4))
  }
  return account
}

// 3 - пополнение(приход), 7 - кешбек
// 2 - обычное списание, 10 - перевод(расход), 9 - комиссия, 1 - штраф, 6 - вывод собственных средств
export function convertTransaction (apiTransaction, accounts) {
  const transaction = {
    comment: null,
    date: new Date(apiTransaction.txnDate),
    hold: apiTransaction.txnStatus === 1,
    merchant: null,
    movements: [
      {
        id: (apiTransaction.txnId && apiTransaction.txnId.toString()) || null,
        account: { id: accounts[0].id },
        invoice: null,
        sum: Math.round(parseFloat(apiTransaction.txnAmount) * 100) / 100,
        fee: 0
      }
    ]
  };
  [
    parseCashTransfer,
    parseOuterTransfer,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, accounts[0]))
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, account) {
  if (apiTransaction.txnType === 8) {
    transaction.movements[0].sum = -transaction.movements[0].sum
    transaction.movements.push({
      id: null,
      account: {
        type: 'cash',
        instrument: account.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -transaction.movements[0].sum,
      fee: 0
    })
    return true
  }
  return false
}

function parseOuterTransfer (transaction, apiTransaction, account) {
  if ([3, 6, 10].indexOf(apiTransaction.txnType) >= 0) {
    if ([6, 10].indexOf(apiTransaction.txnType) >= 0) {
      transaction.movements[0].sum = -transaction.movements[0].sum
    } else {
      transaction.comment = apiTransaction.partnersName === 'Пополнение'
        ? null
        : apiTransaction.partnersName
      if (apiTransaction.partnersName.indexOf('Возврат') >= 0) {
        return true
      }
    }
    transaction.movements.push({
      id: null,
      account: {
        type: 'ccard',
        instrument: account.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -transaction.movements[0].sum,
      fee: 0
    })
    return true
  }
  return false
}

function parseComment (transaction, apiTransaction, account) {
  if ([1, 7, 9].indexOf(apiTransaction.txnType) >= 0) {
    if ([1, 9].indexOf(apiTransaction.txnType) >= 0) {
      transaction.movements[0].sum = -transaction.movements[0].sum
    }
    transaction.comment = apiTransaction.partnersName
    return true
  }
  return false
}

function parsePayee (transaction, apiTransaction, account) {
  if (apiTransaction.txnType === 2) {
    transaction.movements[0].sum = -transaction.movements[0].sum
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.partnersName,
      mcc: null,
      location: null
    }
    return true
  }
  return false
}
