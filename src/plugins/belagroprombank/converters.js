import codeToCurrency from '../../common/codeToCurrencyLookup'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { filter, keyBy, groupBy } from 'lodash'

function convertCard (apiAccount) {
  const syncID = [apiAccount.cardAccountNumber]
  let balance = null
  let title = null
  const carsdHashes = []
  for (const card of apiAccount.cards) {
    if (card.cardStatusList && card.cardStatusList !== 'ACTIVE') {
      continue
    }
    syncID.push(card.cardNumberMasked.replace(/\s/g, ''))
    carsdHashes.push(card.cardHash)
    if (card.balance !== null && card.balance !== undefined) {
      balance = card.balance ? +card.balance.replace(/,/, '.') : 0
    }
    if (title === null) {
      title = '*' + card.cardNumberMasked.slice(-4)
    }
  }
  return {
    mainProduct: {
      carsdHashes,
      type: 'card',
      accountType: apiAccount.accountType,
      bankCode: apiAccount.bankCode,
      currencyCode: apiAccount.currency,
      internalAccountId: apiAccount.internalAccountId,
      rkcCode: apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'ccard',
      title: title || '*' + apiAccount.cardAccountNumber.slice(-4),
      instrument: codeToCurrency[apiAccount.currency],
      syncID,
      balance,
      ...apiAccount.cards.length > 0 && apiAccount.cards[0].overdraftLimit
        ? {
            creditLimit: apiAccount.cards[0].overdraftLimit
          }
        : { }
    }
  }
}

