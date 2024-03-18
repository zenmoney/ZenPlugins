import { parseXml } from '../../common/xmlUtils'
import { keyBy, filter, groupBy } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

const cashRegEx = /(ATM|CASH)/i

function convertCard (apiAccount) {
  if (apiAccount.isBlocked) {
    return null
  }
  let title = '*' + apiAccount.last4Digits
  const syncID = [
    ...apiAccount.iban ? [apiAccount.iban] : [],
    apiAccount.last4Digits
  ]
  const lastFours = []
  if (apiAccount.equalCards) {
    title = 'cards ' + title
    for (const card of apiAccount.equalCards) {
      title += ' *' + card.last4Digits
      syncID.push(card.last4Digits)
      lastFours.push(card.last4Digits)
    }
  }
  return {
    lastFour: apiAccount.last4Digits,
    account: {
      id: apiAccount.id,
      type: 'ccard',
      title,
      instrument: apiAccount.ccy,
      syncID,
      ...apiAccount.creditLimit
        ? {
            available: apiAccount.balance,
            creditLimit: apiAccount.creditLimit
          }
        : {
            balance: apiAccount.balance
          }
    },
    ...lastFours.length > 0
      ? {
          lastFours
        }
      : { }
  }
}

function convertAccount (apiAccount) {
  return {
    lastFour: apiAccount.last4Digits,
    account: {
      id: apiAccount.account,
      type: 'checking',
      title: '*' + apiAccount.account.slice(-4),
      instrument: apiAccount.currency,
      syncID: [
        apiAccount.iban
      ],
      balance: apiAccount.amount || null,
      ...apiAccount.isActive
        ? { }
        : {
            archive: true
          }
    }
  }
}

function convertCredit (apiAccount) {
  const startDate = new Date(apiAccount.agreeDate)
  const interval = getIntervalBetweenDates(startDate, new Date(apiAccount.endDate))
  return {
    lastFour: apiAccount.last4Digits,
    account: {
      id: apiAccount.account,
      instrument: apiAccount.currency,
      balance: -apiAccount.actualAmount,
      startBalance: apiAccount.amount,
      type: 'loan',
      title: '*' + apiAccount.account.slice(-4),
      startDate,
      capitalization: true,
      percent: 0.01,
      endDateOffsetInterval: interval.interval,
      endDateOffset: interval.count,
      payoffInterval: 'month',
      payoffStep: 1,
      syncID: [apiAccount.account]
    }
  }
}

