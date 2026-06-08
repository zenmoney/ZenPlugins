import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

function normalizeItems (item) {
  if (!item) {
    return []
  }
  return Array.isArray(item) ? item.filter(Boolean) : [item]
}

function findActionId (product, predicate) {
  for (const group of normalizeItems(product.Group)) {
    for (const action of normalizeItems(group.Action)) {
      if (predicate(action)) {
        return action.Id
      }
    }
  }
  return null
}

function parseAmount (amount) {
  if (amount === null || amount === undefined || amount === '') {
    return null
  }
  const normalized = Number.parseFloat(String(amount).replace(',', '.').replace(/\s/g, ''))
  return isNaN(normalized) ? null : normalized
}

function parseBankDate (value) {
  if (typeof value !== 'string' || !/^\d{8}$/.test(value)) {
    return null
  }
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6)) - 1
  const day = Number(value.slice(6, 8))
  return new Date(Date.UTC(year, month, day))
}

function parsePercent (value) {
  if (typeof value !== 'string') {
    return null
  }
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

function getDateDiffInDays (startDate, endDate) {
  if (!(startDate instanceof Date) || isNaN(startDate) || !(endDate instanceof Date) || isNaN(endDate)) {
    return null
  }
  return Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
}

function parseMinorAmount (amount) {
  const normalized = Number(amount)
  return Number.isFinite(normalized) ? normalized / 100 : null
}

function isHistoryApiTransaction (apiTransaction) {
  return Boolean(apiTransaction && typeof apiTransaction === 'object' && typeof apiTransaction.date === 'string' && typeof apiTransaction.pan === 'string')
}

function findHistoryTransactionAccount (apiTransaction, accounts) {
  const last4 = apiTransaction.pan.slice(-4)
  return accounts.find(account => {
    if (apiTransaction.bankId && account.bankId && String(account.bankId) === String(apiTransaction.bankId)) {
      return true
    }
    return account.syncID.indexOf(last4) !== -1
  }) || null
}

function createHistoryMerchant (apiTransaction) {
  const mcc = Number(apiTransaction.mcc)
  const terminal = typeof apiTransaction.terminal === 'string' ? apiTransaction.terminal.trim() : ''
  if (!terminal && (isNaN(mcc) || mcc === 0)) {
    return null
  }

  const merchant = {
    mcc: isNaN(mcc) || mcc === 0 ? null : mcc,
    location: null
  }
  const parts = terminal.split(/\s*,\s*/).filter(Boolean)
  if (parts.length >= 3 && /^[A-Z]{2,3}$/.test(parts[parts.length - 1])) {
    merchant.title = parts[0]
    merchant.city = parts[1] || null
    merchant.country = parts[2] || null
  } else if (terminal) {
    merchant.fullTitle = terminal
  }
  return merchant
}

function normalizeIdPart (value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function joinIdParts (parts) {
  return parts
    .map(normalizeIdPart)
    .filter(part => part !== '')
    .join(':')
}

function getMerchantKeyParts (merchant) {
  if (!merchant) {
    return []
  }
  if (merchant.fullTitle) {
    const [title = merchant.fullTitle, city = ''] = merchant.fullTitle.split(/\s*,\s*/)
    return [title, city, merchant.mcc]
  }
  return [merchant.title, merchant.city, merchant.mcc]
}

function createStableSourceKey (apiTransaction) {
  if (apiTransaction.authCode) {
    return `auth:${apiTransaction.authCode}`
  }
  if (apiTransaction.orderNumber) {
    return `order:${apiTransaction.orderNumber}`
  }
  if (apiTransaction.id && !isHistoryApiTransaction(apiTransaction)) {
    return `event:${apiTransaction.id}`
  }
  return null
}

function createTransactionKey (account, transaction, apiTransaction = {}) {
  const primaryMovement = transaction.movements[0]
  const stableSourceKey = createStableSourceKey(apiTransaction)
  if (stableSourceKey) {
    return joinIdParts([
      'bgpb',
      account.id,
      stableSourceKey,
      transaction.date.toISOString().slice(0, 16)
    ])
  }

  return joinIdParts([
    'bgpb',
    account.id,
    transaction.date.toISOString().slice(0, 16),
    transaction.hold ? 'hold' : 'posted',
    primaryMovement.sum,
    primaryMovement.invoice?.instrument,
    primaryMovement.invoice?.sum,
    transaction.comment,
    ...getMerchantKeyParts(transaction.merchant)
  ])
}

function assignMovementIds (transaction, account, apiTransaction) {
  const transactionKey = createTransactionKey(account, transaction, apiTransaction)
  transaction.movements[0].id = joinIdParts([transactionKey, 'card'])
  if (transaction.movements[1]) {
    transaction.movements[1].id = joinIdParts([transactionKey, transaction.movements[1].account?.type || 'transfer'])
  }
  return transaction
}

function convertHistoryLastTransaction (apiTransaction, accounts) {
  const account = findHistoryTransactionAccount(apiTransaction, accounts)
  if (!account) {
    return null
  }

  const totalInstrument = codeToCurrencyLookup[apiTransaction.totalAmount?.currency] || account.instrument
  const invoiceInstrument = codeToCurrencyLookup[apiTransaction.currencyAmount?.currency] || totalInstrument
  const sign = apiTransaction.direction === 'incoming' ? 1 : -1
  const totalAmount = parseMinorAmount(apiTransaction.totalAmount?.amount)
  const invoiceAmount = parseMinorAmount(apiTransaction.currencyAmount?.amount)

  if (totalAmount === null && invoiceAmount === null) {
    return null
  }
  if (apiTransaction.reversal === 1 || apiTransaction.reversal === true || apiTransaction.status === 'reversed' || apiTransaction.status === 'declined') {
    return null
  }

  return {
    date: new Date(apiTransaction.date),
    movements: [
      {
        id: '',
        account: { id: account.id },
        invoice: invoiceInstrument !== account.instrument && invoiceAmount !== null
          ? {
              instrument: invoiceInstrument,
              sum: sign * invoiceAmount
            }
          : null,
        sum: totalInstrument === account.instrument && totalAmount !== null ? sign * totalAmount : null,
        fee: 0
      }
    ],
    merchant: createHistoryMerchant(apiTransaction),
    comment: apiTransaction.transTypeDesc || null,
    hold: apiTransaction.status !== 'success'
  }
}

function convertHistoryLastTransactionWithIds (apiTransaction, accounts) {
  const transaction = convertHistoryLastTransaction(apiTransaction, accounts)
  if (!transaction) {
    return null
  }
  const account = findHistoryTransactionAccount(apiTransaction, accounts)
  return assignMovementIds(transaction, account, apiTransaction)
}

export function convertAccount (ob) {
  if ((ob.Enabled && ob.Enabled === 'N') || (ob.Blocked && ob.Blocked === 'Y')) {
    return null
  }
  const id = ob.Id.split('-')[0]
  const transactionsAccId = findActionId(ob, action => /operationtxt/i.test(action.Type || '') || /statement/i.test(action.Type || '') || action.Name === 'Выписка')
  const conditionsAccId = findActionId(ob, action => /conditions/i.test(action.Type || '') || action.Name === 'Условия обслуживания')

  if (ob.ProductType === 'MS' && !ZenMoney.isAccountSkipped(id)) {
    return {
      id,
      transactionsAccId,
      conditionsAccId,
      type: 'card',
      title: ob.CustomName + '*' + ob.No.slice(-4),
      currencyCode: ob.Currency,
      cardNumber: ob.No,
      instrument: codeToCurrencyLookup[ob.Currency],
      balance: 0,
      syncID: [ob.No.slice(-4)],
      bankId: ob.BankId || ob.ExtraData || null,
      productId: ob.Id,
      productType: ob.ProductType
    }
  }
  if (ob.ProductType === 'DEPOSIT' && !ZenMoney.isAccountSkipped(id)) {
    const startDate = parseBankDate(ob.Opened)
    const endDate = parseBankDate(ob.Expired)
    const endDateOffset = getDateDiffInDays(startDate, endDate)
    const percent = parsePercent(ob.Extra?.InterestRate)

    return {
      id,
      transactionsAccId,
      conditionsAccId,
      type: 'deposit',
      title: (ob.CustomName || ob.ProductTypeName || 'Вклад') + '*' + ob.No.slice(-4),
      currencyCode: ob.Currency,
      cardNumber: ob.No,
      instrument: codeToCurrencyLookup[ob.Currency],
      balance: parseAmount(ob.Balance) || 0,
      syncID: [ob.No],
      startDate,
      startBalance: parseAmount(ob.Balance) || 0,
      percent: percent || 0,
      capitalization: true,
      payoffInterval: 'month',
      payoffStep: 1,
      endDateOffset,
      endDateOffsetInterval: 'day',
      productId: ob.Id,
      productType: ob.ProductType
    }
  }
  return null
}

export function addOverdraftInfo (account, overdraft) {
  const creditLimit = overdraft ? Number(overdraft.replace(',', '.').replace(/\s/g, '')) : null
  return !isNaN(creditLimit) && creditLimit > 0
    ? {
        ...account,
        creditLimit,
        balance: -Math.round((creditLimit - account.balance) * 100) / 100
      }
    : account
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.statementType === 'deposit') {
    return convertDepositTransaction(apiTransaction, account)
  }
  const invoice = {
    sum: getSumAmount(apiTransaction.type, apiTransaction.amountReal),
    instrument: apiTransaction.currencyReal
  }
  const transaction = {
    date: new Date(getDate(apiTransaction.date)),
    movements: [
      {
        id: '',
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : getSumAmount(apiTransaction.type, apiTransaction.amount),
        fee: 0
      }
    ],
    merchant: null,
    comment: null,
    hold: false
  };
  [
    parseInnerTransfer,
    parseCash,
    parsePayee,
    parseComment
  ].some(parser => parser(transaction, apiTransaction, account, invoice))

  return assignMovementIds(transaction, account, apiTransaction)
}

function convertDepositTransaction (apiTransaction, account) {
  const income = parseAmount(apiTransaction.income)
  const outcome = parseAmount(apiTransaction.outcome)
  const transaction = {
    date: new Date(getDate(apiTransaction.date)),
    movements: [
      {
        id: '',
        account: { id: account.id },
        invoice: null,
        sum: income !== null ? income : -(outcome || 0),
        fee: 0
      }
    ],
    merchant: null,
    comment: apiTransaction.description || null,
    hold: false
  }
  return assignMovementIds(transaction, account, apiTransaction)
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if (apiTransaction?.description.match('Перевод с карты на карту')) {
    transaction.groupKeys = [`${getDate(apiTransaction.date).slice(0, 16)}_${invoice.instrument}_${Math.abs(invoice.sum).toString()}`]
    return true
  }
  return false
}

export function convertTestLastTransactions (apiTransactions, accounts) {
  const transactions = []
  for (const apiTransaction of apiTransactions) {
    const transaction = convertLastTransaction(apiTransaction, accounts)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return transactions
}

export function convertLastTransaction (apiTransaction, accounts) {
  if (isHistoryApiTransaction(apiTransaction)) {
    return convertHistoryLastTransactionWithIds(apiTransaction, accounts)
  }
  const rawData = apiTransaction.pushMessageText.split('; ')

  if (rawData[0].slice(0, 4) !== 'Card' || [
    /Смена статуса карты/i,
    /Проверка карты/i,
    /Neuspeshno/i
  ].some(regexp => regexp.test(apiTransaction.pushMessageText))) { // Значит это не транзакция, а просто уведомление банка
    return null
  }

  const account = accounts.find(account => {
    return account.syncID.indexOf(rawData[0].slice(-4)) !== -1
  })
  if (!account) {
    return null
  }
  let amountData
  let currency
  let amount
  let date
  let dateDate
  const isChangePinTransaction = rawData[1] === 'Смена PIN' // Транзакция смены pin имеет не стандартный формат. Нет ни одного теста !!!
  if (!isChangePinTransaction) {
    amountData = rawData[1].split(': ')
    currency = amountData[1].slice(-3)
    amount = amountData[1].replace(' ' + currency, '')
    date = getDateFromJSON(rawData[2])
    dateDate = getDateJSON(rawData[2])
    const mcc = rawData[4] ? rawData[4].match(/MCC: (\d{4})/i) : null
    apiTransaction.mcc = mcc ? mcc[1] : null
    apiTransaction.payeeLastTransaction = rawData[4] ? rawData[3] : rawData[3].split(';')[0]
  } else {
    amountData = rawData[2].split(' ')
    currency = amountData[2].slice(-3)
    amount = amountData[1]
    date = getDateFromJSON(rawData[3])
    dateDate = getDateJSON(rawData[3])
  }

  apiTransaction.description = amountData[0]
  apiTransaction.currency = currency
  apiTransaction.type = amountData[0]
  apiTransaction.amount = amount
  apiTransaction.dateDate = dateDate
  const invoice = {
    sum: getSumAmount(apiTransaction.type, apiTransaction.amount),
    instrument: apiTransaction.currency
  }

  const transaction = {
    date,
    movements: [
      {
        id: '',
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    merchant: null,
    comment: isChangePinTransaction ? 'Смена PIN' : null,
    hold: false
  };

  [
    parseP2P,
    parseCash,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction))

  return assignMovementIds(transaction, account, apiTransaction)
}

function parseCash (transaction, apiTransaction) {
  if (apiTransaction.description.indexOf('наличных на карту') > 0 ||
    apiTransaction.description === 'Пополнение' ||
    apiTransaction.description === 'Снятие наличных' ||
    apiTransaction.description === 'Наличные в ПОС') {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: apiTransaction.currency,
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(apiTransaction.type, apiTransaction.amount),
      fee: 0
    })
    return false
  } else if (apiTransaction.description === 'Перевод (зачисление)') {
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: apiTransaction.currency,
        syncIds: null
      },
      invoice: null,
      sum: -getSumAmount(apiTransaction.type, apiTransaction.amount),
      fee: 0
    })
    return true
  }
}

