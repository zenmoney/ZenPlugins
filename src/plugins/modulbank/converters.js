export function convertAccount (apiAccount) {
  if (apiAccount.status === 'Closed') {
    return null
  }
  return {
    id: apiAccount.id,
    type: apiAccount.category === 'CardAccount' || ['Карта', 'Карточный счёт'].indexOf(apiAccount.accountName) >= 0 ? 'ccard' : 'checking',
    title: apiAccount.accountName,
    instrument: parseInstrument(apiAccount.currency),
    syncID: [apiAccount.number],
    balance: apiAccount.balance,
    ...apiAccount.category === 'DepositAccount' ? { savings: true } : null
  }
}

export function convertTransaction (apiTransaction, account) {
  console.assert(['Canceled', 'Executed', 'Received'].indexOf(apiTransaction.status) >= 0, 'unexpected transaction status', apiTransaction)
  console.assert(['Debet', 'Credit'].indexOf(apiTransaction.category) >= 0, 'unexpected transaction category', apiTransaction)
  if (apiTransaction.status === 'Canceled') {
    return null
  }
  const transaction = {
    hold: false,
    date: new Date(apiTransaction.executed + '+03:00'),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: null,
        sum: apiTransaction.category === 'Credit' ? -apiTransaction.amount : apiTransaction.amount,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parseCashTransfer,
    parseInnerTransfer,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account))
  return transaction
}

function parseInstrument (currency) {
  return currency === 'RUR' ? 'RUB' : currency
}

function parseCashTransfer (transaction, apiTransaction, account) {
  if (!apiTransaction.paymentPurpose) {
    return false
  }
  if (![
    'Получение наличных'
  ].some(str => apiTransaction.paymentPurpose.indexOf(str) >= 0)) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: account.instrument,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: -transaction.movements[0].sum,
    fee: 0
  })
  return true
}

function parseInnerTransfer (transaction, apiTransaction) {
  if (!apiTransaction.paymentPurpose || !apiTransaction.docNumber) {
    return false
  }
  if (![
    'Возврат депозита',
    'Перевод между счетами',
    'Взнос во вклад'
  ].some(str => apiTransaction.paymentPurpose.indexOf(str) >= 0)) {
    return false
  }
  transaction.groupKeys = [
    apiTransaction.docNumber
  ]
  return true
}

function parsePayee (transaction, apiTransaction) {
  if (apiTransaction.paymentPurpose) {
    for (const regexp of [
      /Безналичная оплата товаров и услуг с использованием банковской карты и\/или ее реквизитов (.*)/
    ]) {
      const match = apiTransaction.paymentPurpose.match(regexp)
      if (match) {
        transaction.merchant = {
          fullTitle: match[1],
          mcc: null,
          location: null
        }
        return false
      }
    }
  }
  transaction.comment = apiTransaction.paymentPurpose
  if (apiTransaction.contragentName && !['МОДУЛЬБАНК'].some(str => apiTransaction.contragentName.indexOf(str) >= 0)) {
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.contragentName,
      mcc: null,
      location: null
    }
  }
}
