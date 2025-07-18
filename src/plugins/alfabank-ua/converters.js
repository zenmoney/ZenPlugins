import { find } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiAccounts) {
  let accounts = []
  const accountsLoan = []
  const accountsChecking = []
  let filterAccountsChecking = []
  for (const apiAccount of apiAccounts) {
    let account
    let accountLoan
    let accountChecking
    switch (apiAccount.product.productType) {
      case 'CARD_SME':
        account = convertSMECard(apiAccount)
        accounts.push({
          account,
          product: apiAccount.product
        })
        break
      case 'CARD':
        switch (apiAccount.type) {
          case 'debit':
            account = convertDebitCard(apiAccount)
            if (apiAccount.cardSafeInfo) {
              accounts.push({
                account: convertSafe(apiAccount),
                product: null
              })
            }
            accounts.push({
              account,
              product: apiAccount.product
            })
            break
          case 'credit':
            account = convertCreditCard(apiAccount)
            accounts.push({
              account,
              product: apiAccount.product
            })
            break
          default:
            console.assert(false, 'unknown card type found', apiAccount)
        }
        break
      case 'DEPOSIT':
        account = convertDeposit(apiAccount)
        accounts.push({
          account,
          product: apiAccount.product
        })
        break
      case 'CREDIT':
        accountLoan = convertLoan(apiAccount)
        accountsLoan.push({
          account: accountLoan,
          product: apiAccount.product
        })
        break
      case 'ACCOUNT':
        accountChecking = convertChecking(apiAccount)
        accountsChecking.push({
          account: accountChecking,
          product: apiAccount.product
        })
        break
      default:
        console.assert(false, 'unknown product type found', apiAccount)
    }
  }
  accounts = accountsLoan ? accounts.concat(accountsLoan) : accounts
  if (accountsLoan.length !== 0) {
    for (const accountCheck of accountsChecking) {
      if (!accountsLoan.find(item => item.account.syncIds[0] === accountCheck.account.syncIds[0])) {
        filterAccountsChecking = filterAccountsChecking.concat(accountCheck)
      }
    }
  } else {
    filterAccountsChecking = accountsChecking
  }
  accounts = filterAccountsChecking ? accounts.concat(filterAccountsChecking) : accounts
  return accounts
}

function convertChecking (apiAccount) {
  return {
    id: apiAccount.product.productId,
    type: 'checking',
    title: apiAccount.name,
    instrument: apiAccount.product.productCurrency,
    syncIds: [apiAccount.iban],
    savings: false,
    available: getMoney(apiAccount.accountBalance)
  }
}

function convertDebitCard (apiAccount) {
  return {
    id: apiAccount.product.productId,
    type: 'ccard',
    title: apiAccount.name,
    instrument: apiAccount.product.productCurrency,
    syncIds: [apiAccount.iban, ...apiAccount.cards.map(card => card.cardNumber)],
    savings: false,
    available: getMoney(apiAccount.availableFunds)
  }
}

function convertSafe (apiAccount) {
  return {
    id: apiAccount.product.productId + '-safe',
    type: 'checking',
    title: apiAccount.name + ' Сейф',
    instrument: apiAccount.product.productCurrency,
    syncIds: [apiAccount.iban + '5473'],
    savings: true,
    available: getMoney(apiAccount.cardSafeInfo.amount)
  }
}

function convertSMECard (apiAccount) {
  return {
    id: apiAccount.product.productId,
    type: 'ccard',
    title: apiAccount.name,
    instrument: apiAccount.product.productCurrency,
    syncIds: [apiAccount.iban, ...apiAccount.cards.map(card => card.cardMask.replace(/x/g, '*'))],
    savings: false
  }
}

function convertCreditCard (apiAccount) {
  return {
    id: apiAccount.product.productId,
    type: 'ccard',
    title: apiAccount.name,
    instrument: apiAccount.product.productCurrency,
    syncIds: [apiAccount.iban, ...apiAccount.cards.map(card => card.cardNumber)],
    savings: false,
    available: getMoney(apiAccount.availableFunds),
    creditLimit: getMoney(apiAccount.creditCardProductInfo.creditLimit),
    totalAmountDue: getMoney(apiAccount.creditCardProductInfo.graceDebt),
    gracePeriodEndDate: parseSignDate(apiAccount.creditCardProductInfo.nextPaymentDate)
  }
}

function convertDeposit (apiAccount) {
  const startDate = parseSignDate(apiAccount.signDate)
  return {
    id: apiAccount.product.productId,
    type: 'deposit',
    title: apiAccount.name,
    instrument: apiAccount.product.productCurrency,
    syncIds: [apiAccount.iban],
    balance: getMoney(apiAccount.accountBalance),
    startDate,
    startBalance: getMoney(apiAccount.accountBalance),
    capitalization: apiAccount.interestChargeType === 'capitalization',
    percent: parseFloat(apiAccount.rate),
    ...parseEndDateOffset(apiAccount.endDate, startDate),
    payoffInterval: 'month',
    payoffStep: 1
  }
}

