export function convertAccount (apiAccount) {
  switch (apiAccount.accountType) {
    case 2:
      return getCard(apiAccount)
    default:
      console.log('Не известный тип счёта: ', apiAccount)
      throw new Error('Не известный тип счёта')
  }
}

function getCard (apiAccount) {
  const account = {
    id: apiAccount.cardAccountId.toString(),
    title: apiAccount.clientLabel || apiAccount.name,
    type: 'ccard',
    syncID: apiAccount.cards.map(card => card.cardNumber.substr(-4)),
    creditLimit: apiAccount.mainCreditLimit,
    instrument: getInstrument(apiAccount.currency.nameIso),
    available: apiAccount.availableBalance,
    _type: apiAccount.accountType
  }

  if (apiAccount.closeDate) {
    account.archive = true
  }

  return account
}

export function convertTransaction (apiTransaction, account) {
  if (!account) {
    // пропускаем операцию по не существующему счёту
    return null
  }

  // игнор операций по кредитам
  if (apiTransaction.ground && /.*(?:выдача кредита|погашение основного долга).*/i.test(apiTransaction.ground)) {
    return null
  }

  const movement = getMovement(apiTransaction, account)
  if (!movement) { return null }

  const transaction = {
    date: new Date(apiTransaction.transactionDate),
    movements: [ movement ],
    merchant: null,
    comment: null,
    hold: !apiTransaction.isProcessed
  };

  [
    parseComment
  ].some(parser => parser(transaction, apiTransaction))

  /* if (apiTransaction.mcc) {
    const mcc = parseInt(apiTransaction.mcc)
    if (mcc) {
      transaction.mcc = mcc
    }
  } */

  return transaction
}

function getMovement (apiTransaction, account) {
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: apiTransaction.transactionSum,
    fee: 0
  }

  return movement
}

// расчёт комментария
function parseComment (transaction, apiTransaction) {
  if (!apiTransaction.ground) { return false }
  const ground = /^(?:\d{4,}\.+\d{4,})?\s*(.*)/i.exec(apiTransaction.ground)
  if (ground) {
    transaction.comment = ground[1]
  }
}

function getInstrument (instrument) {
  switch (instrument) {
    case 'RUR':
      return 'RUB'
    default:
      return instrument
  }
}
