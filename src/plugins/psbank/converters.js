export function convertAccount (apiAccount) {
  switch (apiAccount.accountType) {
    case 1: // накопительные счета
      return getAccount(apiAccount)
    case 2: // карты
      return getCard(apiAccount)
    default:
      console.log('Не известный тип счёта: ', apiAccount)
      throw new Error('Не известный тип счёта')
  }
}

export function convertLoan (apiLoan) {
  return {
    id: apiLoan.contractId.toString(),
    title: apiLoan.name,
    syncID: apiLoan.loanAccount.number.substr(-4),
    instrument: getInstrument(apiLoan.loanAccount.currency.nameIso),
    type: 'loan',
    _type: 'loan',
    balance: -apiLoan.remainedMainDebtSum,
    startBalance: -apiLoan.issueSum,
    capitalization: true, // TODO Требует анализа на разных типах кредитов
    percent: apiLoan.interestRate,
    startDate: apiLoan.beginDate,
    endDateOffset: apiLoan.lengthMonths, // Длина кредита от старта
    endDateOffsetInterval: 'month',
    payoffStep: 1, // TODO не найдено, считаем по умолчанию
    payoffInterval: 'month', // TODO не найдено, считаем по умолчанию
    repaymentAccount: apiLoan.repaymentAccount.number // привязанный счет для списаний
  }
}

function getAccount (apiAccount) {
  return {
    id: apiAccount.accountId.toString(),
    title: apiAccount.clientLabel || apiAccount.name,
    type: 'checking',
    syncID: apiAccount.number.substr(-4),
    instrument: getInstrument(apiAccount.currency.nameIso),
    balance: apiAccount.balance,
    _type: apiAccount.accountType
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
  // if (apiTransaction.ground && /.*(?:выдача кредита|погашение основного долга).*/i.test(apiTransaction.ground)) {
  //  return null
  // }

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
