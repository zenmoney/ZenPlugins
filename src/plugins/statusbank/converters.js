import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (ob) {
  if (ob.Enabled && ob.Enabled[0] === 'N') {
    return null
  }
  const id = ob.Id[0].split('-')[0]
  if (!ZenMoney.isAccountSkipped(id)) {
    const transactionsAccId = ob.Action.filter((action) => action !== null).filter((action) => action.Type[0] === 'B735:GetOrdering2')[0]
    const latestTrID = ob.Action.filter((action) => action !== null).filter((action) => action.Type[0] === 'wsig:LastTrx2')[0]

    return {
      id,
      transactionsAccId: transactionsAccId.Id[0],
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
      latestTrID: latestTrID.Id[0]
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
      parsePayee
    ].some(parser => parser(transaction, apiTransaction))

    return transaction
  } else {
    return false
  }
}

function getMovement (apiTransaction, account) {
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: apiTransaction.amount || apiTransaction.amountReal,
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
  if (apiTransaction.type.includes('POPOLNENIYE') > 0 ||
    apiTransaction.type === 'Снятие наличных') {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: apiTransaction.currency || apiTransaction.currencyReal,
        syncIds: null
      },
      invoice: null,
      sum: -(apiTransaction.amount || apiTransaction.amountReal),
      fee: 0
    })
    return false
  } else if (apiTransaction.type === 'Перевод (зачисление)') {
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: apiTransaction.currency || apiTransaction.currencyReal,
        syncIds: null
      },
      invoice: null,
      sum: apiTransaction.amount || apiTransaction.amountReal,
      fee: 0
    })
    return true
  }
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
