import currencies from '../../common/codeToCurrencyLookup'

export function convertAccounts (apiAccounts, walletId) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    if (apiAccount.type.id !== 'WALLET') {
      continue
    }
    accounts.push({
      id: getAccountId(walletId, apiAccount.currency),
      type: 'checking',
      title: 'QIWI (' + currencies[apiAccount.currency] + ')',
      instrument: currencies[apiAccount.currency],
      syncID: [walletId.toString().slice(-4)],
      balance: apiAccount.balance.amount
    })
  }
  return accounts
}

export function convertTransaction (apiTransaction, walletId) {
  if (apiTransaction.status !== 'SUCCESS' && apiTransaction.status !== 'WAITING') {
    return null
  }
  const invoice = {
    sum: apiTransaction.type === 'OUT' ? -apiTransaction.sum.amount : apiTransaction.sum.amount,
    instrument: currencies[apiTransaction.sum.currency]
  }
  const transaction = {
    hold: apiTransaction.status === 'WAITING',
    date: new Date(apiTransaction.date),
    movements: [
      {
        id: apiTransaction.txnId.toString(),
        account: { id: getAccountId(walletId, apiTransaction.sum.currency) },
        invoice: null,
        sum: invoice.sum,
        fee: apiTransaction.commission.amount ? -apiTransaction.commission.amount : 0
      }
    ],
    merchant: null,
    comment: apiTransaction.comment
  };
  [
    parseInnerTransfer,
    parserOuterTransfer,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, invoice))
  return transaction
}

function parseInnerTransfer (transaction, apiTransaction, invoice) {
  if (apiTransaction.provider.id !== 1099 && apiTransaction.source.id !== 1099) {
    return false
  }
  transaction.comment = null
  transaction.groupKeys = [
    apiTransaction.txnId.toString()
  ]
  return true
}

function parserOuterTransfer (transaction, apiTransaction, invoice) {
  let companyId = null
  let syncId = null
  let isOuterTransfer = false
  let payee = null
  if (invoice.sum > 0 && apiTransaction.source.id === 99) {
    isOuterTransfer = true
    transaction.comment = transaction.comment || apiTransaction.source.shortName
  } else if (invoice.sum < 0 && apiTransaction.provider.id === 99) {
    isOuterTransfer = true
    companyId = '15592'
    if (apiTransaction.view.account) {
      payee = 'QIWI ' + apiTransaction.view.account
      syncId = apiTransaction.view.account
    }
  } else if (invoice.sum < 0 && apiTransaction.provider.id === 466) {
    // Tinkoff
    isOuterTransfer = true
    companyId = '4902'
  } else if (invoice.sum < 0 && apiTransaction.provider.id === 26476) {
    // Yandex.Money
    isOuterTransfer = true
    companyId = '15420'
    if (apiTransaction.view.account) {
      payee = 'Яндекс.Деньги ' + apiTransaction.view.account
      syncId = apiTransaction.view.account
    }
  } else if (invoice.sum < 0 && apiTransaction.provider.id === 21013) {
    // Transfer to Mastercard card
    isOuterTransfer = true
    transaction.comment = transaction.comment || apiTransaction.provider.shortName
    if (apiTransaction.view.account) {
      syncId = apiTransaction.view.account
    }
  }
  if (!isOuterTransfer) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'ccard',
      instrument: invoice.instrument,
      company: companyId ? { id: companyId } : null,
      syncIds: syncId ? [syncId.slice(-4)] : null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  if (payee) {
    transaction.merchant = {
      country: null,
      city: null,
      title: payee,
      mcc: null,
      location: null
    }
  }
  return true
}

function parsePayee (transaction, apiTransaction, invoice) {
  if (apiTransaction.comment) {
    const match = apiTransaction.comment.match(/([^>]+)>(.*)\s\s\s+([^\s]+)/)
    if (match) {
      transaction.comment = null
      transaction.merchant = {
        country: match[3].trim() || null,
        city: match[2].trim() || null,
        title: match[1].trim(),
        mcc: null,
        location: null
      }
      return false
    }
  }
  if (invoice.sum < 0) {
    if ([
      1861
    ].indexOf(apiTransaction.provider.id) >= 0) {
      return false
    }
    let payee = apiTransaction.provider.shortName
    if ([
      1
    ].indexOf(apiTransaction.provider.id) >= 0) {
      if (apiTransaction.view.account) {
        payee += ' ' + apiTransaction.view.account
      }
    }
    transaction.merchant = {
      country: null,
      city: null,
      title: payee,
      mcc: null,
      location: null
    }
  }
}

function getAccountId (walletId, currency) {
  return `${walletId}_${currency}`
}
