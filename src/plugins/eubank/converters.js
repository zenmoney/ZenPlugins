import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import _ from 'lodash'

export function convertAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    if (apiAccount.account.status !== 'ACTIVE') {
      continue
    }
    if (apiAccount.account.type === 'CARD' || apiAccount.account.type === 'CURR') {
      accounts.push(convertAccount(apiAccount.details))
    } else if (apiAccount.account.type === 'SAVE') {
      accounts.push(convertDeposit(apiAccount.details))
    } else if (apiAccount.account.type === 'CRED') {
      accounts.push(convertLoan(apiAccount.details))
    } else if (apiAccount.account.type === 'BONS') {
      accounts.push(convertBonus(apiAccount.details))
    } else {
      console.assert(false, 'Don\'t know how to convert account')
    }
  }
  const accountsByNumber = {}
  for (const account of accounts) {
    accountsByNumber[account.mainProduct.number] = account.account || account.accounts
  }
  return {
    accounts,
    accountsByNumber
  }
}

function convertDeposit (apiAccount) {
  const account = convertAccount(apiAccount)
  const endDateInterval = getIntervalBetweenDates(new Date(apiAccount.dateOpened), new Date(apiAccount.expiration))
  return {
    mainProduct: {
      ...account.mainProduct,
      type: 'deposit'
    },
    account: {
      ...account.account,
      type: 'deposit',
      balance: apiAccount.balance,
      startBalance: apiAccount.minBalance,
      startDate: new Date(apiAccount.dateOpened),
      percent: apiAccount.interestRate,
      capitalization: true,
      endDateOffsetInterval: endDateInterval.interval,
      endDateOffset: endDateInterval.count,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function convertLoan (apiAccount) {
  const depositView = convertDeposit(apiAccount)
  return {
    mainProduct: {
      ...depositView.mainProduct,
      type: 'credit'
    },
    account: {
      ...depositView.account,
      type: 'loan',
      balance: -apiAccount.balance,
      startBalance: apiAccount.amount,
      percent: apiAccount.interestRate * 100
    }
  }
}

function convertBonus (apiAccount) {
  const account = convertAccount(apiAccount)
  return {
    mainProduct: {
      ...account.mainProduct,
      type: 'bonus'
    },
    account: {
      ...account.account,
      id: String(apiAccount.id),
      type: 'investment',
      balance: apiAccount.actualBalance,
      instrument: 'KZT',
      title: apiAccount.contractNo
    }
  }
}

function convertAccount (apiAccount) {
  const id = apiAccount.number.slice(-7)
  const syncID = [apiAccount.number]
  if (apiAccount.cards) {
    for (const card of apiAccount.cards) {
      syncID.push(card.number)
    }
  }
  const mainType = apiAccount.type.match(/CARD/i) ? 'card' : 'current'
  const type = apiAccount.type.match(/CARD/i) ? 'ccard' : 'checking'
  const mainProduct = {
    number: apiAccount.number,
    type: mainType
  }
  if (!apiAccount.multiCurrency) {
    return {
      mainProduct,
      account: {
        id,
        type,
        title: (apiAccount.cards && apiAccount.cards.length > 0 && apiAccount.cards[0].number.slice(-5)) || '*' + apiAccount.number.slice(-4),
        instrument: apiAccount.currency,
        syncID,
        balance: apiAccount.actualBalance
      }
    }
  }
  const accounts = []
  let subBalances = apiAccount.subAccountAvailableBalances
  if (!subBalances || subBalances.length === 0) {
    subBalances = apiAccount.subAccountBalances
  }
  for (const balance of subBalances) {
    accounts.push({
      id: id + '-' + balance.currency,
      type,
      title: (apiAccount.cards && apiAccount.cards.length > 0 && (apiAccount.cards[0].number.slice(-5) + '-' + balance.currency)) || '*' + apiAccount.number.slice(-4) + '-' + balance.currency,
      instrument: balance.currency,
      syncID,
      balance: balance.amount
    })
  }
  console.assert(accounts.length > 0, 'Something went wrong, while account converting')
  return {
    mainProduct,
    accounts
  }
}

function adjustAccounts (apiTransactions) {
  const innerTransfers = apiTransactions.filter(transaction => [
    /^.*ПЕР\. С.*$/i,
    /^.*ПЕР\. СО.*$/i,
    /^.*ПЕР\.С.*$/i,
    /^.*ПЕР\.СО.*$/i,
    /^.*НА СЧЕТ.*$/i,
    /^.*НА КАРТ\.СЧЕТ.*$/i
  ].some(regexp => regexp.test(transaction.purpose)))
  const unwantedTransactionsById = []
  const pairedTransactionsById = []
  for (let i = 1, n = innerTransfers.length; i < n; i++) {
    if ((new Date(innerTransfers[i - 1].transactionDate)).getTime() - (new Date(innerTransfers[i].transactionDate)).getTime() <= 106400000 &&
    ((innerTransfers[i - 1].purpose.match(/списание/i) && innerTransfers[i].purpose.match(/зачисл/i)) ||
    (innerTransfers[i].purpose.match(/списание/i) && innerTransfers[i - 1].purpose.match(/зачисл/i)))) { // if it has been less than 24 hours between transactions and these transactions are parts od one
      pairedTransactionsById[innerTransfers[i - 1].id] = true
      unwantedTransactionsById[innerTransfers[i].id] = true
      i++
    }
  }

  return apiTransactions.map(transaction => {
    if (unwantedTransactionsById[transaction.id]) {
      return null
    }
    if (pairedTransactionsById[transaction.id]) {
      return {
        ...transaction,
        pair: true
      }
    }
    return transaction
  }).filter(transaction => transaction)
}

function adjustTransactions (newAccTransactions) {
  const filtered = []
  for (const transaction of newAccTransactions) {
    // eslint-disable-next-line no-undef
    const tr = filtered.find(tr => _.isEqual(_.omit(tr, ['id']), _.omit(transaction, ['id'])))
    if (!tr) {
      filtered.push(transaction)
    }
  }
  /*
  const transactionIds = {}
  const filtered = []
  for (const transaction of newAccTransactions) {
    const key = transaction.dateCreated + '_' + Math.abs(transaction.amount)
    if (transactionIds[key]) {
    } else {
      transactionIds[key] = true
      filtered.push(transaction)
    }
  }
  */
  return filtered
}

export function convertTransactions (apiTransactions, accountData, accountsByNumber) {
  const newApiTransactions = adjustTransactions(adjustAccounts(apiTransactions))
  const transactions = []
  for (const apiTransaction of newApiTransactions) {
    const transaction = convertTransaction(apiTransaction, accountData, accountsByNumber)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return transactions
}

function getAccountFromRow (accountsRow, instrument) {
  for (const accountInRow of accountsRow) {
    if (accountInRow.instrument.match(instrument)) {
      return accountInRow
    }
  }
  return null
}

function convertTransaction (apiTransaction, accountData, accountsByNumber) {
  if ((apiTransaction.amount === 0 && apiTransaction.totalAmount === 0) || apiTransaction.status === 'REJECTED') {
    return null
  }
  if (((apiTransaction.amount > 0 && apiTransaction.totalAmount < 0) || (apiTransaction.amount < 0 && apiTransaction.totalAmount > 0)) &&
    !apiTransaction.purpose.match(/^.*CH .* Acc KAZ Almaty Perevod s karty na kartu.*$/i) && !apiTransaction.purpose.match(/^.*CH.*Credit Acc.*$/i)) {
    return null
  }
  console.assert(['RESERVED', 'DONE', 'IN_PROCESS'].indexOf(apiTransaction.status) >= 0, 'Неизвестный статус транзакции', apiTransaction.id)
  let account = accountData
  if (Array.isArray(account)) {
    account = getAccountFromRow(accountData, apiTransaction.totalAmountCurrency)
  }
  console.assert(account, 'Could not find the right account')
  const invoice = {
    instrument: apiTransaction.amountCurrency,
    sum: apiTransaction.purpose?.match(/^KAZ.*$/i) || apiTransaction.orderType === 'PAYM'
      ? -apiTransaction.amount || -apiTransaction.totalAmount
      : apiTransaction.amount || apiTransaction.totalAmount
  }
  let fee = (apiTransaction.fee && apiTransaction.totalAmount !== 0 && apiTransaction.amount !== 0 && apiTransaction.fee) || 0
  if (fee > 0) {
    fee = -fee
  }
  if (fee !== 0 && apiTransaction.totalAmount === apiTransaction.amount) {
    fee = 0
  }
  const transaction = {
    hold: ['RESERVED', 'IN_PROCESS'].indexOf(apiTransaction.status) >= 0,
    date: new Date(apiTransaction.dateCreated),
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : ((apiTransaction.totalAmount !== 0) && (apiTransaction.totalAmountCurrency === account.instrument)) ? apiTransaction.totalAmount : null,
        fee
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
  parsers.some(parser => parser(transaction, apiTransaction, account, invoice, accountsByNumber))

  return transaction
}

function prepareComment (comment) {
  return comment?.replace(/^\s+/, '').replace(/\s+$/, '').replace(/^[0-9]+\s+/, '').replace(/\.+$/, '') || null
}

function parseComment (transaction, apiTransaction) {
  if (apiTransaction.totalAmount === 0 || apiTransaction.amount === 0) {
    transaction.comment = prepareComment(apiTransaction.purpose)
    return true
  }
  if ([
    /^.*ПЕР\. С.*$/i,
    /^.*ПЕР\. СО.*$/i,
    /^.*ПЕР\.С.*$/i,
    /^.*ПЕР\.СО.*$/i,
    /^.*НА СЧЕТ.*$/i,
    /^.*НА КАРТ\.СЧЕТ.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    transaction.comment = prepareComment(apiTransaction.purpose.split(/.*(ПЕР.*)/i)[1])
    return false
  }
  if ([
    /^.*ПЕРЕВОДОМ С.*СЧЕТА.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    transaction.comment = prepareComment(apiTransaction.purpose.split(/.*(ОТКРЫТИЕ СЧЕТА.*)/i)[1])
    return false
  }
  if ([
    /^.*Трата Бонусов.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    transaction.comment = prepareComment(apiTransaction.purpose)
    return false
  }
  if ([
    /^.*Переводы клиентом денег со своего текущего счета в одном банке.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    transaction.comment = prepareComment(apiTransaction.purpose)
    return false
  }
  if ([
    /^.*Оплата.*услуг.*$/i,
    /^.*Retail.*$/i,
    /^.*Unique.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    transaction.merchant = {
      fullTitle: apiTransaction.recipientName || prepareComment(apiTransaction.purpose.split(/^(Оплата.*услуг[и]*\s*(?:сотовой связи)?|^.*Retail|Unique) /i)[2]),
      mcc: apiTransaction.mcc?.id || null,
      location: null
    }
    return false
  }
  if ([
    /^Perevod s karty na kartu.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    const merchantData = apiTransaction.purpose.split(/(from|to)\s+[a-zA-Z0-9]+\s+([a-zA-Zа-яА-Я ]+)\s+.*/i)
    if (merchantData.length > 2) {
      transaction.merchant = {
        title: merchantData[2],
        city: null,
        country: null,
        mcc: null,
        location: null
      }
    } else {
      transaction.comment = prepareComment(apiTransaction.purpose)
    }
    return false
  }
  transaction.comment = prepareComment(apiTransaction.purpose?.match(/^.*(Note Acceptance )(.*)$/i) ? apiTransaction.purpose?.split(/^.*(Note Acceptance )(.*)$/i)[2] : apiTransaction.purpose)
  return false
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice, accountsByNumber) {
  if (![
    /^.*ПЕР\. С.*$/i,
    /^.*ПЕР\. СО.*$/i,
    /^.*ПЕР\.С.*$/i,
    /^.*ПЕР\.СО.*$/i,
    /^.*НА СЧЕТ.*$/i,
    /^.*НА КАРТ\.СЧЕТ.*$/i,
    /^.*SMART BANK ([cC]redit|[dD]ebit) (from|to).*$/i,
    /^.*ПЕРЕВОДОМ С.*СЧЕТА.*$/i,
    /^.*CH .* Acc KAZ Almaty Perevod s karty na kartu.*$/i,
    /^.*CH.*Credit Acc.*$/i,
    /^.*CH.*Debit Acc.*$/i,
    /^$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    return false
  }
  if ([
    /^.*CH .* Acc KAZ Almaty Perevod s karty na kartu.*$/i,
    /^.*CH.*Credit Acc.*$/i,
    /^.*CH.*Debit Acc.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    if ((apiTransaction.amount > 0 && apiTransaction.totalAmount < 0) || (apiTransaction.amount < 0 && apiTransaction.totalAmount > 0)) {
      transaction.movements[0].sum = -transaction.movements[0].sum
      if (transaction.invoice) {
        transaction.invoice.sum = -transaction.invoice.sum
      }
    }
    transaction.groupKeys = [null, null, apiTransaction.dateCreated.toString().slice(0, 8) + '_' + Math.abs(apiTransaction.amount)]
    return true
  }
  let transferData = ''
  let fromAccountNumber = ''
  let toAccountNumber = ''

  if (apiTransaction.type === 'ORDER') {
    const orderNumber = apiTransaction.orderNumber
    toAccountNumber = apiTransaction.accountSource
    fromAccountNumber = apiTransaction.accountRecipient
    if (toAccountNumber === account.syncID[0]) { // Пока что не понял как сделать. Смысл должен быть такой:  Если fromAccountNumber === account.syncID , то sum:  с минусом
      transaction.movements[0].sum = -Math.abs(invoice.sum)
      invoice.sum = -Math.abs(invoice.sum)
    }
    const fromAccount = accountsByNumber[fromAccountNumber]
    const toAccount = accountsByNumber[toAccountNumber]
    if (fromAccount && toAccount) {
      transaction.groupKeys = [orderNumber.toString(), fromAccountNumber + '_' + toAccountNumber + '_' + apiTransaction.transactionDate.toString().substring(0, 5) + '_' + Math.abs(apiTransaction.amount), apiTransaction.dateCreated.toString().slice(0, 8) + '_' + Math.abs(apiTransaction.amount)]
      return true
    } else if (!fromAccount || !toAccount) {
      return false
    }
    return true
  }

  if (apiTransaction.purpose.match(/^.*ПЕРЕВОДОМ С.*СЧЕТА.*$/i)) {
    fromAccountNumber = apiTransaction.purpose.split(/ПЕР.* ([A-Z0-9]+) .* /i)[1]
    toAccountNumber = apiTransaction.accountSource
  } else if (!apiTransaction.purpose.match(/^.*SMART BANK ([cC]redit|[dD]ebit) (from|to).*$/i)) {
    transferData = apiTransaction.purpose.split(/ПЕР\.?( С| СО|С|СО) .*СЧЕТА ([A-Z0-9]+) НА .*СЧЕТ ([A-Z0-9]+) /i)
    fromAccountNumber = transferData[2]
    toAccountNumber = transferData[3]
  } else {
    transferData = apiTransaction.purpose.split(/.*; ([A-Z0-9]+) .*/i)
    toAccountNumber = transferData[1]
    fromAccountNumber = apiTransaction.accountSource
  }

  let fromAccount = accountsByNumber[fromAccountNumber]
  let toAccount = accountsByNumber[toAccountNumber]

  if ((!apiTransaction.pair) && fromAccount && toAccount) {
    transaction.groupKeys = [null, fromAccountNumber + '_' + toAccountNumber + '_' + apiTransaction.transactionDate.toString().substring(0, 5) + '_' + Math.abs(apiTransaction.amount), apiTransaction.dateCreated.toString().slice(0, 8) + '_' + Math.abs(apiTransaction.amount)]
    return true
  } else if (!fromAccount || !toAccount) {
    return false
  }

  if (Array.isArray(fromAccount)) {
    fromAccount = getAccountFromRow(accountsByNumber[fromAccountNumber], transaction.movements[0].instrument)
  }
  if (Array.isArray(toAccount)) {
    toAccount = getAccountFromRow(accountsByNumber[toAccountNumber], invoice.instrument)
  }

  if (fromAccount && fromAccount.id !== account.id) {
    transaction.movements[0].account.id = fromAccount.id
    if (toAccount.instrument !== fromAccount.instrument) {
      invoice.instrument = toAccount.instrument
      invoice.sum = -transaction.movements[0].sum
    }
    transaction.movements[0].sum = apiTransaction.amount
  }
  if (!fromAccount) {
    return false
  }

  if (transferData[4].match(/c конв\./i)) {
    const transSum = transferData[4].split(/<<\s*([0-9.]+)\s*[A-Z]{3}/i)[1]
    const invoiceSum = transferData[4].split(/=\s*([0-9.]+)\s*[A-Z]{3}/i)[1]
    transaction.movements[0].sum = -transSum
    invoice.sum = -invoiceSum
  } else {
    transaction.movements[0].sum = -Math.abs(transaction.movements[0].sum)
    invoice.sum = -Math.abs(invoice.sum)
  }
  transaction.movements.push({
    id: null,
    account: { id: toAccount.id },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /^.*Perevod s karty na kartu ([cC]redit|[dD]ebit) (from|to).*$/i,
    /^.*P2P.*$/i,
    /^.*Переводы клиентом денег со своего текущего счета в одном банке.*$/i,
    /ПЕР\.?( С| СО|С|СО) .*СЧЕТА ([A-Z0-9]+) НА .*СЧЕТ ([A-Z0-9]+) /i,
    /^$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
    return false
  }
  if (apiTransaction.purpose.match(/Переводы клиентом денег со своего текущего счета в одном банке/i)) {
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        instrument: invoice.instrument,
        syncIds: apiTransaction.accountRecipient && apiTransaction.accountRecipient.length > 0
          ? [apiTransaction.accountRecipient]
          : null,
        type: 'checking'
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
    return true
  }
  let transferData = ''
  let fromAccountNumber = ''
  let toAccountNumber = ''

  if (apiTransaction.type === 'ORDER') {
    toAccountNumber = apiTransaction.accountSource
    if (apiTransaction.accountRecipient) {
      fromAccountNumber = apiTransaction.accountRecipient
    } else if (apiTransaction.reasonDetails && apiTransaction.reasonDetails !== '') {
      const accountData = apiTransaction.reasonDetails.match(/(.*);\s([A-Z0-9]+)/i)
      fromAccountNumber = accountData?.[2]
      const title = accountData?.[1].trim()
      if (title) {
        transaction.merchant = {
          country: null,
          city: null,
          title,
          mcc: null,
          location: null
        }
      } else {
        transaction.merchant = null
      }
    }
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        instrument: invoice.instrument,
        syncIds: invoice.sum > 0 ? [toAccountNumber] : invoice.sum < 0 && fromAccountNumber ? [fromAccountNumber] : null,
        type: 'ccard'
      },
      invoice: null,
      sum: toAccountNumber !== account.syncID[0] ? -Math.abs(invoice.sum) : Math.abs(invoice.sum),
      fee: 0
    })
    transaction.comment = null
    return true
  }

  transferData = apiTransaction.purpose.split(/ПЕР\.?( С| СО|С|СО) .*СЧЕТА ([A-Z0-9]+) НА .*СЧЕТ ([A-Z0-9]+) /i)
  fromAccountNumber = transferData[2]
  toAccountNumber = transferData[3]

  // const fromAccount = accountsByNumber[fromAccountNumber]
  // const toAccount = accountsByNumber[toAccountNumber]

  transferData = apiTransaction.purpose.split(/(from|to) ([a-zA-Z0-9]+) .*/i) // || fromAccount || toAccount
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      instrument: invoice.instrument,
      syncIds: transferData.length > 2
        ? [transferData[2]]
        : (!fromAccountNumber && !toAccountNumber)
            ? null
            : invoice.sum > 0
              ? [fromAccountNumber]
              : invoice.sum < 0 ? [toAccountNumber] : null,
      type: 'ccard'
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /^.*ATM.*$/i,
    /^.*Note Acceptance.*$/i,
    /^Cash.*$/i
  ].some(regexp => regexp.test(apiTransaction.purpose))) {
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

function parsePayee (transaction, apiTransaction) {
  return false
}
