import { parseOuterAccountData } from '../../common/accounts'
import { formatCommentDateTime } from '../../common/dateUtils'
import { isArray, groupBy, flattenDeep, union, get, values, drop, omit } from 'lodash'

export function convertAccount (account, initialized = false) {
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
      throw new Error(`Новый счёт с типом '${account.accountType}'`)
    }
  }
}

export function convertTransaction (apiTransaction, account) {
  if (!account) {
    console.log(`>>> Пропускаем операцию по не существующему счёту: ${getApiTransactionString(apiTransaction)}`)
    return null
  }
  const movement = getMovement(apiTransaction, account)
  if (!movement) { return null }

  if (apiTransaction.cardPresent) {
    movement._cardPresent = apiTransaction.cardPresent
  }

  const transaction = {
    date: getApiTransactionDate(apiTransaction),
    movements: [ movement ],
    merchant: null,
    comment: null,
    hold: getApiTransactionHoldStatus(apiTransaction)
  };

  [
    // новые методы (группировака по типу операции)
    parseTransferGroup,
    parseIncomeGroup,
    parseInternalGroup,
    parseCashGroup,
    parsePayGroup,
    // parseChargeGroup, -- нет необходимости
    // parseCorrectionGroup, -- нет необходимости

    // старые методы (пошаговая генерация свойств транзакции)
    parseComment
  ].some(parser => parser(transaction, apiTransaction))

  return transaction
}

function getMovement (apiTransaction, account) {
  const movement = {
    _id: apiTransaction.id,
    id: getApiTransactionId(apiTransaction),
    account: { id: account.id },
    invoice: null,
    sum: apiTransaction.type === 'Credit' ? apiTransaction.accountAmount.value : -apiTransaction.accountAmount.value,
    fee: 0
  }

  if (apiTransaction.accountAmount.currency.name !== apiTransaction.amount.currency.name) {
    // предохранитель от оперраций-дублей на соседних счетах
    if (apiTransaction.accountAmount.value === apiTransaction.amount.value) {
      return null
    }

    movement.invoice = {
      sum: apiTransaction.type === 'Credit' ? apiTransaction.amount.value : -apiTransaction.amount.value,
      instrument: apiTransaction.amount.currency.name
    }
  }

  return movement
}

function parseTransferGroup (transaction, apiTransaction) {
  if (apiTransaction.group !== 'TRANSFER' || !apiTransaction.payment) {
    return false
  }

  const payment = apiTransaction.payment
  const providerId = payment.providerId
  const fieldsValues = payment ? payment.fieldsValues : {}

  // расчёт мерчанта
  /* let merchant = (providerId === 'c2c-out' && (fieldsValues.recipientName || fieldsValues.bankCard)) ||
      (providerId === 'p2p-anybank' && fieldsValues.maskedFIO) ||
      (providerId === 'transfer-legal' && fieldsValues.addressee) ||
      (providerId === 'transfer-bank' && apiTransaction.description) ||
      apiTransaction.description // значение по умолчанию */
  // расчёт комментария
  /* const comment = (providerId === 'p2p-anybank' && (fieldsValues.comment || payment.comment)) ||
    (providerId === 'c2c-out' && apiTransaction.description)
  // (providerId === 'transfer-bank' && fieldsValues.comment) // комментарии межбанковских переводов не сохраняем, так как там часто личная информация!
  // (providerId === 'transfer-legal' && (fieldsValues.comment || payment.comment)) || // тоже много личного! */
  // const comment = apiTransaction.message || fieldsValues.message || apiTransaction.comment || fieldsValues.comment || ((!title || title !== apiTransaction.description) && apiTransaction.description)

  let merchant
  let comment
  switch (providerId) {
    case 'c2c-out':
      merchant = fieldsValues.recipientName || fieldsValues.bankCard
      comment = apiTransaction.description
      break

    case 'p2p-anybank':
      merchant = fieldsValues.maskedFIO || apiTransaction.description || fieldsValues.maskedPAN
      comment = fieldsValues.comment || payment.comment || apiTransaction.message
      break

    case 'transfer-legal':
      merchant = fieldsValues.addressee || apiTransaction.description
      // comment игнорируем, так как там часто встречается личная информация
      break

    case 'transfer-bank':
      merchant = apiTransaction.description
      // comment игнорируем, так как там часто встречается личная информация
      break

    case 'transfer-inner':
      // игнорируем
      break

    default:
      merchant = apiTransaction.description
      comment = apiTransaction.message || fieldsValues.message || apiTransaction.comment || fieldsValues.comment
      if (!comment && merchant !== apiTransaction.description) {
        comment = apiTransaction.description
      }
      break
  }
  if (merchant) {
    transaction.merchant = {
      title: merchant,
      city: null,
      country: null,
      mcc: getApiTransactionMcc(apiTransaction),
      location: null
    }
  }
  if (comment) {
    transaction.comment = comment
  }

  // расчёт перевода
  const card = (providerId === 'p2p-anybank' && fieldsValues.maskedPAN) ||
      (providerId === 'c2c-out' && fieldsValues.bankCard && fieldsValues.bankCard)
  const bank = (providerId === 'p2p-anybank' && fieldsValues.workflowType === 'SberTransfer' && { id: '4624' })
  if (card) {
    const account = {
      type: 'ccard',
      instrument: apiTransaction.amount.currency.name,
      syncIds: [ card.substr(-4) ]
    }
    if (bank) { account.company = bank }
    transaction = addMirrorMovement(transaction, account)
  }

  return true
}