function convertLoan (apiAccount) {
  const startDate = parseSignDate(apiAccount.signDate)
  return {
    id: apiAccount.product.productId,
    type: 'loan',
    title: apiAccount.name,
    instrument: apiAccount.product.productCurrency,
    syncIds: [apiAccount.iban],
    balance: -getMoney(apiAccount.totalDebt),
    startDate,
    startBalance: getMoney(apiAccount.creditAmount),
    capitalization: true,
    percent: parseFloat(apiAccount.rate),
    ...parseEndDateOffset(apiAccount.endDate, startDate),
    payoffInterval: 'month',
    payoffStep: 1
  }
}

function parseEndDateOffset (endDate, startDate) {
  if (!endDate) {
    return {
      endDateOffsetInterval: 'year',
      endDateOffset: 10
    }
  }
  const result = getIntervalBetweenDates(startDate, parseSignDate(endDate))
  return {
    endDateOffsetInterval: result.interval,
    endDateOffset: result.count
  }
}

function parseSignDate (signDate) {
  // 2020-06-15
  return new Date(`${signDate}T00:00:00+03:00`)
}

export function duplicatesTransactions (newAccTransactions) {
  const transactionIds = {}
  const filtered = []
  for (const transaction of newAccTransactions) {
    const key = transaction.operationDate + '_' + Math.abs(transaction.subjectAmount)
    if (!transactionIds[key]) {
      transactionIds[key] = true
      filtered.push(transaction)
    }
  }
  return filtered
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.paymentId) {
    return convertSMETransaction(apiTransaction, account)
  }
  return convertUsualTransaction(apiTransaction, account)
}

function convertSMETransaction (apiTransaction, account) {
  const sumNational = getMoney(apiTransaction.amountNational)
  const sum = getMoney(apiTransaction.amount)

  return {
    hold: false,
    date: new Date(apiTransaction.executionTime + '+03:00'),
    movements: [
      {
        id: apiTransaction.paymentId,
        account: { id: account.id },
        invoice: sum !== sumNational
          ? {
              sum,
              instrument: apiTransaction.currency
            }
          : null,
        sum: sumNational,
        fee: 0
      }
    ],
    merchant: {
      country: null,
      city: null,
      title: apiTransaction.paymentName,
      mcc: null,
      location: null
    },
    comment: apiTransaction.paymentPurpose
  }
}

function convertUsualTransaction (apiTransaction, account) {
  const invoice = {
    sum: getMoney(apiTransaction.subjectAmount),
    instrument: apiTransaction.subjectUnit
  }
  let fee = 0

  if (invoice.sum === 0.0) {
    return null
  }
  if ([
    /Погашение процентов/i,
    /Погашение тела кредита/i
  ].some(regexp => regexp.test(apiTransaction.operationName))) {
    return null
  }
  if (apiTransaction.targetAmount && apiTransaction.targetUnit && apiTransaction.targetUnit === invoice.instrument) {
    invoice.sum = invoice.sum - getMoney(apiTransaction.targetAmount)
    fee = getMoney(apiTransaction.targetAmount)
  }

  const transaction = {
    hold: false,
    date: new Date(apiTransaction.operationDate),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: apiTransaction.targetAmount && apiTransaction.targetUnit && apiTransaction.targetUnit !== invoice.instrument
          ? {
              sum: getMoney(apiTransaction.targetAmount),
              instrument: apiTransaction.targetUnit
            }
          : null,
        sum: invoice.sum,
        fee
      }
    ],
    merchant: null,
    comment: null
  };

  [
    parseInnerTransfer,
    parseTransfer,
    parsePaymentMerchant,
    parsePaymentComment
  ].some(parser => parser(transaction, apiTransaction, account, invoice))

  return transaction
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /Погашення кредиту/i,
    /Погашение кредита/i
  ].some(regexp => regexp.test(apiTransaction.operationName))) {
    const instrument = apiTransaction.targetUnit || invoice.instrument
    const sum = getMoney(apiTransaction.targetAmount) || invoice.sum
    transaction.groupKeys = [`${apiTransaction.operationDate.slice(0, 10)}_${instrument}_${Math.abs(sum).toString()}`]
    return true
  }
  return false
}

function parseTransfer (transaction, apiTransaction, account, invoice) {
  if (getFilterOption(apiTransaction.filterData, 'operationType') !== 'Переводы') {
    return false
  }

  transaction.comment = apiTransaction.operationName
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      instrument: invoice.instrument,
      syncIds: null,
      type: 'ccard'
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parsePaymentComment (transaction, apiTransaction) {
  transaction.comment = apiTransaction.operationName
  return true
}

function parsePaymentMerchant (transaction, apiTransaction) {
  const category = getFilterOption(apiTransaction.filterData, 'operationType')

  if (transaction.sum > 0 || !category || ['Переводы', 'Другое'].indexOf(category) !== -1) {
    return false
  }

  transaction.merchant = {
    country: null,
    city: null,
    title: apiTransaction.operationName,
    mcc: null,
    location: null,
    category
  }

  return true
}

function getFilterOption (data, option) {
  return find(data, x => x.key === option)?.value
}

function getMoney (balance) {
  return balance / 100
}
