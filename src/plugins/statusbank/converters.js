import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (ob) {
  if (ob.Enabled && ob.Enabled === 'N') {
    return null
  }
  const id = ob.Id.split('-')[0]
  if (!ZenMoney.isAccountSkipped(id)) {
    // eslint-disable-next-line no-debugger
    return {
      id,
      transactionsAccId: null,
      latestDepositsAccId: null,
      type: 'card',
      title: ob.CustomName + '*' + ob.No.slice(-4),
      currencyCode: ob.Currency,
      cardNumber: ob.No,
      instrument: codeToCurrencyLookup[ob.Currency],
      balance: 0,
      syncID: [ob.No.slice(-4)],
      productId: ob.Id,
      productType: ob.ProductType,
      bankId: Number(ob.BankId.split('-')[-1])
    }
  }
  return null
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.amount !== 0) {
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
  }
}

function getMovement (apiTransaction, account) {
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: apiTransaction.amount,
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
  if (apiTransaction.type.indexOf('наличных на карту') > 0 ||
    apiTransaction.type === 'Снятие наличных') {
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
      sum: apiTransaction.amount,
      fee: 0
    })
    return false
  } else if (apiTransaction.type === 'Перевод (зачисление)') {
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: apiTransaction.currency,
        syncIds: null
      },
      invoice: null,
      sum: apiTransaction.amount,
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