function parseP2P (transaction, apiTransaction) {
  if (!apiTransaction.payeeLastTransaction) {
    return false
  }

  for (const pattern of [
    /P2P/
  ]) {
    const match = apiTransaction.payeeLastTransaction.match(pattern)
    if (match) {
      transaction.groupKeys = [
        `${apiTransaction.dateDate}_${apiTransaction.currency}_${Math.abs(getSumAmount(apiTransaction.type, apiTransaction.amount)).toString()}`
      ]
      transaction.merchant = null
      transaction.movements.push({
        id: null,
        account: {
          company: null,
          type: 'ccard',
          instrument: apiTransaction.currency,
          syncIds: null
        },
        invoice: null,
        sum: -getSumAmount(apiTransaction.type, apiTransaction.amount),
        fee: 0
      })
      return true
    }
  }
  return false
}

function parsePayee (transaction, apiTransaction) {
  if (!apiTransaction.place && !apiTransaction.payeeLastTransaction) {
    return false
  }
  const mcc = Number(apiTransaction.mcc)
  transaction.merchant = {
    mcc: isNaN(mcc) || mcc === 0 ? null : mcc,
    location: null
  }
  if (apiTransaction.payeeLastTransaction) {
    const merchant = apiTransaction.payeeLastTransaction.split(',')
    if (merchant.length === 1) {
      transaction.merchant.fullTitle = apiTransaction.payeeLastTransaction
    } else if (merchant[0] === '') {
      transaction.merchant = null
    } else if (merchant.length > 1) {
      transaction.merchant.title = merchant[0]
      transaction.merchant.city = merchant[1] !== '' ? merchant[1] : null
      transaction.merchant.country = merchant[2] !== '' ? merchant[2] : null
    } else {
      throw new Error('Ошибка обработки транзакции с получателем: ' + apiTransaction.place)
    }
    return
  }

  const merchant = apiTransaction.place.split(', ')
  if (merchant.length === 1) {
    transaction.merchant.fullTitle = apiTransaction.place
  } else if (merchant.length > 1) {
    const match = merchant[0].match(/^([a-zA-Z]{2})\s.*/)
    if (match) {
      const [country, title, city] = apiTransaction.place.match(/([a-zA-Z]{2}) (.*), (.*)/).slice(1)
      transaction.merchant.title = title
      transaction.merchant.city = city
      transaction.merchant.country = country
    } else {
      transaction.merchant.title = merchant[0]
      transaction.merchant.city = merchant[1]
      transaction.merchant.country = null
    }
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + apiTransaction.place)
  }
}

