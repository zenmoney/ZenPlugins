import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { parseDateInTimezone } from '../../common/momentTimezoneDateUtils'
import { keyBy, filter, uniqBy } from 'lodash'

function convertDeposit (apiAccount) {
  const startDate = getDateFromString(apiAccount.Deposit.OpenDate)
  const interval = getIntervalBetweenDates(startDate, apiAccount.Deposit.EndDate ? getDateFromString(apiAccount.Deposit.EndDate) : new Date(startDate.getTime() + 31556952000))
  const account = {
    // mainProduct: apiAccount.Status.match(/ACTIVE/i) ?  : undefined,
    account: {
      id: apiAccount.DealId,
      type: 'deposit',
      title: '*' + apiAccount.Deposit.PrincipalAccountNo.slice(-4),
      instrument: apiAccount.Currency,
      syncID: [
        apiAccount.Deposit.PrincipalAccountNo
      ],
      balance: +apiAccount.Balances.Ledger - +apiAccount.Balances.HoldAmount,
      startBalance: 0,
      startDate,
      percent: +apiAccount.Deposit.InterestRate,
      capitalization: true,
      endDateOffsetInterval: interval.interval,
      endDateOffset: interval.count,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
  if (apiAccount.Deposit.PrincipalIBAN) {
    account.account.syncID.push(apiAccount.Deposit.PrincipalIBAN)
  }
  if (apiAccount.Status.match(/ACTIVE/i)) {
    account.mainProduct = {
      branchId: apiAccount.BranchId,
      dealId: apiAccount.DealId,
      type: 'deposit'
    }
  } else {
    account.account.archive = true
  }
  return account
}

function convertCard (apiAccount) {
  const creditLimit = apiAccount.Card.CreditLimit && !apiAccount.Card.CreditLimit.TotalAmount?.match(/^(0|0\.00)$/i) ? +apiAccount.Card.CreditLimit.TotalAmount : 0
  const syncID = []
  if (apiAccount.Card.CardNo) {
    syncID.push(apiAccount.Card.CardNo)
  }
  const cardIds = [apiAccount.Card.CardId]
  if (apiAccount.products) {
    for (const product of apiAccount.products) {
      cardIds.push(product.CardId)
      if (product.CardNo) {
        syncID.push(product.CardNo)
      }
    }
  }
  if (apiAccount.Card.IBAN) {
    syncID.push(apiAccount.Card.IBAN)
  }
  const id = cardIds.length < 2 ? apiAccount.Card.CardId : apiAccount.Card.IBAN ? apiAccount.Card.IBAN.slice(-5) : apiAccount.Card.CardAccount.slice(-5)
  return {
    mainProduct: {
      cardIds,
      type: 'ccard',
      id
    },
    account: {
      id,
      type: 'ccard',
      title: cardIds.length < 2 ? apiAccount.Card.CardNo.slice(-5) : apiAccount.Card.IBAN ? '*' + apiAccount.Card.IBAN.slice(-4) : '*' + apiAccount.Card.CardAccount.slice(-5),
      instrument: apiAccount.Currency,
      syncID,
      ...creditLimit > 0
        ? {
            available: apiAccount.Balances ? +apiAccount.Balances.Available - +apiAccount.Balances.HoldAmount : 0,
            creditLimit
          }
        : {
            balance: apiAccount.Balances ? +apiAccount.Balances.Ledger - +apiAccount.Balances.HoldAmount : 0
          },
      ...!apiAccount.Card.State.match(/ACTIVE/i)
        ? {
            archive: true
          }
        : { }
    }
  }
}

function handleConvertion (apiAccounts, converter) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    const account = converter(apiAccount)
    if (account) {
      accounts.push(account)
    }
  }
  return accounts
}

function adjustCards (apiAccounts) {
  const adjustedCards = keyBy(uniqBy(apiAccounts, account => account.Card.CardAccount), account => account.Card.CardAccount)
  for (const account of apiAccounts) {
    if (adjustedCards[account.Card.CardAccount] !== account) {
      adjustedCards[account.Card.CardAccount].products ? adjustedCards[account.Card.CardAccount].products.push(account.Card) : adjustedCards[account.Card.CardAccount].products = [account.Card]
    }
  }
  return filter(adjustedCards, card => card)
}

export function convertAccounts (apiAccounts) {
  const accounts = []
  accounts.push(...handleConvertion(apiAccounts.deposits, convertDeposit))
  const adjustedCards = adjustCards(apiAccounts.cards)
  accounts.push(...handleConvertion(adjustedCards, convertCard))
  return accounts
}

function adjustTransactions (apiTransactions) {
  const cardTransactionsById = keyBy(apiTransactions.cardTransactions, (transaction) => {
    return (transaction.DocumentDate ? transaction.DocumentDate.match(/(.*) .*/)[1] : transaction.BookedDate) + '-' + +transaction.OperationAmount
  })
  const accountTransactionsById = keyBy(apiTransactions.accountTransactions, (transaction) => {
    return transaction.Date + '-' + +transaction.Amount
  })
  for (const key in accountTransactionsById) {
    if (cardTransactionsById[key] && cardTransactionsById[key].OperationDescription === accountTransactionsById[key].Description) {
      accountTransactionsById[key].anotherAccountId = cardTransactionsById[key].apiAccountId
      cardTransactionsById[key] = null
    }
  }
  return {
    accountTransactions: filter(accountTransactionsById, transaction => transaction),
    cardTransactions: filter(cardTransactionsById, transaction => transaction)
  }
}