function parseIncomeGroup (transaction, apiTransaction) {
  if (apiTransaction.group !== 'INCOME') {
    return false
  }

  const subgroup = apiTransaction.subgroup && apiTransaction.subgroup.id
  const payment = apiTransaction.payment
  const providerId = payment ? payment.providerId : null
  // const category = apiTransaction.category && apiTransaction.category.id

  // расчёт мерчанта
  /* const title = (subgroup === 'C4' && apiTransaction.senderDetails) || // входящий перевод от клиента Тинькоф
    (subgroup === 'C10' && apiTransaction.description) || // пополнение по номеру телефона
    (subgroup === undefined && apiTransaction.description) // другое */
  /* const comment = (['C1', 'C3', 'C8', 'C9'].indexOf(subgroup) >= 0 && apiTransaction.description) ||
    (subgroup === 'C10' && apiTransaction.message) // пополнение по номеру телефона с сообщением */

  let title
  let comment
  switch (subgroup) {
    case 'C1':
      comment = apiTransaction.nomination || apiTransaction.description
      break

    // входящий перевод от клиента Тинькоф
    case 'C4':
      title = apiTransaction.senderDetails
      break

    // перевод между своими счетами
    case 'C5':
      break

    // пополнение по номеру телефона
    case 'C10':
      title = apiTransaction.description
      comment = apiTransaction.message
      break

    case undefined:
      title = apiTransaction.description
      break

    default:
      comment = apiTransaction.description
      break
  }

  if (providerId === 'transfer-inner') {
    title = null
  }
  if (title === comment) {
    comment = null
  }
  if (title) {
    transaction.merchant = {
      title: title,
      city: null,
      country: null,
      mcc: getApiTransactionMcc(apiTransaction),
      location: null
    }
  }
  if (comment) {
    transaction.comment = comment
  }

  // расчёт перевода
  const card = (providerId === 'c2c-in-new' && payment.cardNumber)
  let bank = null
  if (apiTransaction.brand && apiTransaction.brand.name) {
    bank = parseOuterAccountData(apiTransaction.brand.name)
  }
  if (card /* && bank */) {
    const account = {
      type: null,
      instrument: apiTransaction.amount.currency.name
    }
    if (card) {
      account.type = 'ccard'
      account.syncIds = [card.substr(-4)]
    }
    if (bank && bank.company) {
      account.company = bank.company
    }
    transaction = addMirrorMovement(transaction, account)
  }

  return true
}

