import { isArray } from 'lodash'

export function convertAccount (account, initialized) {
  switch (account.accountType) {
    case 'Current': // дебетовые карты
    case 'CurrentKids': // Tinkoff Jr.
      return getDebitCard(account, initialized)
    case 'Credit': return getCreditCard(account, initialized) // кредитные карты
    case 'Saving': return getSavingAccount(account) // накопительные счета
    case 'Deposit': return getDepositAccount(account) // вклады
    case 'MultiDeposit': return getMultiDepositAccount(account) // мультивалютные вклады
    case 'CashLoan': return getCashLoan(account) // кредиты наличными
    case 'KupiVKredit': return getKupiVKreditAccount(account) // потребительские кредиты
    case 'Wallet': return getWalletAccount(account) // виртуальные карты
    case 'Telecom': return getTelecomAccount(account) // телеком-карта
    case 'ExternalAccount': // внешние счета сторонних банков, например
      return null
    default: {
      console.log(`>>> !!! Новый счёт с типом '${account.accountType}':`, account)
      return null
    }
  }
}

export function convertTransaction (apiTransaction, accountId) {
  const tran = {}

  // дата привязана к часовому поясу Москвы
  const dt = new Date(apiTransaction.operationTime.milliseconds + (180 + new Date().getTimezoneOffset()) * 60000)
  tran.date = dt.getFullYear() + '-' + n2(dt.getMonth() + 1) + '-' + n2(dt.getDate())
  tran.time = n2(dt.getHours()) + ':' + n2(dt.getMinutes() + 1) + ':' + n2(dt.getSeconds()) // для внутреннего использования
  tran.created = apiTransaction.operationTime.milliseconds

  // Внутренний ID операции
  /* const tranId = transaction.payment && transaction.payment.paymentId
        // если есть paymentId, объединяем по нему, отделяя комиссии от переводов
        ? (transaction.group === "CHARGE" ? "f" : "p") + transaction.payment.paymentId
        // либо работаем просто как с операциями, разделяя их на доходы и расходы
        : transaction.id; */

  // отделяем акцепт от холда временем дебетового списания
  tran.id = apiTransaction.debitingTime ? apiTransaction.id : 'tmp#' + apiTransaction.id
  tran.hold = getTransactionHoldStatus(apiTransaction)

  // флаг операции в валюте
  const foreignCurrency = apiTransaction.accountAmount.currency.name !== apiTransaction.amount.currency.name

  // mcc-код операции
  let mcc = apiTransaction.mcc ? parseInt(apiTransaction.mcc, 10) : -1
  if (!mcc) mcc = -1

  // флаг card2card переводов
  const c2c = [6536, 6538, 6012].indexOf(mcc) >= 0

  // доход -------------------------------------------------------------------------
  if (apiTransaction.type === 'Credit') {
    tran.income = apiTransaction.accountAmount.value
    tran.incomeAccount = accountId
    tran.outcome = 0
    tran.outcomeAccount = tran.incomeAccount

    if (apiTransaction.group) {
      switch (apiTransaction.group) {
        // пополнение наличными
        case 'CASH':
          if (!c2c) {
            // операция с наличными
            tran.outcomeAccount = 'cash#' + apiTransaction.amount.currency.name
            tran.outcome = apiTransaction.amount.value
          } else
          // card2card-перевод
          if (apiTransaction.payment && apiTransaction.payment.cardNumber) {
            tran.outcomeAccount = 'ccard#' + apiTransaction.amount.currency.name + '#' + apiTransaction.payment.cardNumber.substring(apiTransaction.payment.cardNumber.length - 4)
            tran.outcome = apiTransaction.amount.value
            tran.hold = null
          }
          break

        case 'INCOME':
          if (c2c && apiTransaction.payment && apiTransaction.payment.cardNumber && apiTransaction.payment.cardNumber.length > 4) {
            tran.outcome = apiTransaction.amount.value
            tran.outcomeAccount = 'ccard#' + apiTransaction.amount.currency.name + '#' + apiTransaction.payment.cardNumber.substring(apiTransaction.payment.cardNumber.length - 4)
          } else if (apiTransaction.senderDetails) {
            tran.payee = apiTransaction.senderDetails
          }
          tran.comment = apiTransaction.description
          break

          // Если совсем ничего не подошло
        default:
          if (apiTransaction.subgroup) {
            switch (apiTransaction.subgroup.id) {
              // перевод от другого клиента банка
              case 'C4':
                tran.payee = apiTransaction.description
                break
              default:
                break
            }
          }

          if (!tran.payee) {
            if (apiTransaction.operationPaymentType === 'TEMPLATE') {
              // наименование шаблона
              tran.comment = apiTransaction.description
            } else {
              tran.comment = ''
              if (apiTransaction.merchant) { tran.comment = apiTransaction.merchant.name + ': ' }
              tran.comment += apiTransaction.description
            }
          } else {
            // если получатель определился, то нет необходимости писать его и в комментарии
            if (apiTransaction.merchant) { tran.comment = apiTransaction.merchant.name }
          }
      }
    } else {
      tran.comment = ''
      if (apiTransaction.merchant) { tran.comment = apiTransaction.merchant.name + ': ' }
      tran.comment += apiTransaction.description
    }

    // операция в валюте
    if (foreignCurrency) {
      tran.opIncome = apiTransaction.amount.value
      tran.opIncomeInstrument = apiTransaction.amount.currency.name
    }
  } else
  // расход -----------------------------------------------------------------
  if (apiTransaction.type === 'Debit') {
    tran.outcome = apiTransaction.accountAmount.value
    tran.outcomeAccount = accountId
    tran.income = 0
    tran.incomeAccount = tran.outcomeAccount

    if (apiTransaction.group) {
      switch (apiTransaction.group) {
        // Снятие наличных
        case 'CASH':
          if (!c2c) {
            // операция с наличными
            tran.incomeAccount = 'cash#' + apiTransaction.amount.currency.name
            tran.income = apiTransaction.amount.value
          } else
          // card2card-перевод
          if (apiTransaction.payment && apiTransaction.payment.cardNumber) {
            tran.incomeAccount = 'ccard#' + apiTransaction.amount.currency.name + '#' + apiTransaction.payment.cardNumber.substring(apiTransaction.payment.cardNumber.length - 4)
            tran.income = apiTransaction.amount.value
          }
          break

          // Перевод
        case 'TRANSFER':
          if (apiTransaction.payment && apiTransaction.payment.fieldsValues) {
            if (apiTransaction.payment.fieldsValues.addressee) { tran.payee = apiTransaction.payment.fieldsValues.addressee } else if (apiTransaction.payment.fieldsValues.lastName) { tran.payee = apiTransaction.payment.fieldsValues.lastName }
          }

          if (apiTransaction.operationPaymentType === 'TEMPLATE') {
            tran.comment = apiTransaction.description // наименование шаблона
          } else {
            tran.comment = ''
            if (apiTransaction.merchant) { tran.comment = apiTransaction.merchant.name + ': ' }
            tran.comment += apiTransaction.description
          }
          break

          // Плата за обслуживание
        case 'CHARGE':
          tran.comment = apiTransaction.description
          break

          // Платеж
        case 'PAY':
          if (apiTransaction.operationPaymentType && apiTransaction.operationPaymentType === 'REGULAR') {
            tran.payee = apiTransaction.brand ? apiTransaction.brand.name : apiTransaction.description
          } else {
            tran.payee = apiTransaction.merchant ? apiTransaction.merchant.name : apiTransaction.description
          }

          // MCC
          if (mcc > 99) {
            tran.mcc = mcc // у Тинькова mcc-коды используются для своих нужд
          }

          break

          // Если совсем ничего не подошло
        default:
          tran.comment = apiTransaction.description
      }
    }

    // операция в валюте
    if (foreignCurrency) {
      tran.opOutcome = apiTransaction.amount.value
      tran.opOutcomeInstrument = apiTransaction.amount.currency.name
    }

    // местоположение
    if (apiTransaction.locations && isArray(apiTransaction.locations) && apiTransaction.locations.length > 0) {
      tran.latitude = apiTransaction.locations[0].latitude
      tran.longitude = apiTransaction.locations[0].longitude
    }
  }

  // кази-кэш
  /* if (mcc === 6051 && tran.payee) {
    const payee = parseOuterAccountData(tran.payee)
    if (payee) {

    } else {
      if (tran.comment) tran.comment += ` (${payee})`
      else tran.commen = tran.payee
    }
  } */

  const hold = tran.hold ? ' [H] ' : ''
  console.log(`>>> Добавляем операцию: ${tran.date}, ${tran.time}, ${hold}${apiTransaction.description}, ${apiTransaction.type === 'Credit' ? '+' : (apiTransaction.type === 'Debit' ? '-' : '')}${apiTransaction.accountAmount.value}`)

  return tran
}

