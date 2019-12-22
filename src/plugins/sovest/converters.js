export function convertAccount (json) {
  const cardNumber = json.cardNumber
  const account = {
    id: 'CLIENT_ID_' + json.clientId,
    type: 'ccard',
    title: 'Совесть',
    instrument: 'RUB',
    balance: json.amount,
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
    income: json.txnType === 3 || json.txnType === 7 ? json.txnAmount : 0, // 3 - поступление, 7 - кешбек
    incomeAccount: accounts[0].id,
    outcome: json.txnType === 2 ? json.txnAmount : 0, // 2 - списание
    outcomeAccount: accounts[0].id,
    payee: json.partnersName,
    date: new Date(json.txnDate)
  }
  if (!transaction.hold) {
    transaction.id = json.txnId
  }
  return transaction
}
