export function convertAccount (account, type) {
  const accountData = {}
  switch (type) {
    // кредитные карты
    case 'CreditCard': // MyCredit
    case 'creditCards': // Base
      accountData.account = convertCard(account)
      break

      // карты рассрочки
    case 'CreditCardTW': // MyCredit
    case 'merchantCards': // Base
      accountData.account = convertCardTW(account)
      break

      // дебетовые карты
    case 'debitCards': // Base
      accountData.account = convertCard(account)
      break

      // кредиты
    case 'CreditLoan': // MyCredit
    case 'credits': // Base
      accountData.account = convertLoan(account)
      break

      // депозиты
    case 'deposits': // Base
    default:
      break
  }
  accountData.details = getAccountDetails(account, type)
  return accountData
}

function getAccountDetails (account, type) {
  return {
    type: type,
    title: account.productName || account.ProductName,
    accountNumber: account.accountNumber || account.AccountNumber,
    cardNumber: account.cardNumber || account.mainCardNumber || account.CardNumber || account.MainCardNumber,
    contractNumber: account.ContractNumber || account.contractNumber
  }
}

function convertCard (account) {
  const cardNumber = account.cardNumber || account.mainCardNumber || account.CardNumber || account.MainCardNumber
  const result = {
    id: account.contractNumber || account.ContractNumber,
    type: 'ccard',
    syncID: cardNumber.substr(-4),
    title: account.productName || account.ProductName,
    instrument: account.currency || 'RUB'
  }
  const creditLimit = account.creditLimit || account.CreditLimit
  const availableBalance = account.availableBalance || account.AvailableBalance
  if (creditLimit) {
    result.creditLimit = creditLimit
    result.balance = Math.round((availableBalance - creditLimit) * 100) / 100
  } else if (availableBalance) {
    result.balance = availableBalance
  } else {
    result.balance = 0
  }
  return result
}

function convertCardTW (account) {
  // console.log(">>> Конвертация карты рассрочки: ", account);
  const result = {
    id: account.contractNumber || account.ContractNumber,
    type: 'ccard',
    syncID: (account.accountNumber || account.AccountNumber).substr(-4),
    title: account.productName || account.ProductName,
    instrument: account.currency || 'RUB'
  }
  const creditLimit = account.creditLimit || account.CreditLimit
  const availableBalance = account.availableBalance || account.AvailableBalance
  if (creditLimit) {
    result.creditLimit = creditLimit
    result.balance = Math.round((availableBalance - creditLimit) * 100) / 100
  } else if (availableBalance) {
    result.balance = availableBalance
  } else {
    result.balance = 0
  }
  return result
}

function convertLoan (account) {
  const contractNumber = account.contractNumber || account.ContractNumber
  const res = {
    id: contractNumber,
    type: 'loan',
    syncID: contractNumber.substr(-4),
    title: account.productName || account.ProductName,
    instrument: 'RUB'
  }

  if (account.DateSign) {
    // MyCredit
    res.startDate = account.DateSign
    res.startBalance = account.CreditAmount
    res.endDateOffset = account.Contract.Properties.PaymentNum
    res.endDateOffsetInterval = 'month'
    res.capitalization = true
    res.percent = 0.1
    res.payoffStep = 1
    res.payoffInterval = 'month'
    // res.balance = Math.round((-account.RepaymentAmount + account.AccountBalance) * 100) / 100;
    if (account.RepaymentAmount) res.balance = -account.RepaymentAmount
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

export function convertTransactions (accountData, transactions) {
  const result = []
  transactions.forEach(transaction => {
    // дополнительная логика для счетов кредитов
    let credit = false
    if (['CreditLoan', 'credits'].indexOf(accountData.details.type) + 1) {
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
    if (transaction.mcc) { tran.mcc = getMcc(transaction.mcc) }

    result.push(tran)
  })
  return result
}

export function getMcc (code) {
  switch (code) {
    case 'CAR':
      return 5542
    case 'HEALTH & BEAUTY':
      return 7298
    case 'FOOD':
      return 5411
    case 'CAFES & RESTAURANTS':
      return 5812
    case 'CLOTHING SHOES & ACCESSORIES':
      return 5651

    case 'OTHER':
    case 'HOBBY & LEISURE':
    case 'HOME & GARDEN':
    case 'TRANSPORTATION':
    case 'TELECOMMUNICATION':
    case 'UTILITY BILLS':
      return null

    default: {
      console.log('>>> Новый МСС код !!!', code)
      return null
    }
  }
}