function getTransactionHoldStatus (apiTransaction) {
  return !apiTransaction.debitingTime
}

function transactionParsing (tranId, tran1, tran2) {
  // доходная часть перевода ---
  if (tran2.income > 0 && tran1.income === 0 && tran1.incomeAccount !== tran2.incomeAccount) {
    tran1.income = tran2.income
    tran1.incomeAccount = tran2.incomeAccount
    if (tran2.opOutcome) tran1.opOutcome = tran2.opOutcome
    if (tran2.opOutcomeInstrument) tran1.opOutcomeInstrument = tran2.opOutcomeInstrument

    tran1.incomeBankID = tran2.id
    tran1.outcomeBankID = tran1.id
    delete tran1.id
    if (tran1.payee) delete tran1.payee // в переводах получателя нет
    console.log('>>> Объединили операцию в перевод с имеющейся ID ' + tranId)
  } else
  // расходная часть перевода ----
  if (tran2.outcome > 0 && tran1.outcome === 0 && tran1.outcomeAccount !== tran2.outcomeAccount) {
    tran1.outcome = tran2.outcome
    tran1.outcomeAccount = tran2.outcomeAccount
    if (tran2.opOutcome) tran1.opOutcome = tran2.opOutcome
    if (tran2.opOutcomeInstrument) tran1.opOutcomeInstrument = tran2.opOutcomeInstrument

    // при объединении в перевод всегда берём комментарий из расходной части
    tran1.comment = tran2.comment

    tran1.incomeBankID = tran1.id
    tran1.outcomeBankID = tran2.id
    delete tran1.id
    if (tran1.payee) delete tran1.payee // в переводах получателя нет
    console.log('>>> Объединили операцию в перевод с имеющейся ID ' + tranId)
  } else
  // обработка существующей операции
  if (transactionCompare(tran1, tran2)) {
    if (tran1.hold === true && tran2.hold === false) {
      tran1.hold = tran2.hold
      tran1.id = tran2.id
      console.log('>>> Акцепт существующей операции: ', tranId, tran1, tran2)
    } else if (tran1.hold === false) {
      console.log('>>> Пропускаем холд существующего акцепта: ', tranId, tran1, tran2)
    } else {
      console.log('>>> Ошибка обработки пары операций: ', tranId, tran1, tran2)
      throw new Error()
    }
  }
}

