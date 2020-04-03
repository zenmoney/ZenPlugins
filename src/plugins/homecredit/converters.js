import _ from 'lodash'

export function convertAccount (apiAccount, type) {
  const accountData = {}
  switch (type) {
    // кредитные карты
    case 'CreditCard': // MyCredit
    case 'creditCards': // Base
      accountData.account = convertCard(apiAccount)
      break

    // карты рассрочки
    case 'CreditCardTW': // MyCredit
    case 'merchantCards': // Base
      accountData.account = convertCard(apiAccount)
      break

    // дебетовые карты
    case 'debitCards': // Base
      accountData.account = convertCard(apiAccount)
      break

    // кредиты
    case 'CreditLoan': // MyCredit
    case 'credits': // Base
      accountData.account = convertLoan(apiAccount)
      break

    // депозиты
    case 'deposits': // Base
      accountData.account = convertSavingsAccount(apiAccount)
      break
    default:
      break

    // дебетовые счета в MyCredit
    case 'accounts':
      // счёт кредитов пропускаем, так как "Мой кредит" выдаёт кредиты отдельно
      if (apiAccount.accountType === 'CREDIT') {
        return null
      }

      accountData.account = convertAccountMyCredit(apiAccount)
      break
  }
  accountData.details = getAccountDetails(apiAccount, type)
  return accountData
}

function getAccountDetails (apiAccount, type) {
  return {
    type: type,
    title: apiAccount.productName || apiAccount.ProductName || apiAccount.accountName || apiAccount.AccountName || apiAccount.depositName,
    accountNumber: getAccountNumber(apiAccount),
    cardNumber: getCardNumber(apiAccount),
    contractNumber: getContractNumber(apiAccount)
  }
}

function getCardNumber (apiAccount) {
  return apiAccount.cardNumber || apiAccount.mainCardNumber || // BaseApp
    apiAccount.CardNumber || apiAccount.MainCardNumber || // MyCredit
    apiAccount.maskCardNumber // MyCreditDebit v2
}

function getAccountNumber (apiAccount) {
  return apiAccount.accountNumber || // BaseApp
    apiAccount.AccountNumber // MyCredit
}

function getContractNumber (apiAccount) {
  return apiAccount.contractNumber || // BaseApp
    apiAccount.ContractNumber // MyCredit
}

function getInstrument (code) {
  if (!code || code === 'RUR') { return 'RUB' }
  return code
}

function convertAccountMyCredit (apiAccount) {
  const result = {
    id: getAccountNumber(apiAccount),
    type: 'checking',
    syncID: [getAccountNumber(apiAccount).substr(-4)],
    title: apiAccount.accountName,
    instrument: getInstrument(apiAccount.currency)
  }

  if (apiAccount.runningBalance) { result.balance = apiAccount.runningBalance }

  return result
}

function convertCard (apiAccount) {
  const result = {
    id: getContractNumber(apiAccount),
    type: 'ccard',
    syncID: [getAccountNumber(apiAccount).substr(-4)],
    title: apiAccount.productName || apiAccount.ProductName,
    instrument: getInstrument(apiAccount.currency)
  }

  // Добавим syncID карты
  const cardNumber = getCardNumber(apiAccount)
  if (cardNumber) {
    result.syncID = _.union(result.syncID, [cardNumber.substr(-4)])
  }

  // определим остаток на карте
  const creditLimit = apiAccount.creditLimit || apiAccount.CreditLimit
  const availableBalance = apiAccount.availableBalance || apiAccount.AvailableBalance
  const totalBalance = apiAccount.balance || apiAccount.Balance || -apiAccount.TotalIndebtedness
  if (creditLimit) {
    result.creditLimit = creditLimit
  }
  if (availableBalance) {
    result.available = availableBalance
  } else if (totalBalance) {
    result.balance = totalBalance
  }
  return result
}

/* function convertCardTW (apiAccount) {
  // console.log(">>> Конвертация карты рассрочки: ", account);
  const result = {
    id: apiAccount.contractNumber || apiAccount.ContractNumber,
    type: 'ccard',
    syncID: [ getAccountNumber(apiAccount).substr(-4) ],
    title: apiAccount.productName || apiAccount.ProductName,
    instrument: getInstrument(apiAccount.currency)
  }

  // Добавим syncID карты
  const cardNumber = getCardNumber(apiAccount)
  if (cardNumber) {
    result.syncID.concat(cardNumber).unique()
  }

  // определим остаток на карте
  const creditLimit = apiAccount.creditLimit || apiAccount.CreditLimit
  const availableBalance = apiAccount.availableBalance || apiAccount.AvailableBalance || apiAccount.balance || apiAccount.Balance
  if (creditLimit) {
    result.creditLimit = creditLimit
    result.balance = Math.round((availableBalance - creditLimit) * 100) / 100
  } else if (availableBalance) {
    result.balance = availableBalance
  } else {
    result.balance = 0
  }
  return result
} */