function parseInternalGroup (transaction, apiTransaction) {
  if (apiTransaction.group !== 'INTERNAL') {
    return false
  }
  // все внутренние операции (переводы между счетами) без мерчанта и комментариев
  return true
}

function parseCashGroup (transaction, apiTransaction) {
  if (apiTransaction.group !== 'CASH') {
    return false
  }

  let card
  const payment = apiTransaction.payment || {}
  switch (payment.providerId) {
    case 'c2c-out': // исходящий card2card
      card = payment.fieldsValues && (payment.fieldsValues.bankCard || payment.fieldsValues.dstCardMask)
      if (card) {
        transaction = addMirrorMovement(transaction, {
          type: 'ccard',
          instrument: apiTransaction.amount.currency.name,
          syncIds: [ card.substr(-4) ]
        })
      } else {
        console.log('>>> Ошибочная транзакция с наличными: ', apiTransaction)
        throw new Error('Ошибочная транзакция с наличными')
      }
      break

    case 'c2c-in-new': // входящий card2card
    case 'c2c-anytoany': // исходящий перевод на чужую карту
      card = payment.cardNumber
      if (card) {
        transaction = addMirrorMovement(transaction, {
          type: 'ccard',
          instrument: apiTransaction.amount.currency.name,
          syncIds: [ card.substr(-4) ]
        })
      } else {
        console.log('>>> Ошибочная транзакция с наличными: ', apiTransaction)
        throw new Error('Ошибочная транзакция с наличными')
      }
      break

    case 'p2p-anybank': // перевод по номеру телефона
      const phone = payment.fieldsValues && payment.fieldsValues.pointer
      const match = /\+7\d{6}(\d{4})/.exec(phone.trim())
      if (phone && match) {
        transaction.comment = [ apiTransaction.description, '+7******' + match[1] ].join(' ')
      } else {
        console.log('>>> Ошибочная транзакция с наличными: ', apiTransaction)
        throw new Error('Ошибочная транзакция с наличными')
      }
      break

    case undefined: // в точке партнёра
    case 'atm-transfer-cash': // в банкомате Тинькова
      // снятие наличных через Western Union (WU.COM) рассматриваем как расход
      const card2card = [ 6538 ].indexOf(apiTransaction.mcc) >= 0
      if (!card2card) {
        transaction = addMirrorMovement(transaction, { type: 'cash' }, apiTransaction.amount.currency.name)
      } else if (apiTransaction.merchant) {
        const bank = parseOuterAccountData(apiTransaction.merchant.name)
        if (bank) {
          transaction = addMirrorMovement(transaction, bank, apiTransaction.amount.currency.name)
        } else {
          transaction.merchant = parseMerchant(apiTransaction)
        }
      }
      break

    default:
      console.log('>>> Не обрабатываемая операция наличными: ', apiTransaction)
      throw new Error('Не обрабатываемая операция наличными')
  }

  return true
}

function parsePayGroup (transaction, apiTransaction) {
  if (apiTransaction.group !== 'PAY') {
    return false
  }
  transaction.merchant = parseMerchant(apiTransaction)
  return true
}

function parseMerchant (apiTransaction) {
  const locations = apiTransaction.locations || {}
  const merchant = apiTransaction.merchant || {}
  const brand = apiTransaction.brand || {}

  // расчёт мерчанта
  const resultMerchant = {
    mcc: getApiTransactionMcc(apiTransaction),
    location: null,
    city: null,
    country: null
  }
  if (locations && isArray(locations) && locations.length > 0) {
    resultMerchant.location = apiTransaction.locations[0]
  }
  if (merchant && merchant.region) {
    resultMerchant.title = merchant.name
    resultMerchant.city = merchant.region.city !== '' ? merchant.region.city : null
    resultMerchant.country = merchant.region.country
  } else if (brand) {
    resultMerchant.title = brand.name
  }

  return resultMerchant.title ? resultMerchant : null
}

function parseComment (transaction, apiTransaction) {
  // расчёт комментария
  if (apiTransaction.description) {
    transaction.comment = apiTransaction.description
  }
}

