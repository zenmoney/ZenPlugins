export function convertAccount (json) {
  const account = {
    id: json.id,
    type: 'card',
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

export function convertTransaction (json) {
  return {
    hold: json.type !== 'TRANSACTION',
    date: new Date(json.operationTime),
    movements: [
      {
        id: json.id || null,
        account: { id: json.relationId },
        invoice: json.accountAmount.currency.shortName === json.amount.currency.shortName ? null : {
          sum: json.amount.value,
          instrument: json.amount.currency.shortName
        },
        sum: json.accountAmount.value,
        fee: 0
      }
    ],
    merchant: json.description ? {
      fullTitle: json.description,
      mcc: null,
      location: null
    } : null,
    comment: null
  }
}