function convertLoan (apiAccount) {
  // console.log('>>> Конвертер кредита: ', apiAccount)
  const res = {
    id: getContractNumber(apiAccount),
    type: 'loan',
    syncID: [getContractNumber(apiAccount).substr(-4)],
    title: apiAccount.productName || apiAccount.ProductName,
    instrument: 'RUB'
  }

  if (apiAccount.DateSign) {
    // MyCredit
    res.startDate = apiAccount.DateSign
    res.startBalance = apiAccount.CreditAmount
    res.endDateOffset = apiAccount.Contract.Properties.PaymentNum
    res.endDateOffsetInterval = 'month'
    res.capitalization = true
    res.percent = 0.1
    res.payoffStep = 1
    res.payoffInterval = 'month'
    // res.balance = Math.round((-account.RepaymentAmount + account.AccountBalance) * 100) / 100;
    if (apiAccount.RepaymentAmount) res.balance = -apiAccount.RepaymentAmount
  } else {
    // Base (заглушка)
    res.startDate = Date.now()
    res.startBalance = 0
    res.endDateOffset = 1
    res.endDateOffsetInterval = 'month'
    res.capitalization = true
    res.percent = 0.1
    res.payoffStep = 1
    res.payoffInterval = 'month'
    res.balance = 0
  }

  return res
}

function convertSavingsAccount (apiAccount) {
  // console.log('>>> Конвертер кредита: ', apiAccount)
  const res = {
    id: getContractNumber(apiAccount),
    type: 'checking',
    syncID: [getContractNumber(apiAccount).substr(-4), apiAccount.accountNumber.substr(-4)],
    title: apiAccount.depositName + ' ' + apiAccount.depositType + ' (' + apiAccount.accountNumber + ')',
    instrument: apiAccount.currency,
    balance: apiAccount.runningBalance
  }
  return res
}

export function convertTransactions (accountData, transactions) {
  if (!transactions) {
    return []
  }

  const result = []
  transactions.forEach(transaction => {
    const tran = convertTransaction(accountData, transaction)
    result.push(tran)
  })
  return result
}

export function convertTransaction (accountData, transaction) {
  // дополнительная логика для счетов кредитов
  let credit = false
  if (accountData.details && ['CreditLoan', 'credits'].indexOf(accountData.details.type) + 1) {
    if (!transaction.creditDebitIndicator) {
      // списания по основному долгу на счетах кредитов пропускаем
      if (transaction.shortDescription.indexOf('основного долга') + 1) { return }
    } else {
      // поступление на счёт кредита записываем в минус
      if (transaction.shortDescription.indexOf('Выдача кредита') + 1) { transaction.creditDebitIndicator = false }
    }
    credit = true
  }

  const tran = {
    id: transaction.movementNumber,
    hold: transaction.postingDate === null,
    income: transaction.creditDebitIndicator ? transaction.amount : 0,
    incomeAccount: accountData.account.id,
    outcome: transaction.creditDebitIndicator ? 0 : transaction.amount,
    outcomeAccount: accountData.account.id,
    date: new Date(transaction.valueDate.time || transaction.valueDate),
    payee: transaction.merchantName || transaction.merchant.trim()
  }
  if (transaction.creditDebitIndicator || credit) { tran.comment = transaction.shortDescription }

  if (transaction.mcc) {
    if (transaction.mcc === 'ATM CASH WITHDRAWAL') {
      tran.income = tran.outcome
      tran.incomeAccount = transaction.payCurrency ? 'cash#' + transaction.payCurrency : 'cash'
    } else {
      tran.mcc = getMcc(transaction.mcc)
    }
  }

  return tran
}

export function getMcc (code) {
  switch (code) {
    case 'CAR':
    case 'GAS STATION':
      return 5542
    case 'HEALTH & BEAUTY':
      return 7298
    case 'FOOD':
      return 5411
    case 'CAFES & RESTAURANTS':
      return 5812
    case 'CLOTHING SHOES & ACCESSORIES':
      return 5651
    case 'PHARMACY':
      return 5912

    case 'EDUCATION':
    case 'ELECTRONICS':
    case 'JEWELRY':
    case 'KIDS':
    case 'OTHER':
    case 'HOBBY & LEISURE':
    case 'HOME & GARDEN':
    case 'PETS':
    case 'PUBLIC TRANSPORTATION':
    case 'TAXES & CHARGES':
    case 'TRAVEL':
    case 'TRANSPORTATION':
    case 'TELECOMMUNICATION':
    case 'UTILITY BILLS':
      return null

    default: {
      console.log('>>> !!! Новый МСС код: ', code)
      return null
    }
  }
}
