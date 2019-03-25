export function convertAccount (json) {
  if (json.cards && json.cards.length > 0 &&
    json.cardAccounts && json.cardAccounts.length > 0) { // only loading card accounts
    const account = {
      id: json.accountId,
      type: 'card',
      title: json.description,
      instrument: json.cards[0].cardCurr,
      balance: Number.parseFloat(json.avlBalance),
      syncID: [json.cardAccounts[0].accountId, json.cards[0].pan.slice(-4)],
      productType: json.productType
    }

    if (json.avlLimit) {
      account.creditLimit = Number.parseFloat(json.avlLimit)
    }

    if (!account.title) {
      account.title = '*' + account.syncID[0]
    }

    return account
  } else {
    return null
  }
}

export function convertTransaction (json, accounts) {
  const account = accounts.find(account => {
    return account.syncID.indexOf(json.accountId) !== -1
  })

  const transAmount = Number.parseFloat(json.transAmount)

  const transaction = {
    hold: json.status !== 'T',
    income: json.debitFlag === '1' ? transAmount : 0,
    incomeAccount: account.id,
    outcome: json.debitFlag === '0' ? transAmount : 0,
    outcomeAccount: account.id,
    date: new Date(json.transDate),
    payee: json.place
  }

  if (account.instrument !== json.curr) {
    const amount = Number.parseFloat(json.amount)

    if (json.debitFlag === '1') {
      transaction.opIncome = amount
      transaction.opIncomeInstrument = json.curr
    } else {
      transaction.opOutcome = amount
      transaction.opOutcomeInstrument = json.curr
    }
  }

  return transaction
}
