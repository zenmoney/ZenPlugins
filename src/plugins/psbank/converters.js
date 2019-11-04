import { parseOuterAccountData } from '../../common/accounts'

export function convertAccount (apiAccount) {
  switch (apiAccount.accountType) {
    case 1:
      return convertCurrentAccount(apiAccount)
    case 2:
      return convertCard(apiAccount)
    default:
      if (apiAccount.loanProductType) {
        return convertLoan(apiAccount)
      }
      console.assert(false, 'unsupported account type', apiAccount)
  }
}

function convertCard (apiAccount) {
  return {
    product: {
      id: apiAccount.cardAccountId,
      type: 'card'
    },
    account: {
      id: apiAccount.cardAccountId.toString(),
      type: 'ccard',
      title: apiAccount.programType.name,
      instrument: getInstrument(apiAccount.currency.nameIso),
      syncID: apiAccount.cards.map(card => cleanCardNumber(card.cardNumber)).concat(apiAccount.name),
      creditLimit: apiAccount.mainCreditLimit,
      available: apiAccount.availableBalance,
      ...apiAccount.closeDate && { archive: true }
    }
  }
}

export function convertLoan (apiLoan) {
  return {
    product: {
      id: apiLoan.contractId,
      type: 'loan'
    },
    account: {
      id: apiLoan.contractId.toString(),
      type: 'loan',
      title: apiLoan.loanProductType.loanProgram.name,
      instrument: getInstrument(apiLoan.loanAccount.currency.nameIso),
      syncID: [apiLoan.loanAccount.number],
      balance: -apiLoan.remainedMainDebtSum,
      startBalance: apiLoan.issueSum,
      startDate: new Date(apiLoan.beginDate),
      capitalization: true,
      percent: apiLoan.interestRate * 100,
      endDateOffset: apiLoan.lengthMonths,
      endDateOffsetInterval: 'month',
      payoffStep: 1,
      payoffInterval: 'month'
    }
  }
}

function convertCurrentAccount (apiAccount) {
  return {
    product: {
      id: apiAccount.accountId,
      type: 'account'
    },
    account: {
      id: apiAccount.accountId.toString(),
      type: 'checking',
      title: apiAccount.clientLabel || apiAccount.name,
      instrument: getInstrument(apiAccount.currency.nameIso),
      syncID: [apiAccount.number],
      balance: apiAccount.balance,
      ...apiAccount.isSaving && { savings: true }
    }
  }
}

export function convertTransaction (apiTransaction, account, accountsById) {
  const invoice = {
    sum: apiTransaction.transactionSum || apiTransaction.sum,
    instrument: apiTransaction.transactionCurrency ? getInstrument(apiTransaction.transactionCurrency.nameIso) : account.instrument
  }
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: invoice.instrument === account.instrument ? null : invoice,
    sum: apiTransaction.cardSum ? (apiTransaction.cardSum - apiTransaction.cardCommissionSum) : invoice.sum,
    fee: apiTransaction.cardCommissionSum || 0
  }
  if (!movement.sum) {
    return null
  }
  const transaction = {
    hold: Boolean(apiTransaction.cardSum && !apiTransaction.isProcessed),
    date: new Date(apiTransaction.transactionDate || apiTransaction.startTime),
    movements: [ movement ],
    merchant: null,
    comment: null
  };
  [
    parseCashTransfer,
    parseInnerTransfer,
    parseOuterTransfer,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account, invoice, accountsById))
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (!apiTransaction.ground) {
    return false
  }
  if (![
    /\d{4} Выдача/
  ].some(regexp => apiTransaction.ground.match(regexp))) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: invoice.instrument,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function cleanCardNumber (str) {
  return str.replace(/\s+/g, '').replace(/[^\d]+/, '******')
}

