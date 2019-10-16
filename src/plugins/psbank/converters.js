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
    _contract: apiLoan.loanAccount.name,
    _bankname: apiLoan.loanAccount.office.briefName + ' ' + apiLoan.loanAccount.office.branch.bank.briefName
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

export function convertTransaction (apiTransaction, account, lTransactions = {}) {
  if (!account) {
    // пропускаем операцию по не существующему счёту
    return null
  }
  if (!('request' in apiTransaction)) {
    apiTransaction.request = {}
  }
  let transaction = {
    hold: !apiTransaction.isProcessed,
    date: new Date(apiTransaction.transactionDate),
    comment: parseComment(apiTransaction) || apiTransaction.ground,
    payee: ('senderName' in apiTransaction.request) ? apiTransaction.request.senderName : (lTransactions[apiTransaction.request.requestId] ? lTransactions[apiTransaction.request.requestId].bankname : null),
    id: null,
    income: apiTransaction.transactionSum > 0 ? apiTransaction.transactionSum : (lTransactions[apiTransaction.request.requestId] ? -apiTransaction.transactionSum : 0),
    incomeAccount: apiTransaction.transactionSum > 0 ? account.id : (lTransactions[apiTransaction.request.requestId] ? lTransactions[apiTransaction.request.requestId].id : account.id),

    outcome: apiTransaction.transactionSum < 0 ? -apiTransaction.transactionSum : (lTransactions[apiTransaction.request.requestId] ? apiTransaction.transactionSum : 0),
    outcomeAccount: apiTransaction.transactionSum < 0 ? account.id : (lTransactions[apiTransaction.request.requestId] ? lTransactions[apiTransaction.request.requestId].id : null),
    invoice: lTransactions[apiTransaction.request.requestId] ? lTransactions[apiTransaction.request.requestId].contract : null,
    fee: 0
  }
  // TODO Требуется более точный идентификатор для процентов. На текущий момент в API банка соответствующих признаков нет.
  if (apiTransaction.ground && /.*(?:Погашение начисленных процентов).*/i.test(apiTransaction.ground)) {
    transaction.income = 0
    transaction.incomeAccount = transaction.outcomeAccount
  }
  /* if (apiTransaction.mcc) {
      const mcc = parseInt(apiTransaction.mcc)
      if (mcc) {
        transaction.mcc = mcc
      }
    } */
  return transaction
}

// расчёт комментария
function parseComment (apiTransaction) {
  if (!apiTransaction.ground) { return false }
  const ground = /^(?:\d{4,}\.+\d{4,})?\s*(.*)/i.exec(apiTransaction.ground)
  if (ground) {
    return ground[1]
  } else {
    return null
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
