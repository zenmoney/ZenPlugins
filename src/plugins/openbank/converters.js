export function convertAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    let converter
    switch (apiAccount.productType && apiAccount.productType.toLowerCase()) {
      case 'card':
        converter = convertCard
        break
      default:
        console.assert(false, 'unsupported account', apiAccount)
    }
    const account = converter(apiAccount)
    if (account) {
      accounts.push(account)
    }
  }
  return accounts
}

function convertCard (apiAccount) {
  return {
    product: {
      id: apiAccount.cardId,
      type: 'card'
    },
    account: {
      id: apiAccount.cardId,
      type: 'ccard',
      title: apiAccount.tariffPlan.name,
      instrument: apiAccount.balance.currency,
      syncID: [
        apiAccount.maskCardNum,
        apiAccount.accNum
      ],
      balance: apiAccount.balance.amount
    }
  }
}

export function parseDate (str) {
  return new Date(str.slice(0, -2) + ':' + str.slice(-2))
}

export function convertTransaction (apiTransaction, account) {
  const invoice = {
    sum: apiTransaction.authAmount.amount,
    instrument: apiTransaction.authAmount.currency
  }
  const transaction = {
    hold: apiTransaction.status.code === 'ACCEPTED',
    date: parseDate(apiTransaction.authDate),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: apiTransaction.transAmount.amount,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account))
  return transaction
}

function parsePayee (transaction, apiTransaction) {
  const description = apiTransaction.place && apiTransaction.place.trim()
  if (!description) {
    return false
  }
  if ([
    'Комиссия',
    'OPEN.RU CARD2CARD'
  ].some(str => description.indexOf(str) >= 0)) {
    transaction.comment = description
    return false
  }
  let mcc = apiTransaction.mccCode ? parseInt(apiTransaction.mccCode) : NaN
  if (isNaN(mcc)) {
    mcc = null
  }
  transaction.merchant = {
    country: null,
    city: null,
    title: description,
    mcc,
    location: null
  }
  return false
}