function getC2CTransferParams (apiTransaction) {
  if (apiTransaction.ground) {
    for (const [regexp, key1, key2] of [
      [/^([\d.]+) Перевод.*C2C.*на карту ([\d.]+)$/, 'from', 'to'],
      [/^([\d.]+) Пополнение.*C2C.*с карты ([\d.]+)$/, 'to', 'from']
    ]) {
      const match = apiTransaction.ground.match(regexp)
      if (match) {
        return {
          [key1]: cleanCardNumber(match[1]),
          [key2]: cleanCardNumber(match[2])
        }
      }
    }
  }
  return null
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice, accountsById) {
  if (accountsById) {
    const c2cParams = getC2CTransferParams(apiTransaction)
    if (c2cParams && accountsById[c2cParams.from] && accountsById[c2cParams.to]) {
      transaction.groupKeys = [
        `${apiTransaction.transactionDate.substring(0, 10)}_${invoice.instrument}_${Math.round(Math.abs(invoice.sum) * 100) / 100}_${c2cParams.from}_${c2cParams.to}`
      ]
      return true
    }
  }
  const operationId = apiTransaction.request && apiTransaction.request.operation
    ? apiTransaction.request.operation.operationId
    : apiTransaction.operation ? apiTransaction.operation.operationId : null
  if ([
    38,
    798,
    2639,
    6739
  ].indexOf(operationId) < 0) {
    return false
  }
  if ([798, 6739].indexOf(operationId) >= 0) {
    transaction.comment = (apiTransaction.ground && apiTransaction.ground.trim()) || null
  }
  transaction.groupKeys = [
    (apiTransaction.requestId || apiTransaction.request.requestId).toString()
  ]
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  const operationId = apiTransaction.request && apiTransaction.request.operation
    ? apiTransaction.request.operation.operationId
    : apiTransaction.operation ? apiTransaction.operation.operationId : null
  let syncId = null
  let outerAccountData = apiTransaction.ground ? parseOuterAccountData(apiTransaction.ground) : null
  if (outerAccountData && outerAccountData.company && outerAccountData.company.id === '5132') {
    outerAccountData = null
  } else if (!outerAccountData) {
    if (operationId === 2713) {
      // Yandex.Money
      outerAccountData = { company: { id: '15420' } }
    }
  }
  const c2cParams = getC2CTransferParams(apiTransaction)
  if (c2cParams) {
    syncId = invoice.sum > 0 ? c2cParams.from : c2cParams.to
  }
  if (!syncId && !outerAccountData && [
    2713,
    2751,
    7061,
    7067,
    6731
  ].indexOf(operationId) < 0) {
    return false
  }
  if (apiTransaction.request && apiTransaction.request.template && apiTransaction.request.template.name) {
    transaction.comment = apiTransaction.request.template.name
  } else if ([7061, 2751, 2713, 6731].indexOf(operationId) < 0) {
    transaction.comment = (apiTransaction.ground && apiTransaction.ground.trim()) || null
  } else if (apiTransaction.request && apiTransaction.request && apiTransaction.request.operation && apiTransaction.request.operation.name) {
    if ([2713].indexOf(operationId) >= 0) {
      transaction.comment = apiTransaction.request.operation.name
    }
  }
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      syncIds: syncId ? [syncId.slice(-4)] : null,
      ...outerAccountData,
      type: 'ccard',
      instrument: invoice.instrument
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  let payee = null
  if (apiTransaction.request) {
    payee = invoice.sum > 0 ? apiTransaction.request.senderName : apiTransaction.request.receiverName
  }
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

function parsePayee (transaction, apiTransaction, account, invoice) {
  let mcc = apiTransaction.mcc ? parseInt(apiTransaction.mcc) : NaN
  if (isNaN(mcc)) {
    mcc = null
  }
  if (apiTransaction.ground) {
    for (const regexp of [
      /\d{4} Покупка (.*)$/
    ]) {
      const match = apiTransaction.ground.match(regexp)
      if (match) {
        transaction.merchant = {
          fullTitle: match[1],
          mcc,
          location: null
        }
        return false
      }
    }
  }
  if (apiTransaction.cardSum && !apiTransaction.isProcessed) {
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.ground,
      mcc,
      location: null
    }
  } else {
    transaction.comment = (apiTransaction.ground && apiTransaction.ground.trim()) || null
  }
}

function getInstrument (instrument) {
  switch (instrument) {
    case 'RUR':
      return 'RUB'
    default:
      return instrument
  }
}