export function convertTransactions (apiTransactions, accounts, doubledHoldTransactionsId) {
  const transactions = {}
  apiTransactions.forEach(apiTransaction => {
    // работаем только по активным счетам
    let accountId = apiTransaction.account
    if (!inAccounts(accountId, accounts)) {
      accountId = apiTransaction.account + '_' + apiTransaction.amount.currency.name
      if (!inAccounts(accountId, accounts)) return
    }

    // учитываем только успешные операции
    if ((apiTransaction.status && apiTransaction.status === 'FAILED') || apiTransaction.accountAmount.value === 0) { return }

    // дубли холдов пропускаем (реакция на ошибочные выписки банка)
    const tranId = getApiTransactionId(apiTransaction)
    if (doubledHoldTransactionsId[tranId] > 1) {
      console.log('>>> Пропускаем дубль холда ', tranId)
      return
    }

    // обработаем транзакцию банка (результат в transactions)
    const tran = convertTransaction(apiTransaction, accountId)
    if (transactions[tranId]) {
      // обработаем дублирующую операцию
      transactionParsing(tranId, transactions[tranId], tran)
    } else {
      transactions[tranId] = tran
    }
  })
  return transactions
}

function inAccounts (id, accounts) {
  const length = accounts.length
  for (let i = 0; i < length; i++) { if (accounts[i].id === id) return true }
  return false
}