function convertDeposit (apiAccount) {
  const startDate = new Date(apiAccount.dateStart)
  const interval = getIntervalBetweenDates(startDate, new Date(apiAccount.dateEnd))
  return {
    lastFour: apiAccount.last4Digits,
    account: {
      id: apiAccount.account,
      type: 'deposit',
      title: '*' + apiAccount.account.slice(-4),
      instrument: apiAccount.currency,
      syncID: [apiAccount.iban],
      balance: apiAccount.amount,
      startBalance: apiAccount.minimalAmount,
      startDate,
      percent: 0.01,
      capitalization: true,
      endDateOffsetInterval: interval.interval,
      endDateOffset: interval.count,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function handleConvertion (apiAccount, accounts, converter) {
  const account = converter(apiAccount)
  if (account) {
    accounts.push(account)
  }
}

function getCreditCardsWithLimits (cards, creditAccounts) {
  const creditAccountsById = keyBy(creditAccounts, account => account.account)
  const adjustedCards = {}
  for (const card of cards) {
    if (creditAccountsById[card.bankAccount]) {
      adjustedCards[card.id] = {
        ...card,
        creditLimit: creditAccountsById[card.bankAccount].amount
      }
    }
  }
  return {
    cards: adjustCardsWithSameAccount(filter(cards, card => !adjustedCards[card.id])),
    adjustedCards
  }
}

function adjustCardsWithSameAccount (cards) {
  const cardsByAccountNumber = groupBy(cards, card => card.bankAccount)
  const adjustedCards = {}
  for (const accountNumber in cardsByAccountNumber) {
    if (cardsByAccountNumber[accountNumber].length > 1) {
      adjustedCards[accountNumber] = {
        ...cardsByAccountNumber[accountNumber][0],
        equalCards: cardsByAccountNumber[accountNumber].slice(1)
      }
    }
  }
  const resultCards = filter(cards, card => !adjustedCards[card.bankAccount])
  for (const accountNumber in adjustedCards) {
    resultCards.push(adjustedCards[accountNumber])
  }
  return resultCards
}

function keyByLastFours (accounts) {
  const result = { }
  for (const account of accounts) {
    const { lastFours, ...otherKeys } = account
    if (account.lastFours) {
      for (const lastFour of account.lastFours) {
        result[lastFour] = { ...otherKeys }
        result[lastFour].lastFour = lastFour
      }
    }
    result[account.lastFour] = otherKeys
  }
  return result
}

export function convertAccounts (apiAccounts) {
  const accounts = []
  const cardsData = getCreditCardsWithLimits(apiAccounts.cards, apiAccounts.cardCreditAccounts)
  for (const card of cardsData.cards) {
    handleConvertion(card, accounts, convertCard)
  }
  for (const cardNumber in cardsData.adjustedCards) {
    handleConvertion(cardsData.adjustedCards[cardNumber], accounts, convertCard)
  }
  const cardsByLastFourDigits = keyByLastFours(accounts) // keyBy(accounts, account => account.lastFour)
  for (const account of apiAccounts.accounts) {
    handleConvertion(account, accounts, convertAccount)
  }
  for (const credit of apiAccounts.creditAccounts) {
    handleConvertion(credit, accounts, convertCredit)
  }
  for (const deposit of apiAccounts.depositAccounts) {
    handleConvertion(deposit, accounts, convertDeposit)
  }
  return {
    accounts: accounts.map(accountData => accountData.account),
    cardsByLastFourDigits
  }
}

export function convertTransactions (apiTransactions, cardsByLastFourDigits) {
  const transactions = []
  const arrFourDigits = new Map(Object.entries(cardsByLastFourDigits))
  for (const fourDigit of arrFourDigits.keys()) {
    const transactionFourDigit = apiTransactions.filter(item => item.cardLast4digits === fourDigit)
    const account = cardsByLastFourDigits[fourDigit].account
    for (let i = 0, n = transactionFourDigit.length; i < n; i++) {
      let sign = -1
      if (i + 1 < n) {
        sign = transactionFourDigit[i].balanceAfter > transactionFourDigit[i + 1].balanceAfter ? 1 : -1
      }
      const transaction = convertTransaction(transactionFourDigit[i], account, sign)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }
  return transactions
}

function convertTransaction (apiTransaction, account, sign) {
  console.assert(!apiTransaction.type || [1, 2, 3, 5, 7, 8, 9, 11].indexOf(apiTransaction.type) >= 0, 'Unknown transaction type', apiTransaction)
  if (apiTransaction.amount === 0 || !account) {
    return null
  }
  const invoice = {
    sum: sign * apiTransaction.amount,
    instrument: apiTransaction.ccy
  }
  const transaction = {
    hold: false,
    date: new Date(apiTransaction.date),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : sign * (apiTransaction.amountInCardCurrency || apiTransaction.mdlAmountCents.value / 100),
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  }

  const parsers = [
    parseComment,
    parseOuterTransfer,
    parseInnerTransfer,
    parseCashTransfer,
    parsePayee
  ]
  const details = apiTransaction.details ? parseXml(apiTransaction.details).details : null
  parsers.some(parser => parser(transaction, apiTransaction, account, invoice, details))

  return transaction
}

function parseComment (transaction, apiTransaction, account, invoice, details) {
  if (apiTransaction.description?.match(cashRegEx)) {
    return false
  }
  if ([1, 3, 5, 9].indexOf(apiTransaction.type) >= 0 && apiTransaction.description?.match(/>/) && !apiTransaction.description.match(/P2P/i)) {
    transaction.merchant = {
      title: apiTransaction.description.split('>')[0].replace(/^Maib /i, ''),
      city: apiTransaction.description.match(/>(.+)\s+/i)[1].replace(/\s+$/g, '').replace(/ [^A-Za-z0-9]+.*$/, ''),
      country: apiTransaction.description.match(/\s+([a-z]+)$/i)[1],
      location: null,
      mcc: null
    }
  } else if (apiTransaction.description?.match(/P2P/i) && details && details.sourceCardLast4Digits && details.destinationCardLast4Digits) {
    transaction.merchant = {
      title: details.sourceCardLast4Digits === apiTransaction.cardLast4digits ? details.destinationCardHolder : details.sourceCardHolder,
      city: null,
      country: null,
      location: null,
      mcc: null
    }
  } else if (apiTransaction.type !== 2) {
    transaction.comment = apiTransaction.description?.replace(/\s+$/g, '') || null
  }
  return false
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice, details) {
  if (!apiTransaction.description?.match(/A2A/i)) {
    return false
  }
  transaction.comment = null
  if (!details.account && !details.destinationIban) {
    transaction.groupKeys = [Math.abs(invoice.sum).toString() + '-' + apiTransaction.date.toString().substring(0, 9)]
  }
  console.log(details.destinationIban)
  transaction.movements.push({
    id: null,
    account: !details.account
      ? {
          type: 'ccard',
          instrument: invoice.instrument,
          company: null,
          syncIds: details.destinationIban ? [details.destinationIban] : null
        }
      : { id: details.account },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice, details) {
  if (!apiTransaction.description?.match(/P2P/i)) {
    return false
  }
  if (!details) {
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
  if (details.sourceCardLast4Digits !== apiTransaction.cardLast4digits) {
    transaction.movements[0].sum = Math.abs(transaction.movements[0].sum)
    invoice.sum = Math.abs(invoice.sum)
  } else {
    transaction.movements[0].sum = -Math.abs(transaction.movements[0].sum)
    invoice.sum = -Math.abs(invoice.sum)
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'ccard',
      instrument: invoice.instrument,
      company: null,
      syncIds: details.sourceCardLast4Digits && details.destinationCardLast4Digits ? [details.sourceCardLast4Digits === apiTransaction.cardLast4digits ? details.destinationCardLast4Digits : details.sourceCardLast4Digits] : null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (!apiTransaction.description.match(cashRegEx)) {
    return false
  }
  if (apiTransaction.description.match(/CASH\s*IN/i)) {
    transaction.movements[0].sum = Math.abs(transaction.movements[0].sum)
    invoice.sum = Math.abs(invoice.sum)
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

function parsePayee (transaction, apiTransaction) {
  return false
}
