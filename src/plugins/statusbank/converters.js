import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (ob) {
  if (ob.Enabled && ob.Enabled[0] === 'N') {
    return null
  }
  const id = ob.Id[0].split('-')[0]
  if (!ZenMoney.isAccountSkipped(id)) {
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
      accountID: Number(ob.BankId[0].split('-')[-1]),
      latestTrID: ob.lastTrxExecutionId
    }
  }
  return null
}

export function convertTransaction (apiTransaction, account) {
  if ((apiTransaction.amount && apiTransaction.amount !== 0) || (apiTransaction.amountReal && apiTransaction.amountReal !== 0)) {
    const transaction = {
      date: getDate(apiTransaction.date),
      movements: [getMovement(apiTransaction, account)],
      merchant: null,
      comment: null,
      hold: false
    };

    [
      parseCash,
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

  if (duplicateCount > 0) {
    console.log(`>>> Удалено ${duplicateCount} дубликатов операций.`)
  }
  return result
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

  if (!isLatestOpsP2P && !isStatementP2P) {
    return false
  }

  transaction.groupKeys = [[
    'statusbank-p2p',
    apiTransaction.date,
    Math.abs(apiTransaction.amount || apiTransaction.amountReal),
    apiTransaction.currency || apiTransaction.currencyReal
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