function addMirrorMovement (transaction, account, accountInstrument = null) {
  if (transaction.movements.length > 1) {
    console.log('Ошибка добавления зеркальной movement: ', transaction)
    throw new Error('Ошибка добавления зеркальной movement')
  }

  // добавим вторую часть перевода
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      instrument: transaction.movements[0].invoice
        ? transaction.movements[0].invoice.instrument
        : accountInstrument,
      syncIds: null,
      ...account
    },
    invoice: null,
    sum: -transaction.movements[0].sum,
    fee: 0
  })

  return transaction
}

function parsingDoubleTransactions (tranId, tranArr, tran2, accounts = {}) {
  let parsed = false
  for (let i = 0; i < tranArr.length; i++) {
    const tran1 = tranArr[i]
    const indexStr = tranArr.length > 1 ? '#' + i : ''

    // не нужно, так как есть операции снятия наличных с комиссиями, которые блокируются этим условием
    /* if (tran1.movements.length > 1 || tran2.movements.length > 1) {
      console.log(`>>> Ошибка объединения транзакций #${tranId}`, tranArr, tran2)
      throw new Error('Ошибка объединения транзакций')
    } */

    // объединяем в перевод между своимим счетами (только, если счета разные)
    if (tran1.movements[0].sum * tran2.movements[0].sum < 0 && tran1.movements[0].account.id !== tran2.movements[0].account.id) {
    // при объединении в перевод всегда берём комментарий из расходной части
      if (tran2.movements[0].sum < 0) {
        tran1.comment = tran2.comment
      }

      tran1.movements.push(tran2.movements.pop())

      // в переводах нет получателя
      tran1.merchant = null

      /* // id movements должны быть разными!
      const id = {}
      tran1.movements.forEach(movement => {
        if (movement.id === null) { return }
        if (!id[movement.id]) { id[movement.id] = 0 }
        id[movement.id]++
      })
      tran1.movements.forEach(movement => {
        if (id[movement.id] > 1) {
          movement.id = null
        }
      }) */

      console.log(`>>> Объединили ${indexStr}операцию в перевод #${tranId}`)
      tranArr[i] = tran1
      parsed = true
      break
    }

    // обработка существующей операции (полное совпадение)
    if (isSameTransaction(tran1, tran2)) {
      if (tran1.hold === true && tran2.hold === false) {
        tran1.hold = tran2.hold
        tran1.movenements[0].id = tran2.movenements[0].id
        console.log(`>>> Акцепт существующей ${indexStr}операции #${tranId}:`, tranArr, '\n#2: ', tran2)
      } else if (tran1.hold === false) {
        console.log(`>>> Пропускаем холд существующего ${indexStr}акцепта #${tranId}:`, tranArr, '\n#2: ', tran2)
      } else {
        throw new Error(`Ошибка обработки одинаковой пары операций #${tranId}`, tranArr, '\n#2: ', tran2)
      }
      tranArr[i] = tran1
      parsed = true
      break
    }

    // проверка на дубли на соседних счетах (совпадение без учёта счетов)
    if (isSameTransaction(tran1, tran2, true)) {
      let movement = tran2.movements[0]
      let account = accounts[movement.account.id]
      if (account && account.type !== 'ccard' && movement._cardPresent) {
        console.log(`>>> Пропускаем ошибочную дубль-операцию ${indexStr}по карте не с карточного счёта #${tranId}:`, tranArr, '\n#2: ', tran2)
        parsed = true
        break
      }

      movement = tran1.movements[0]
      account = accounts[tran1.movements[0].account.id]
      if (account && account.type !== 'ccard' && movement._cardPresent) {
        console.log(`>>> Пропускаем первую операцию ${indexStr}по карте не с карточного счёта #${tranId}:`, tranArr, '\n#2: ', tran2)
        tranArr[i] = tran2
        parsed = true
        break
      }

      console.log(`>>> Обнаружен дубль на соседнем счету. Обе операции оставляем, чтобы удалить лишние позднее #${tranId}`, tranArr, '\n#2: ', tran2)
      tranArr[i]._double = true
      tranArr.push(tran2)
      i++
      parsed = true
      break
    }
  }

  if (!parsed) {
    // две не похожие, но с одинаковыйм paymentId – нужно сохранить обе
    // например, перевод в валюте, состоящий из 3 операций (doubleTransfer2.test.js)
    tranArr.push(tran2)
    console.log(`>>> Обнаружена ещё одна операция с тем же paymentId. Все оставляем #${tranId}`, tranArr, '\n#2: ', tran2)
  }

  return tranArr
}