function convertDeposit (apiAccount) {
  let plannedEndDate = new Date(apiAccount.plannedEndDate)
  if (!apiAccount.plannedEndDate || !(apiAccount.plannedEndDate instanceof Number)) {
    plannedEndDate = new Date()
    plannedEndDate.setDate(plannedEndDate.getDate() + 1)
  }
  const endDateInterval = getIntervalBetweenDates(new Date(apiAccount.openDate), new Date(apiAccount.plannedEndDate))
  return {
    mainProduct: {
      type: 'deposit',
      accountType: apiAccount.accountType,
      bankCode: apiAccount.bankCode,
      currencyCode: apiAccount.currency,
      internalAccountId: apiAccount.internalAccountId,
      rkcCode: apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'deposit',
      title: apiAccount.productName,
      instrument: codeToCurrency[apiAccount.currency],
      syncID: [apiAccount.ibanNum],
      balance: apiAccount.balanceAmount,
      startBalance: apiAccount.balanceAmount,
      startDate: new Date(apiAccount.openDate),
      percent: apiAccount.percentRate || apiAccount.interestRate,
      capitalization: true,
      endDateOffsetInterval: endDateInterval.interval,
      endDateOffset: endDateInterval.count,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function convertSavings (apiAccount) {
  return {
    mainProduct: {
      type: 'deposit',
      accountType: apiAccount.accountType,
      bankCode: apiAccount.bankCode,
      currencyCode: apiAccount.currency,
      internalAccountId: apiAccount.internalAccountId,
      rkcCode: apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'checking',
      title: apiAccount.productName,
      instrument: codeToCurrency[apiAccount.currency],
      syncID: [apiAccount.ibanNum],
      balance: apiAccount.balanceAmount,
      savings: true
    }
  }
}

function convertLoan (apiAccount) {
  const endDateInterval = getIntervalBetweenDates(new Date(apiAccount.openDate), new Date(apiAccount.endDate))
  return {
    mainProduct: {
      type: 'credit',
      accountType: apiAccount.productCode,
      bankCode: apiAccount.rkcCode,
      currencyCode: apiAccount.currency,
      internalAccountId: apiAccount.internalAccountId,
      rkcCode: apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'loan',
      title: apiAccount.productName,
      instrument: codeToCurrency[apiAccount.currency],
      syncID: [apiAccount.accountNumber],
      balance: -apiAccount.residualAmount,
      startBalance: apiAccount.amountInitial,
      startDate: new Date(apiAccount.openDate),
      percent: apiAccount.percentRate,
      capitalization: true,
      endDateOffsetInterval: endDateInterval.interval,
      endDateOffset: endDateInterval.count,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function convertCurrent (apiAccount) {
  return {
    mainProduct: {
      type: 'account',
      accountType: apiAccount.accountType,
      bankCode: apiAccount.rkcCode,
      currencyCode: apiAccount.currency,
      internalAccountId: apiAccount.internalAccountId,
      rkcCode: apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'checking',
      title: apiAccount.productName,
      instrument: codeToCurrency[apiAccount.currency],
      syncID: [apiAccount.ibanNum],
      balance: apiAccount.balanceAmount,
      percent: apiAccount.interestRate,
      savings: true
    }
  }
}

function handleAccountConvertion (apiAccount, accounts, converter) {
  const account = converter(apiAccount)
  if (account) {
    accounts.push(account)
  }
}

function adjustCredits (apiAccounts) {
  const assosiatedCredits = filter(apiAccounts.loans, apiAccount => apiAccount.associatedAccount)
  const notAssosiatedCredits = filter(apiAccounts.loans, apiAccount => !apiAccount.associatedAccount)
  const cardsByNumber = keyBy(apiAccounts.cards, card => card.cardAccountNumber.slice(-9))
  for (const credit of assosiatedCredits) {
    if (!cardsByNumber[credit.associatedAccount.slice(-9)]) {
      notAssosiatedCredits.push(credit)
    }
  }
  const filteredCredits = filter(notAssosiatedCredits, credit => !credit.associatedAccount)
  return filteredCredits
}

export function convertAccounts (apiAccounts) {
  const accounts = []
  const apiCredits = adjustCredits(apiAccounts)
  for (const apiCard of apiAccounts.cards) {
    handleAccountConvertion(apiCard, accounts, convertCard)
  }
  for (const apiDeposit of apiAccounts.deposits) {
    if (!apiDeposit.plannedEndDate) {
      handleAccountConvertion(apiDeposit, accounts, convertSavings)
    } else {
      handleAccountConvertion(apiDeposit, accounts, convertDeposit)
    }
  }
  for (const apiCurrent of apiAccounts.current) {
    handleAccountConvertion(apiCurrent, accounts, convertCurrent)
    // console.assert(false, 'Don\'t know how to convert current account', apiCurrent)
  }
  for (const apiCredit of apiCredits) {
    handleAccountConvertion(apiCredit, accounts, convertLoan)
  }
  return accounts
}

function cleanTransactions (apiTransactions) {
  const groupedTransactions = groupBy(apiTransactions, transaction => transaction.transactionDate)
  const cleanedTransactions = []
  for (const key in groupedTransactions) {
    if (groupedTransactions[key].length === 1) {
      cleanedTransactions.push(...groupedTransactions[key])
      continue
    }
    for (const transaction of groupedTransactions[key]) {
      if (transaction.operationName) {
        cleanedTransactions.push(transaction)
      }
    }
  }
  return cleanedTransactions
}

export function convertTransactions (apiTransactions, account) {
  const transactions = []
  const cleanedTransactions = cleanTransactions(apiTransactions)
  for (const apiTransaction of cleanedTransactions) {
    const transaction = convertTransaction(apiTransaction, account)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return transactions
}

function convertTransaction (apiTransaction, account) {
  if (apiTransaction.transactionAmount === 0 || apiTransaction.operationAmount === 0) {
    return null
  }

  const sign = [
    /^.*OPLATA USLUG.*$/i,
    /^.*Списание.*$/i,
    /^.* плата .*$/i,
    /^.*Другие платежи.*$/i,
    /^.*OPLATA USLUG.*$/i,
    /^.*OPLATA USLUG.*$/i
  ].some(regexp => regexp.test(apiTransaction.operationName)) ||
  [
    /^.*Начисление процентов по.* долгу.*$/i
  ].some(regexp => regexp.test(apiTransaction.description)) ||
    (apiTransaction.transactionAmount && apiTransaction.transactionAmount < 0) ||
    (apiTransaction.operationAmount && apiTransaction.operationAmount < 0)
    ? -1
    : 1

  let instrument = apiTransaction.transactionCurrency ? apiTransaction.transactionCurrency : apiTransaction.operationCurrency ? apiTransaction.operationCurrency : account.instrument
  if (instrument.match(/^\d+$/i)) {
    instrument = codeToCurrency[instrument]
  }

  const invoice = {
    instrument,
    sum: Math.abs(apiTransaction.transactionCurrency ? apiTransaction.transactionAmount : apiTransaction.operationAmount) * sign
  }
  const sum = invoice.instrument === account.instrument ? invoice.sum : Math.abs(apiTransaction.operationAmount) * sign
  const dateInfo = apiTransaction.transactionDate ? apiTransaction.transactionDate : apiTransaction.operationDate
  const transaction = {
    hold: false,
    date: new Date(dateInfo),
    movements: [
      {
        id: dateInfo + '_' + sum.toString(),
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  }

  const parsers = [
    parseComment,
    parseInnerTransfer,
    parseOuterTransfer,
    parseCashTransfer,
    parsePayee
  ]
  parsers.some(parser => parser(transaction, apiTransaction, account, invoice))

  return transaction
}

function parseComment (transaction, apiTransaction) {
  if (apiTransaction.operationPlace) { // apiTransaction.operationName.match(/OPLATA USLUG/i)) {
    const merchantData = apiTransaction.operationPlace.split('-')
    const title = apiTransaction.operationName.replace(/(oplata|оплата).*$/i, '').replace(/\s+-\s+$/i, '') // merchantData.slice(2).join('-'),
    if (title) {
      transaction.merchant = {
        title,
        city: merchantData[1],
        country: merchantData[0],
        mcc: null,
        location: null
      }
    } else {
      transaction.merchant = null
      transaction.comment = apiTransaction.operationName || apiTransaction.description
    }
  } else {
    transaction.comment = apiTransaction.operationName || apiTransaction.description
  }
  return false
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  return false
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  return false
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  return false
}

function parsePayee (transaction, apiTransaction) {
  return false
}
