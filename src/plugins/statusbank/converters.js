import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

/** @enum {string} */
export const TransactionSource = Object.freeze({
  cardStatement: 'card-statement',
  cardAccountStatement: 'card-account-statement',
  currentAccountStatement: 'current-account-statement',
  latestOperations: 'latest-operations'
})

export function convertAccount (ob) {
  const productType = ob.ProductType[0]
  if (productType === 'MS' && ob.Enabled && ob.Enabled[0] === 'N') {
    return null
  }
  const id = ob.Id[0].split('-')[0]
  if (ZenMoney.isAccountSkipped(id)) {
    return null
  }
  if (productType === 'MS') {
    return {
      id,
      transactionsAccId: ob.statementExecutionId,
      type: 'card',
      title: ob.ProductTypeName[0] + '*' + ob.No[0].slice(-4),
      currencyCode: ob.Currency[0],
      cardNumber: ob.No[0],
      instrument: codeToCurrencyLookup[ob.Currency[0]],
      balance: Number.parseFloat((ob.Balance[0].replace(/,/g, '.') || 0.0)),
      syncID: [ob.No[0].slice(-4)],
      productId: ob.Id[0],
      productType: ob.ProductType[0],
      latestTrID: ob.lastTrxExecutionId
    }
  }
  if (productType === 'ACCOUNT' && ob.ProductTypeName[0] === 'Счёт без карты') {
    const accountNumber = ob.No[0].replace(/^договор N\s*/i, '')
    return {
      id,
      transactionsAccId: ob.statementExecutionId,
      type: 'checking',
      title: (ob.CustomName?.[0] || ob.ProductTypeName[0]) + ' ' + accountNumber,
      currencyCode: ob.Currency[0],
      instrument: codeToCurrencyLookup[ob.Currency[0]],
      balance: Number.parseFloat((ob.Balance[0].replace(/,/g, '.') || 0.0)),
      syncID: [accountNumber],
      productId: ob.Id[0],
      productType: ob.ProductType[0],
      latestTrID: null
    }
  }
  return null
}

export function convertLinkedAccountSource (ob) {
  if (ob.ProductType?.[0] !== 'ACCOUNT' ||
    ob.ProductTypeName?.[0] !== 'Счёт с картой' ||
    ob.LinkedProductType?.[0] !== 'MS' ||
    !ob.LinkedProductId?.[0] ||
    !ob.statementExecutionId) {
    return null
  }

  return {
    id: ob.LinkedProductId[0].split('-')[0],
    transactionsAccId: ob.statementExecutionId,
    type: 'card',
    instrument: codeToCurrencyLookup[ob.Currency[0]],
    productId: ob.Id[0],
    productType: ob.ProductType[0],
    latestTrID: null
  }
}

export function convertTransaction (apiTransaction, account, source = null) {
  if ((apiTransaction.amount && apiTransaction.amount !== 0) || (apiTransaction.amountReal && apiTransaction.amountReal !== 0)) {
    const transaction = {
      date: getDate(apiTransaction.date),
      movements: [getMovement(apiTransaction, account)],
      merchant: null,
      comment: null,
      hold: false
    }

    if (source) {
      transaction._statusbank = {
        source,
        dedupKey: getLinkedAccountDedupKey(apiTransaction, account, source)
      }
    }

    [
      parseCash,
      parseCurrencyExchange,
      parseInternalTransfer,
      parsePayee
    ].some(parser => parser(transaction, apiTransaction))

    return transaction
  } else {
    return false
  }
}

export function deduplicateTransactions (transactions, accounts) {
  const accountInstruments = new Map(accounts.map(account => [account.id, account.instrument]))
  const result = []
  const indexByKey = new Map()
  let duplicateCount = 0

  for (const transaction of transactions) {
    const key = getDeduplicationKey(transaction, accountInstruments)
    if (key === null) {
      result.push(transaction)
      continue
    }

    const existingIndex = indexByKey.get(key)
    if (existingIndex === undefined) {
      indexByKey.set(key, result.length)
      result.push(transaction)
    } else {
      duplicateCount++
      if (getTransactionRichness(transaction) > getTransactionRichness(result[existingIndex])) {
        result[existingIndex] = transaction
      }
    }
  }

  const cardCounts = new Map()
  for (const transaction of result) {
    const metadata = transaction._statusbank
    if (![TransactionSource.cardStatement, TransactionSource.latestOperations].includes(metadata?.source) || !metadata?.dedupKey) {
      continue
    }
    cardCounts.set(
      metadata.dedupKey,
      (cardCounts.get(metadata.dedupKey) || 0) + 1
    )
  }

  const deduplicated = []
  for (const transaction of result) {
    const metadata = transaction._statusbank
    const cardCount = metadata?.dedupKey
      ? cardCounts.get(metadata.dedupKey) || 0
      : 0
    if (metadata?.source === TransactionSource.cardAccountStatement && cardCount > 0) {
      cardCounts.set(metadata.dedupKey, cardCount - 1)
      duplicateCount++
      continue
    }
    const cleanedTransaction = { ...transaction }
    delete cleanedTransaction._statusbank
    deduplicated.push(cleanedTransaction)
  }

  if (duplicateCount > 0) {
    console.log(`>>> Удалено ${duplicateCount} дубликатов операций.`)
  }
  return deduplicated
}

