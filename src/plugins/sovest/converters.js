export function convertAccount (json) {
  const cardNumber = json.cardNumber
  const account = {
    id: 'CLIENT_ID_' + json.clientId,
    type: 'ccard',
    title: 'Совесть',
    instrument: 'RUB',
    balance: json.balance - (json.limit - json.amount),
    creditLimit: json.limit,
    syncID: []
  }

  if (cardNumber) {
    account.syncID.push(cardNumber.slice(-4))
  }
  return account
}

export function convertTransaction (json, accounts) {
  const transaction = {
    hold: json.txnType === 1,
    income: [3, 7].indexOf(json.txnType) !== -1 ? json.txnAmount : 0, // 3 - пополнение, 7 - кешбек
    incomeAccount: accounts[0].id,
    outcome: [2, 10].indexOf(json.txnType) !== -1 ? json.txnAmount : 0, // 2 - обычное списание, 10 - перевод
    outcomeAccount: accounts[0].id,
    payee: [3, 7, 10].indexOf(json.txnType) !== -1 ? '' : json.partnersName,
    comment: [3, 7, 10].indexOf(json.txnType) !== -1 ? json.partnersName : '',
    date: new Date(json.txnDate)
  }
  if (!transaction.hold) {
    transaction.id = json.txnId
  }
  return transaction
}
