export function convertAccount (json) {
  const account = {
    id: json.id,
    title: json.product,
    instrument: json.currency.shortName,
    balance: json.accountBalance.value,
    creditLimit: 0,
    syncID: []
  }
  if (json.pan) {
    account.syncID.push(json.pan.slice(-4))
  }
  if (json.cba) {
    account.syncID.push(json.cba.slice(-4))
  }
  if (json.moneyAmount && json.moneyAmount.value > json.accountBalance.value) {
    account.creditLimit = json.moneyAmount.value - json.accountBalance.value
  }
  if (!account.title) {
    account.title = '*' + account.syncID[0]
  }
  return account
}

export function convertTransaction (json, accounts) {
  const transaction = {
    hold: json.type !== 'TRANSACTION',
    income: json.accountAmount.value > 0 ? json.accountAmount.value : 0,
    incomeAccount: json.relationId,
    outcome: json.accountAmount.value < 0 ? -json.accountAmount.value : 0,
    outcomeAccount: json.relationId,
    date: new Date(json.operationTime)
  }
  if (!transaction.hold) {
    transaction.id = json.id
  }
  if (json.accountAmount.currency.shortName !== json.amount.currency.shortName) {
    if (json.amount.value > 0) {
      transaction.opIncome = json.amount.value
      transaction.opIncomeInstrument = json.amount.currency.shortName
    } else {
      transaction.opOutcome = -json.amount.value
      transaction.opOutcomeInstrument = json.amount.currency.shortName
    }
  }
  return transaction
}