function getDeduplicationKey (transaction, accountInstruments) {
  const movement = transaction.movements.find(movement => movement.account.id)
  if (!movement?.id) {
    return null
  }

  const operationAmount = movement.invoice?.sum ?? movement.sum
  const operationInstrument = movement.invoice?.instrument ?? accountInstruments.get(movement.account.id)
  if (typeof operationAmount !== 'number' || !operationInstrument) {
    return null
  }

  return [
    movement.account.id,
    movement.id,
    transaction.date.toISOString(),
    operationInstrument,
    operationAmount
  ].join('|')
}

function getTransactionRichness (transaction) {
  const movement = transaction.movements.find(movement => movement.account.id)
  return (movement.sum !== null ? 4 : 0) +
    (transaction.merchant?.mcc != null ? 2 : 0) +
    (transaction.merchant?.fullTitle || transaction.merchant?.title ? 1 : 0)
}

function getLinkedAccountDedupKey (apiTransaction, account, source) {
  const isCardSource = [TransactionSource.cardStatement, TransactionSource.latestOperations].includes(source)
  const isCardAccountRow = source === TransactionSource.cardAccountStatement &&
    /^(Списание|Зачисление) согласно реестру карт-чеков №/.test(apiTransaction.description || '')
  if (!isCardSource && !isCardAccountRow) {
    return null
  }
  if (typeof apiTransaction.amount !== 'number' || !apiTransaction.currency) {
    return null
  }
  return [
    account.id,
    getDate(apiTransaction.date).toISOString(),
    apiTransaction.amount,
    apiTransaction.currency
  ].join('|')
}

function getMovement (apiTransaction, account) {
  const hasAccountAmount = typeof apiTransaction.amount === 'number'
  const movement = {
    id: apiTransaction.authCode || null,
    account: { id: account.id },
    invoice: null,
    sum: hasAccountAmount
      ? apiTransaction.amount
      : apiTransaction.currencyReal === account.instrument
        ? apiTransaction.amountReal
        : null,
    fee: 0
  }

  if (apiTransaction.currencyReal !== account.instrument) {
    movement.invoice = {
      sum: apiTransaction.amountReal,
      instrument: apiTransaction.currencyReal
    }
  }

  return movement
}

function parseCash (transaction, apiTransaction) {
  const cashTypes = [
    'Снятие наличных',
    'Снятие наличных денег',
    'Получение наличных денег'
  ]
  if (apiTransaction.place?.includes('POPOLNENIYE') ||
    cashTypes.includes(apiTransaction.type)) {
    const cashAmount = apiTransaction.amountReal ?? apiTransaction.amount
    const cashInstrument = apiTransaction.currencyReal ?? apiTransaction.currency

    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: cashInstrument,
        syncIds: null
      },
      invoice: null,
      sum: -cashAmount,
      fee: 0
    })
    transaction.comment = apiTransaction.place || null
    return true
  }
}

function parseInternalTransfer (transaction, apiTransaction) {
  const isLatestOpsP2P = apiTransaction.place?.includes('STATUSBANK SDBO P2P') &&
    ['Перевод (зачисление)', 'Перевод (списание)'].includes(apiTransaction.type)

  const isStatementP2P = ['Перевод/зачисление средств', 'Перевод/списание средств'].includes(apiTransaction.type) &&
    (apiTransaction.place?.startsWith('PEREVOD NA ') || apiTransaction.place?.startsWith('PEREVOD S '))

  const isAccountTransfer = apiTransaction.statementType === 'account' &&
    apiTransaction.description?.startsWith('Перевод денежных средств со счета')

  if (!isLatestOpsP2P && !isStatementP2P && !isAccountTransfer) {
    return false
  }

  if (isAccountTransfer) {
    const sourceAccount = apiTransaction.description.match(/№\s*([^\s.]+)/i)?.[1] || ''
    transaction.groupKeys = [[
      'statusbank-account-transfer',
      apiTransaction.reflectedDate || apiTransaction.date,
      Math.abs(apiTransaction.amount || apiTransaction.amountReal),
      apiTransaction.currency || apiTransaction.currencyReal,
      sourceAccount
    ].join('|')]
    return true
  }

  transaction.groupKeys = [[
    'statusbank-p2p',
    apiTransaction.date,
    Math.abs(apiTransaction.amount || apiTransaction.amountReal),
    apiTransaction.currency || apiTransaction.currencyReal
  ].join('|')]
  return true
}

function parseCurrencyExchange (transaction, apiTransaction) {
  if (apiTransaction.statementType !== 'account' ||
    !apiTransaction.description?.startsWith('Продажа валюты банком с текущего счета')) {
    return false
  }

  transaction.groupKeys = [[
    'statusbank-fx',
    apiTransaction.date,
    apiTransaction.description.replace(/\s+/g, ' ').trim()
  ].join('|')]
  return true
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
  } else if (merchant.length === 3) {
    transaction.merchant.fullTitle = apiTransaction.place.split(', ')[2]
  } else if (merchant.length > 1) {
    const [country, title, city] = apiTransaction.place.match(/([a-zA-Z]{2}) (.*), (.*)/).slice(1)
    transaction.merchant.title = title
    transaction.merchant.city = city
    transaction.merchant.country = country
  } else {
    throw new Error('Ошибка обработки транзакции с получателем: ' + apiTransaction.place)
  }
}

function getDate (str) {
  const [day, month, year] = str.match(/(\d{2}).(\d{2}).(\d{4})/).slice(1)
  return new Date(`${year}-${month}-${day}`)
}