export function getDoubledHoldTransactionsId (apiTransactions) {
  let result = {}
  apiTransactions.forEach(apiTransaction => {
    if (!getTransactionHoldStatus(apiTransaction)) return
    const id = getApiTransactionId(apiTransaction)
    result[id] = result[id] ? result[id] + 1 : 1
  })
  result = Object.keys(result)
    .filter(key => result[key] > 1)
    .reduce((obj, key) => {
      obj[key] = result[key]
      return obj
    }, {})
  if (Object.keys(result).length > 0) { console.log('>>> Дубли HOLD-операций с одинаковым id: ', result) }
  return result
}

function getApiTransactionId (apiTransaction) {
  return apiTransaction.payment && apiTransaction.payment.paymentId
    // если есть paymentId, объединяем по нему, отделяя комиссии от переводов
    ? (apiTransaction.group === 'CHARGE' ? 'f' : 'p') + apiTransaction.payment.paymentId
    // либо работаем просто как с операциями, разделяя их на доходы и расходы
    : apiTransaction.id
}

function transactionCompare (tran1, tran2) {
  return tran1.account === tran2.account &&
    tran1.outcome === tran2.outcome &&
    tran1.income === tran2.income &&
    tran1.mcc === tran2.mcc &&
    tran1.payee === tran2.payee &&
    tran1.created === tran2.created
}