function parseComment (transaction, apiTransaction) {
  if (!apiTransaction.description) { return false }

  switch (apiTransaction.description) {
    // переводы между счетами и зачисление полезной информации не несут, гасим сразу
    case 'Внесение наличных на карту':
      return true

    // в покупках комментарии не оставляем
    case 'Безналичная оплата':
      return false

    default:
      transaction.comment = apiTransaction.description
      return false
  }
}

function getSumAmount (debitFlag, strAmount) {
  const amount = Number.parseFloat(strAmount.replace(',', '.').replace(/\s/g, ''))
  if (/зачисление/gi.test(debitFlag) || debitFlag.indexOf('Пополнение') === 0) {
    return amount
  }
  return -amount
}

function getDate (str) {
  const match = str.match(/(\d{2})\.(\d{2})\.(\d{4})(?: (\d{2}):(\d{2}))?/)
  const [day, month, year, hour = '00', minute = '00'] = match.slice(1)
  return `${year}-${month}-${day}T${hour}:${minute}:00+03:00`
}

function getDateFromJSON (str) {
  const [day, month, year, hour, minute] = str.match(/(\d{2})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2}):\d{2}/).slice(1)
  return new Date(`20${year}-${month}-${day}T${hour}:${minute}:00+03:00`)
}

function getDateJSON (str) {
  const [day, month, year] = str.match(/(\d{2})\.(\d{2})\.(\d{2})/).slice(1)
  return (`20${year}-${month}-${day}`)
}

export function transactionsUnique (array) {
  const uniqueTransactions = []
  const seen = new Set()
  for (const transaction of array) {
    const firstMovement = transaction.movements[0]
    const key = firstMovement.id || joinIdParts([
      transaction.date.getTime(),
      transaction.movements.length,
      firstMovement.account.id,
      firstMovement.sum,
      firstMovement.invoice?.instrument,
      firstMovement.invoice?.sum,
      transaction.comment,
      transaction.merchant?.fullTitle,
      transaction.merchant?.title,
      transaction.merchant?.city,
      transaction.merchant?.country,
      transaction.merchant?.mcc
    ])
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    uniqueTransactions.push(transaction)
  }
  return uniqueTransactions
}