export function convertTransactions (apiTransactions, accounts) {
  const transactions = {}

  apiTransactions.forEach(apiTransaction => {
    // !!! пропускаем ошибочные дубли-холды на счетах с другой валютой
    if (getApiTransactionHoldStatus(apiTransaction) &&
      get(apiTransaction, 'amount.value') === get(apiTransaction, 'accountAmount.value') &&
      get(apiTransaction, 'amount.currency.name') !== get(apiTransaction, 'accountAmount.currency.name')) {
      console.log(`>>> Пропускаем ошибочную дубль-холд операцию по счёту в другой валюте: ${getApiTransactionString(apiTransaction, accounts[apiTransaction.account])}`)
      return
    }

    // работаем только по активным счетам
    let accountId = apiTransaction.account
    if (!inAccounts(accountId, accounts)) {
      accountId = apiTransaction.account + '_' + apiTransaction.amount.currency.name
      if (!inAccounts(accountId, accounts)) {
        console.log(`>>> Пропускаем операцию по не активному счёту '${apiTransaction.account}': ${getApiTransactionString(apiTransaction)}`)
        return
      }
    }

    // учитываем только успешные операции
    if ((apiTransaction.status && apiTransaction.status === 'FAILED') || apiTransaction.accountAmount.value === 0) { return }

    // обработаем транзакцию банка (результат в transactions)
    const transaction = convertTransaction(apiTransaction, accounts[accountId])
    if (transaction) {
      const tranId = getApiTransactionId(apiTransaction)

      if (transactions[tranId]) {
        // обработаем дублирующую операцию
        transactions[tranId] = parsingDoubleTransactions(tranId, transactions[tranId], transaction, accounts)
      } else {
        transactions[tranId] = [ transaction ]
        console.log(`>>> Добавляем операцию: ${getTransactionString(transaction, accounts[accountId])}`)
      }
    }
  })

  // избавляемся от ошибочных дублей (фантомные дубли на соседних счетах) – дань глючному Тинькову
  let valueTransactions = values(transactions)
  const doubleTransactions = valueTransactions.filter(transaction => transaction._double)
  if (doubleTransactions.length > 0) {
    console.log(`>>> Обнаружено дублирующихся операций: ${doubleTransactions.length} шт.`, doubleTransactions)
    valueTransactions = valueTransactions.filter(transaction => !isArray(transaction))
  }

  // у операций с одним и тем же paymentId обновим id операции
  valueTransactions = valueTransactions.map(trans => {
    if (trans.length > 1) {
      trans = trans.map((transaction, index) => {
        transaction.movements = transaction.movements.map((movement) => {
          if (movement.id && movement._id) {
            movement.id = movement.id !== movement._id ? movement.id + '_' + movement._id : movement.id + '_' + index
          }
          return movement
        })
        return transaction
      })
    } else {
      trans = [ trans[0] ]
    }
    return trans
  })

  // группируем операции, если вдруг есть одновременно холд и акцепт
  const groupedTransactions = groupBy(flattenDeep(valueTransactions), transaction => {
    const movements = []
    transaction.movements.forEach(movement => {
      movements.push(movement.account.id + '@' + movement.sum)
    })
    return `${formatCommentDateTime(transaction.date)}#${getMerchantTitle(transaction)}#${transaction.merchant && transaction.merchant.mcc}#${movements.join(';')}`
  })

  // из оставшихся полных холд-акцепт-дублей (если встретятся) приоритет на акцепты
  const result = (Object.keys(groupedTransactions)).map(key => {
    if (groupedTransactions[key].length <= 1) {
      return groupedTransactions[key][0]
    }

    let transactions = []
    // обработаем дубли, совпавшие по время-мерчант-мсс-суммы
    const groupedTransationsByHold = groupBy(groupedTransactions[key], transactions => transactions.hold)
    // если есть одновременно холды и акцепты
    if (groupedTransationsByHold['true'] && groupedTransationsByHold['false']) {
      // то берём все акцепты и остаток холдов (если их больше акцептов)
      transactions = union(groupedTransationsByHold['false'], drop(groupedTransationsByHold['true'], groupedTransationsByHold['false'].length))
    } else {
      transactions = groupedTransationsByHold['false'] || groupedTransationsByHold['true']
    }
    console.log(`>>> Обработка одинаковых акцептов и холдов (${groupedTransactions[key].length} шт.): `, groupedTransactions[key], '\n>>>=== Итог: ', transactions)
    return transactions
  })

  return flattenDeep(result).map(transaction => cleanupTransaction(transaction))
}