function getDebitCard (account, initialized) {
  if (account.status !== 'NORM') return null
  const result = {
    id: account.id,
    title: account.name,
    type: 'ccard',
    syncID: [],
    instrument: account.moneyAmount.currency.name
  }

  // овердрафт
  const creditLimit = account.creditLimit ? account.creditLimit.value : 0
  if (creditLimit > 0) result.creditLimit = creditLimit

  // контроль точности расчёта остатка
  if (!initialized || parseDecimal(account.moneyAmount.value) === parseDecimal(account.accountBalance.value - account.authorizationsAmount.value)) { result.balance = parseDecimal(account.moneyAmount.value - creditLimit) }

  const cardType = account.accountType === 'CurrentKids' ? 'детскую' : 'дебетовую'
  console.log(`>>> Добавляем ${cardType} карту: ${account.name} (#${account.id}) = ${result.balance !== null ? result.balance + ' ' + result.instrument : 'undefined'}`)

  // номера карт
  for (let k = 0; k < account.cardNumbers.length; k++) {
    const card = account.cardNumbers[k]
    if (card.activated) { result.syncID.push(card.value.substring(card.value.length - 4)) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id.substring(account.id.length - 4))

  return result
}

function getCreditCard (account, initialized) {
  if (account.status !== 'NORM') return null
  const result = {
    id: account.id,
    title: account.name,
    type: 'ccard',
    syncID: [],
    creditLimit: account.creditLimit.value,
    instrument: account.moneyAmount.currency.name
  }

  let algorithm = ''
  // A1: перерасход кредитного лимита
  if (parseDecimal(account.moneyAmount.value) === 0) {
    result.balance = -account.debtAmount.value
    algorithm = 'A1'
  } else
  // A3: нет долга перед банком
  if (account.moneyAmount.value > account.creditLimit.value) {
    result.balance = account.moneyAmount.value - account.creditLimit.value
    algorithm = 'A3'
  } else
  // A2: нет долга перед банком
  if (account.moneyAmount.value - account.authorizationsAmount.value > account.creditLimit.value) {
    result.balance = parseDecimal(account.moneyAmount.value - account.creditLimit.value - account.authorizationsAmount.value)
    algorithm = 'A2'
  } else
  // контроль точности расчёта остатка
  if (!initialized || parseDecimal(account.moneyAmount.value) === parseDecimal(account.creditLimit.value - account.debtAmount.value - account.authorizationsAmount.value)) {
    result.balance = parseDecimal(account.creditLimit.value > account.moneyAmount.value
      ? -account.debtAmount.value - account.authorizationsAmount.value
      : account.moneyAmount.value - account.creditLimit.value - account.authorizationsAmount.value)
    algorithm = 'B'
  } else {
    // доверимся данным банка
    result.balance = account.moneyAmount.value - account.creditLimit.value
    algorithm = 'C'
  }

  console.log('>>> Добавляем кредитную карту: ' + account.name + ' (#' + account.id + ') = ' + result.balance + ' ' + result.instrument + ' [' + algorithm + ']')

  // номера карт
  for (let k = 0; k < account.cardNumbers.length; k++) {
    const card = account.cardNumbers[k]
    if (card.activated) { result.syncID.push(card.value.substring(card.value.length - 4)) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id.substring(account.id.length - 4))

  return result
}

function getSavingAccount (account) {
  if (account.status !== 'NORM') return null
  console.log('>>> Добавляем накопительный счёт: ' + account.name + ' (#' + account.id + ') = ' + account.moneyAmount.value + ' ' + account.moneyAmount.currency.name)
  return {
    id: account.id,
    title: account.name,
    type: 'checking',
    syncID: account.id.substring(account.id.length - 4),
    instrument: account.moneyAmount.currency.name,
    balance: account.moneyAmount.value,
    savings: true
  }
}

function getDepositAccount (account) {
  if (account.status !== 'ACTIVE') return null
  console.log('>>> Добавляем депозит: ' + account.name + ' (#' + account.id + ') = ' + account.moneyAmount.value + ' ' + account.moneyAmount.currency.name)
  return {
    id: account.id,
    title: account.name,
    type: 'deposit',
    syncID: account.id.substring(account.id.length - 4),
    instrument: account.moneyAmount.currency.name,
    balance: account.moneyAmount.value,
    percent: account.depositRate,
    capitalization: account.typeOfInterest === 'TO_DEPOSIT',
    startDate: account.openDate.milliseconds,
    endDateOffsetInterval: 'month',
    endDateOffset: account.period,
    payoffInterval: 'month',
    payoffStep: 1
  }
}

function getMultiDepositAccount (account) {
  if (!account.accounts) return null
  const accDict = []
  for (let k = 0; k < account.accounts.length; k++) {
    const deposit = account.accounts[k]
    const currency = deposit.moneyAmount.currency.name
    const name = account.name + ' (' + currency + ')'
    const id = account.id + '_' + currency
    const syncid = account.id.substring(account.id.length - 4) + '_' + currency
    console.log('>>> Добавляем мультивалютный вклад: ' + name + ' (#' + id + ') = ' + deposit.moneyAmount.value + ' ' + deposit.moneyAmount.currency.name)
    accDict.push({
      id: id,
      title: name,
      type: 'deposit',
      syncID: syncid,
      instrument: deposit.moneyAmount.currency.name,
      balance: deposit.moneyAmount.value,
      percent: deposit.depositRate,
      capitalization: deposit.typeOfInterest === 'TO_DEPOSIT',
      startDate: account.openDate.milliseconds,
      endDateOffsetInterval: 'month',
      endDateOffset: account.period,
      payoffInterval: 'month',
      payoffStep: 1
    })
  }
  return accDict
}

function getCashLoan (account) {
  if (account.status !== 'NORM') return null
  if (account.debtAmount.value <= 0) {
    console.log('>>> Пропускаем кредит наличными ' + account.name + ' (#' + account.id + '), так как он уже закрыт')
    return null
  }

  console.log('>>> Добавляем кредит наличными: ' + account.name + ' (#' + account.id + ') = -' + account.debtAmount.value + ' ' + account.debtAmount.currency.name)
  return {
    id: account.id,
    title: account.name,
    type: 'loan',
    syncID: account.id.substring(account.id.length - 4),
    instrument: account.debtAmount.currency.name,
    balance: account.debtAmount.value,
    startBalance: account.creditAmount.value,
    startDate: account.creationDate.milliseconds,
    percent: account.tariffInfo.interestRate,
    capitalization: true,
    endDateOffsetInterval: 'month',
    endDateOffset: account.remainingPaymentsCount > 0 ? account.remainingPaymentsCount : 1,
    payoffInterval: 'month',
    payoffStep: 1
  }
}

function getKupiVKreditAccount (account) {
  if (!account.creditAccounts) return null
  const accDict = []
  for (let j = 0; j < account.creditAccounts.length; j++) {
    const vkredit = account.creditAccounts[j]
    console.log('>>> Добавляем потребительский кредит: ' + vkredit.name + ' (#' + vkredit.account + ') = ' + vkredit.balance.value + ' ' + vkredit.balance.currency.name)
    accDict.push({
      id: vkredit.account,
      title: vkredit.name,
      type: 'loan',
      syncID: vkredit.account.substring(account.id.length - 4),
      instrument: vkredit.balance.currency.name,
      balance: vkredit.balance.value,
      startBalance: vkredit.amount.value,
      startDate: Date.now(), // ToDO: нужно разобраться как достать параметры потребительского кредита
      percent: 1,
      capitalization: true,
      endDateOffsetInterval: 'month',
      endDateOffset: 1,
      payoffInterval: 'month',
      payoffStep: 1
    })
  }
  return accDict
}

function getWalletAccount (account) {
  if (account.status !== 'NORM') return null
  const result = {
    id: account.id,
    title: account.name,
    type: 'ccard',
    syncID: [],
    instrument: account.moneyAmount.currency.name,
    balance: account.moneyAmount.value
  }
  console.log('>>> Добавляем виртуальную карту: ' + account.name + ' (#' + account.id + ') = ' + result.balance + ' ' + result.instrument)

  // номера карт
  for (let k = 0; k < account.cardNumbers.length; k++) {
    const card = account.cardNumbers[k]
    if (card.activated) { result.syncID.push(card.value.substring(card.value.length - 4)) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id.substring(account.id.length - 4))

  return result
}

function getTelecomAccount (account) {
  if (account.status !== 'NORM') return null
  const result = {
    id: account.id,
    title: account.name,
    type: 'ccard',
    syncID: [],
    instrument: account.moneyAmount.currency.name,
    balance: account.moneyAmount.value
  }
  console.log('>>> Добавляем телеком-карту: ' + account.name + ' (#' + account.id + ') = ' + result.balance + ' ' + result.instrument)

  // номера карт
  for (let k = 0; k < account.cardNumbers.length; k++) {
    const card = account.cardNumbers[k]
    if (card.activated) { result.syncID.push(card.value.substring(card.value.length - 4)) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id.substring(account.id.length - 4))

  return result
}

function parseDecimal (str) {
  return Number(str.toFixed(2).replace(/\s/g, '').replace(/,/g, '.'))
}

function n2 (n) {
  return n < 10 ? '0' + n : String(n)
}
