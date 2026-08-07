import moment from 'moment'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccount (account) {
  return {
    id: String(account.guid),
    title: 'Счёт ' + account.currency.name + ' *' + account.guid.slice(-4),
    syncIds: [account.accountNumber],
    instrument: account.currency.name,
    type: 'checking',
    balance: account.balance / Math.pow(10, account.currency.scale)
  }
}

export function convertCard (rawCard, rawBalance) {
  const card = {
    id: String(rawCard.guid),
    title: rawCard.cardName,
    syncIds: [rawCard.maskedPan],
    instrument: rawCard.currency.name,
    type: 'ccard'
  }

  if (!rawCard.cardName) {
    card.title = rawCard.processingType + ' *' + rawCard.maskedPan.slice(-4)
  }
  if (rawBalance) {
    card.balance = rawBalance.balance / Math.pow(10, rawBalance.currency.scale)
  }

  return card
}

export function convertDeposit (deposit) {
  const closeDate = new Date(deposit.closeDate.replace('+', '') + 'Z')
  const openDate = moment(closeDate).subtract(deposit.period, 'months').toDate()
  const endDateInterval = getIntervalBetweenDates(openDate, closeDate)
  return {
    id: deposit.guid,
    type: 'deposit',
    title: 'Депозит ' + deposit.depositProductName,
    syncIds: [deposit.guid],
    instrument: deposit.currency.name,
    balance: deposit.balance / Math.pow(10, deposit.currency.scale),
    percent: Number(deposit.interestRate),
    startDate: openDate,
    endDateOffsetInterval: endDateInterval.interval,
    endDateOffset: endDateInterval.count,
    payoffStep: 0,
    payoffInterval: null,
    capitalization: false
  }
}

export function convertAccounts (apiAccounts) {
  return apiAccounts.map(apiAccount => {
    let account
    switch (apiAccount.type) {
      case 'card':
        account = convertCard(apiAccount.data, apiAccount.balance)
        break
      case 'account':
        account = convertAccount(apiAccount.data)
        break
      case 'deposit':
        account = convertDeposit(apiAccount.data)
        break
    }

    if (!account) {
      return null
    }
    return {
      account,
      products: [{
        id: account.id,
        type: apiAccount.type === 'deposit' ? 'deposit' : 'cardOrAccount'
      }]
    }
  }).filter(account => account !== null)
}

export function convertCardOrAccountTransaction (account, rawTransaction) {
  const sign = rawTransaction.transactionType === 'DEBIT' ? -1 : 1
  const invoice = {
    sum: sign * rawTransaction.amount / Math.pow(10, rawTransaction.currency.scale),
    instrument: rawTransaction.currency.name
  }

  let comment = null
  switch (rawTransaction.module) {
    case 'CONVERSION':
      comment = 'Обмен валюты'
      break
    case 'P2P':
      comment = rawTransaction.transactionType === 'DEBIT' ? 'Исходящий перевод' : 'Входящий перевод'
      break
    case 'DEPOSITS_TRANSACTION':
      comment = 'Пополнение вклада ' + rawTransaction.name
      break
    case 'ACCOUNTS':
      comment = rawTransaction.group.type === 'DEPOSITS' && rawTransaction.transactionType === 'CREDIT' ? 'Выплата процентов по вкладу' : null
      break
  }

  const transaction = {
    hold: false,
    date: new Date(rawTransaction.transactionDate.replace('+', '') + 'Z'),
    merchant: (rawTransaction.module === 'PROCESSING' || rawTransaction.module === 'P2P')
      ? { fullTitle: rawTransaction.name, mcc: null, location: null }
      : null,
    movements: [
      {
        id: rawTransaction.transactionGuid,
        account: { id: account.id },
        invoice: account.instrument === invoice.instrument ? null : invoice,
        sum: account.instrument === invoice.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment,
    groupKeys: [rawTransaction.transactionGuid]
  }

  return transaction
}

export function convertDepositTransaction (deposit, rawTransaction) {
  if (rawTransaction.activity.type === 'INTEREST') {
    return null
  }

  const invoice = {
    sum: rawTransaction.amount / Math.pow(10, rawTransaction.currency.scale),
    instrument: rawTransaction.currency.name
  }

  const stringToHash = `${rawTransaction.paymentDate}_${rawTransaction.amount}`
  const hash = hashString(stringToHash)

  const transaction = {
    date: new Date(rawTransaction.paymentDate.replace('+', '') + 'Z'),
    hold: false,
    merchant: null,
    movements: [
      {
        id: String(hash),
        account: { id: deposit.id },
        invoice: deposit.instrument === invoice.instrument ? null : invoice,
        sum: deposit.instrument === invoice.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment: rawTransaction.activity.description || null
  }

  return transaction
}

export function convertTransaction (apiTransaction, account) {
  switch (apiTransaction.type) {
    case 'cardOrAccount':
      return convertCardOrAccountTransaction(account, apiTransaction.data)
    case 'deposit':
      return convertDepositTransaction(account, apiTransaction.data)
    default:
      return null
  }
}

function hashString (str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash >>> 0
}