export function convertTransactions (apiTransactions, accountsById) {
  const transactions = []
  const adjustedTransactions = adjustTransactions(apiTransactions)
  transactions.push(...handleTransactionConvertion(adjustedTransactions.accountTransactions, accountsById, convertAccountTransaction))
  transactions.push(...handleTransactionConvertion(adjustedTransactions.cardTransactions, accountsById, convertCardTransaction))
  return transactions
}

function handleTransactionConvertion (apiTransactions, accountsById, converter) {
  const transactions = []
  for (const apiTransaction of apiTransactions) {
    const transaction = converter(apiTransaction, accountsById)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return transactions
}

function convertCardTransaction (apiTransaction, accountsById) {
  const account = accountsById[apiTransaction.apiAccountId]
  const invoice = {
    instrument: apiTransaction.OperationCurrency,
    sum: +apiTransaction.OperationAmount
  }
  const sum = +apiTransaction.OperationAmountInAccountCurrency || invoice.sum
  const transaction = {
    hold: false,
    date: getDateFromString(apiTransaction.BookedDate),
    movements: [
      {
        id: apiTransaction.BookedDate + '-' + sum,
        account: { id: account.id },
        invoice: invoice.instrument !== account.instrument ? invoice : null,
        sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  }

  passTransactionThroughParsers(transaction, apiTransaction, apiTransaction.OperationDescription, account, invoice)

  return transaction
}

function convertAccountTransaction (apiTransaction, accountsById) {
  const sign = apiTransaction.Type === '1' || apiTransaction.Type === '4' ? 1 : -1
  const account = accountsById[apiTransaction.apiAccountId]
  const invoice = {
    instrument: account.instrument,
    sum: sign * apiTransaction.Amount
  }
  const transaction = {
    hold: false,
    date: getDateFromString(apiTransaction.Date),
    movements: [
      {
        id: apiTransaction.Date + '-' + apiTransaction.Amount,
        account: { id: account.id },
        invoice: null,
        sum: invoice.sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  }

  passTransactionThroughParsers(transaction, apiTransaction, apiTransaction.Description, account, invoice)

  return transaction
}

function passTransactionThroughParsers (transaction, apiTransaction, description, account, invoice) {
  const parsers = [
    parseComment,
    parseInnerTransfer,
    parseOuterTransfer,
    parseCashTransfer,
    parsePayee
  ]
  parsers.some(parser => parser(transaction, apiTransaction, description, account, invoice))
}

function getDateFromString (dateString) {
  const dateData = dateString.match(/(\d{2})-(\d{2})-(\d{4})(.*)/)
  if (dateData[4] === '') {
    return parseDateInTimezone(dateData[3] + '-' + dateData[2] + '-' + dateData[1], 'Europe/Kiev')
  } else {
    return parseDateInTimezone(dateData[3] + '-' + dateData[2] + '-' + dateData[1] + dateData[4].replace(/ /, 'T'), 'Europe/Kiev')
  }
}

function parseComment (transaction, apiTransaction, description, account, invoice) {
  if (![
    /^.*Видача готівки.*$/i,
    /^.*Покупка.*$/i,
    /^.*Purchase.*$/i,
    /^.*Заробітна плата.*$/i
  ].some(regexp => regexp.test(description))) {
    transaction.comment = description
  }
  let data = description.match(/Покупка(\s+\(.*\)|)\s+(.*)(\(.*)/i)
  if (data) {
    transaction.merchant = {
      title: data[2],
      city: null,
      country: null,
      location: null,
      mcc: null
    }
    return false
  }

  data = description.match(/POS Purchase\s+(.*)(\(.*)*/i) || description.match(/^.*співробітникам\s+(.*)\s+за.*$/i)
  if (data) {
    transaction.merchant = {
      title: data[1],
      city: null,
      country: null,
      location: null,
      mcc: null
    }
    return false
  }

  return false
}

function parseInnerTransfer (transaction, apiTransaction, description, account, invoice) {
  if (!apiTransaction.anotherAccountId) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: { id: apiTransaction.anotherAccountId },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseOuterTransfer (transaction, apiTransaction, description, account, invoice) {
  if (![
    /^.*Moneysend.*$/i,
    /^.*Приватний переказ.*$/i
  ].some(regexp => regexp.test(description))) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'ccard',
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

function parseCashTransfer (transaction, apiTransaction, description, account, invoice) {
  if (![
    /^.*Видача готівки.*$/i
  ].some(regexp => regexp.test(description))) {
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

function parsePayee (transaction, apiTransaction, description, account, invoice) {
  return false
}