export function cleanupTransaction (transaction) {
  transaction.movements = transaction.movements.map(movement => cleanupMovement(movement))
  return omit(transaction, ['_double'])
}

function cleanupMovement (movement) {
  return omit(movement, ['_cardPresent', '_id'])
}

export function groupApiTransactionsById (apiTransactions) {
  return groupBy(apiTransactions, apiTransaction => getApiTransactionId(apiTransaction))
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
    if (card.activated) { result.syncID.push(card.value) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id)

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
    if (card.activated) { result.syncID.push(card.value) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id)

  return result
}

function getSavingAccount (account) {
  if (account.status !== 'NORM') return null
  console.log('>>> Добавляем накопительный счёт: ' + account.name + ' (#' + account.id + ') = ' + account.moneyAmount.value + ' ' + account.moneyAmount.currency.name)
  return {
    id: account.id,
    title: account.name,
    type: 'checking',
    syncID: [ account.id ],
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
    syncID: [ account.id ],
    instrument: account.moneyAmount.currency.name,
    balance: account.moneyAmount.value,
    percent: account.depositRate,
    capitalization: account.typeOfInterest === 'TO_DEPOSIT',
    startBalance: 0,
    startDate: new Date(account.openDate.milliseconds),
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
    const syncid = account.id
    console.log('>>> Добавляем мультивалютный вклад: ' + name + ' (#' + id + ') = ' + deposit.moneyAmount.value + ' ' + deposit.moneyAmount.currency.name)
    accDict.push({
      id: id,
      title: name,
      type: 'deposit',
      syncID: [ syncid ],
      instrument: deposit.moneyAmount.currency.name,
      balance: deposit.moneyAmount.value,
      percent: deposit.depositRate,
      capitalization: deposit.typeOfInterest === 'TO_DEPOSIT',
      startBalance: 0,
      startDate: new Date(account.openDate.milliseconds),
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
  if (account.debtAmount.value === 0) {
    console.log('>>> Пропускаем кредит наличными ' + account.name + ' (#' + account.id + '), так как он уже закрыт')
    return null
  }

  console.log('>>> Добавляем кредит наличными: ' + account.name + ' (#' + account.id + ') = -' + account.debtAmount.value + ' ' + account.debtAmount.currency.name)
  return {
    id: account.id,
    title: account.name,
    type: 'loan',
    syncID: [ account.id ],
    instrument: account.debtAmount.currency.name,
    balance: account.debtAmount.value,
    startBalance: account.creditAmount.value,
    startDate: new Date(account.creationDate.milliseconds),
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
      syncID: [ vkredit.account ],
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
    if (card.activated) { result.syncID.push(card.value) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id)

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
    if (card.activated) { result.syncID.push(card.value) }
  }
  // добавим и номер счёта карты
  result.syncID.push(account.id)

  return result
}

function getApiTransactionMcc (apiTransaction) {
  let mcc = apiTransaction.mcc ? parseInt(apiTransaction.mcc, 10) : -1
  if (!mcc) mcc = -1
  return mcc > 10 ? mcc : null // Тинькоф часть кодов использует для своих нужд
}

function getApiTransactionHoldStatus (apiTransaction) {
  return !apiTransaction.debitingTime
}

function getApiTransactionId (apiTransaction) {
  return apiTransaction.payment && apiTransaction.payment.paymentId
    // если есть paymentId, объединяем по нему, отделяя комиссии от переводов
    ? (apiTransaction.group === 'CHARGE' ? 'f' : 'p') + apiTransaction.payment.paymentId
    // либо работаем просто как с операциями, разделяя их на доходы и расходы
    : apiTransaction.id
}

function isSameTransaction (tran1, tran2, ignoreAccount = false) {
  let sameAccount = ignoreAccount || tran1.movements.length === tran2.movements.length
  if (!ignoreAccount && sameAccount) {
    sameAccount = tran1.movements.length === tran2.movements.length &&
      !tran1.movements.some((movement, index) => movement.account.id !== tran2.movements[index].account.id)
  }

  const sameSum = tran1.movements.length === tran2.movements.length &&
    !tran1.movements.some((movement, index) => {
      return movement.sum !== tran2.movements[index].sum ||
      JSON.stringify(movement.invoice) !== JSON.stringify(tran2.movements[index].invoice)
    })

  return sameAccount && sameSum &&
    (tran1.merchant &&
      tran1.merchant.mcc === tran2.merchant.mcc &&
      tran1.merchant.title === tran2.merchant.title &&
      tran1.merchant.fullTitle === tran2.merchant.fullTitle) &&
    formatCommentDateTime(tran1.date) === formatCommentDateTime(tran2.date)
}

function getMovementSumToString (movement) {
  let result = `${movement.sum}`
  if (movement.invoice) {
    result += ` (${movement.invoice.sum} ${movement.invoice.instrument})`
  }
  return result
}

function getTransactionString (transaction, account = {}) {
  if (isArray(transaction)) {
    return transaction.map((tran, index) => `#${index}: ${getTransactionString(tran)}`).join('\n')
  }

  const hold = transaction.hold ? ' [H] ' : ''
  const sum = transaction.movements.map(movement => getMovementSumToString(movement)).join(' -> ')
  return `#${transaction.movements[0].id}, ${formatCommentDateTime(transaction.date)}, ${account.title || account.id}, ${hold}${getMerchantTitle(transaction)}, ${sum}`
}

function getMerchantTitle (transaction) {
  return (transaction.merchant && (transaction.merchant.title || transaction.merchant.fullTitle)) || ''
}

function getApiTransactionString (apiTransaction, account = {}) {
  const id = apiTransaction.id
  const date = formatCommentDateTime(getApiTransactionDate(apiTransaction))
  const acc = account.title || (apiTransaction.account && '#' + apiTransaction.account)
  const hold = getApiTransactionHoldStatus(apiTransaction) ? ' [H] ' : ''
  const payee = (apiTransaction.merchant && apiTransaction.merchant.name) || (apiTransaction.brand && apiTransaction.brand.name) || apiTransaction.description

  let sum = `${apiTransaction.type === 'Credit' ? apiTransaction.amount.value : -apiTransaction.amount.value} ${apiTransaction.amount.currency.name}`
  const sum2 = `${apiTransaction.type === 'Credit' ? apiTransaction.accountAmount.value : -apiTransaction.accountAmount.value} ${apiTransaction.accountAmount.currency.name}`
  if (apiTransaction.amount.currency.name !== apiTransaction.accountAmount.currency.name) {
    sum += ` (${sum2})`
  }

  return `#${id}, ${date}, ${acc}, ${hold}${payee}, ${sum}`
}

function getApiTransactionDate (apiTransaction) {
  // дата привязана к часовому поясу Москвы
  return new Date(apiTransaction.operationTime.milliseconds)
}

function inAccounts (id, accounts) {
  // return accounts.filter(account => account.id === id).length > 0
  return accounts.hasOwnProperty(id)
}

function parseDecimal (str) {
  return Number(str.toFixed(2).replace(/\s/g, '').replace(/,/g, '.'))
}
