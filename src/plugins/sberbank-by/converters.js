import { keyBy, sortBy } from 'lodash'
import codeToCurrency from '../../common/codeToCurrencyLookup'
import { toISODateString } from '../../common/dateUtils'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

function convertProduct (card) {
  return {
    id: card.cardId,
    type: 'card'
  }
}

export function convertSavingsAccount (apiAccount) {
  return {
    account: {
      id: apiAccount.id,
      type: 'checking',
      title: apiAccount.name || apiAccount.statusDescription,
      instrument: codeToCurrency[apiAccount.contractCurrency],
      syncID: [
        apiAccount.ibannum
      ],
      balance: apiAccount.balance,
      savings: true,
      archive: apiAccount.status === 'CLOSED'
    }
  }
}

function handleAccountsByContractNumber (account) {
  return {
    id: account.account.id,
    instrument: account.account.instrument
  }
}

function adjustAccounts ({ accounts }) {
  const accountsByNumber = keyBy(accounts, apiAccount => apiAccount.contractNumber)
  for (const apiAccount of accounts) {
    const parent = apiAccount.refContractNumber ? accountsByNumber[apiAccount.refContractNumber] : null
    if (!parent) {
      continue
    }
    parent.amount = apiAccount.amount
    parent.overdraftLimit = apiAccount.overdraftLimit
    parent.dateEnd = apiAccount.dateEnd
    apiAccount.refContractNumber = 0xdeadbeaf
  }

  return accounts.filter(account => !account.refContractNumber || account.refContractNumber !== 0xdeadbeaf)
}

export function convertAccounts (apiAccounts) {
  const accountsByContractNumber = {}
  const accounts = []
  const products = []
  const adjustedApiAccounts = adjustAccounts(apiAccounts)
  for (const rawAccount of adjustedApiAccounts) {
    const account = {
      ...rawAccount,
      name: rawAccount.name.replace(/^\s*/i, '').replace(/\s*$/i, '')
    }
    let convertedAccount = null
    if (!account.overdraftLimit && (account.productClassId === 1 || account.productClassId === 2)) {
      convertedAccount = convertAccount(account)
    } else if (account.productClassId === 3 || account.overdraftLimit) {
      convertedAccount = convertLoan(account)
    } else {
      console.assert(false, 'Unknown account type', account)
    }
    accountsByContractNumber[account.contractNumber] = handleAccountsByContractNumber(convertedAccount)
    accounts.push(convertedAccount.account)
    if (convertedAccount.products) {
      products.push(...convertedAccount.products)
    }
  }
  for (const moneyBox of apiAccounts.moneyBoxes) {
    const convertedChecking = convertSavingsAccount(moneyBox)
    accountsByContractNumber[moneyBox.contractId] = handleAccountsByContractNumber(convertedChecking)
    accounts.push(convertedChecking.account)
  }
  return {
    accountsByContractNumber,
    accounts,
    products
  }
}

function parseMetalInstrument (code) {
  switch (code) {
    case 'XAU':
      return 'A98'
    case 'XAG':
      return 'A99'
    case 'XPT':
      return 'A76'
    case 'XPD':
      return 'A33'
    default:
      return code
  }
}

function getApiTransactionReferenceCodes (apiTransaction) {
  const rrn = apiTransaction.rnnCode || apiTransaction.souRnnCode || ''
  const authorizationCode = apiTransaction.authorizationCode && apiTransaction.authorizationCode !== '000000'
    ? apiTransaction.authorizationCode
    : ''
  return { rrn, authorizationCode }
}

function getAccountLevelEventId (apiTransaction, rrn, authorizationCode) {
  return !rrn && !authorizationCode && !(apiTransaction.cardId || apiTransaction.cardPAN)
    ? apiTransaction.eventId || ''
    : ''
}

function getApiTransactionDedupKey (apiTransaction) {
  const { rrn, authorizationCode } = getApiTransactionReferenceCodes(apiTransaction)
  const accountLevelEventId = getAccountLevelEventId(apiTransaction, rrn, authorizationCode)
  const referenceKey = rrn || authorizationCode
  const cardKey = referenceKey ? '' : apiTransaction.cardId || apiTransaction.cardPAN || ''
  const dateKey = rrn || authorizationCode
    ? toISODateString(new Date(apiTransaction.eventDate))
    : String(apiTransaction.eventDate)
  return [
    apiTransaction.contractId,
    cardKey,
    dateKey,
    Math.abs(apiTransaction.transactionSum),
    apiTransaction.transactionCurrency || '',
    referenceKey,
    accountLevelEventId
  ].join('_')
}

function shouldReplaceApiTransaction (currentTransaction, nextTransaction) {
  if (currentTransaction.eventStatus === 0 && nextTransaction.eventStatus !== 0) {
    return true
  }
  if (!currentTransaction.processingDate && nextTransaction.processingDate) {
    return true
  }
  return false
}

function deduplicateApiTransactions (apiTransactions) {
  const uniqueTransactions = []
  const transactionIndexesByKey = {}
  for (const apiTransaction of sortBy(apiTransactions, apiTransaction => apiTransaction.transactionName?.match(/Перевод/))) {
    const key = getApiTransactionDedupKey(apiTransaction)
    const index = transactionIndexesByKey[key]
    if (index === undefined) {
      transactionIndexesByKey[key] = uniqueTransactions.length
      uniqueTransactions.push(apiTransaction)
      continue
    }
    if (shouldReplaceApiTransaction(uniqueTransactions[index], apiTransaction)) {
      uniqueTransactions[index] = apiTransaction
    }
  }
  return uniqueTransactions
}

function getTransactionDedupKey (transaction) {
  const movement = transaction.movements?.[0]
  if (!movement) {
    return null
  }
  if (transaction.dedupIdentity) {
    return `${movement.account.id}_${transaction.dedupIdentity}`
  }
  return `${movement.account.id}_${transaction.date.getTime()}_${Math.abs(movement.sum)}`
}

function shouldReplaceTransaction (currentTransaction, nextTransaction) {
  return currentTransaction.hold && !nextTransaction.hold
}

export function convertTransactions (apiTransactions, accountsByContractNumber) {
  const adjustedApiTransactions = deduplicateApiTransactions(apiTransactions)
  const transactions = []
  const transactionIndexes = {}
  for (const transaction of adjustedApiTransactions) {
    if (accountsByContractNumber[transaction.contractId]) {
      const answer = convertTransaction(transaction, accountsByContractNumber[transaction.contractId])
      if (answer !== null) {
        const key = getTransactionDedupKey(answer)
        if (key === null) {
          transactions.push(answer)
          continue
        }
        const index = transactionIndexes[key]
        if (index === undefined) {
          transactionIndexes[key] = transactions.length
          transactions.push(answer)
        } else if (shouldReplaceTransaction(transactions[index], answer)) {
          transactions[index] = answer
        }
      }
    }
  }
  return transactions
}

export function convertAccount (apiAccount) {
  const syncID = []
  if (apiAccount.account) {
    syncID.push(apiAccount.account)
  }
  syncID.push(...apiAccount.cardList.map((card) => {
    return card.panCode
  }))
  if (apiAccount.refContractNumber) {
    syncID.push(apiAccount.refContractNumber)
  }
  if (syncID.length === 0) {
    syncID.push(apiAccount.contractNumber.replace(/[^\d]/g, ''))
  }
  return {
    products: apiAccount.cardList.map(convertProduct),
    account: {
      id: apiAccount.contractId,
      type: 'ccard',
      title: apiAccount.cardList.length > 0 ? apiAccount.cardList[0].panCode.slice(-5) : apiAccount.account ? '*' + apiAccount.account.slice(-4) : apiAccount.name,
      instrument: parseMetalInstrument(codeToCurrency[apiAccount.currencyCode]),
      syncID,
      balance: apiAccount.amount
    }
  }
}

function converCreditCard (apiAccount, baseAccount) {
  return {
    products: baseAccount.products,
    account: {
      id: baseAccount.account.id,
      title: baseAccount.account.title,
      instrument: baseAccount.account.instrument,
      syncID: baseAccount.account.syncID,
      available: getFloatMoneyAmount(apiAccount.amount), // - apiAccount.overdraftLimit),
      creditLimit: apiAccount.overdraftLimit,
      type: 'ccard',
      percent: +apiAccount.percentRate
    }
  }
}

export function convertLoan (apiAccount) {
  const startDate = new Date(apiAccount.dateStart)
  const endDateInterval = getIntervalBetweenDates(startDate, new Date(apiAccount.dateEnd))
  const baseAccount = convertAccount(apiAccount)
  if (apiAccount.overdraftLimit || [
    'карта',
    'card',
    'кредитка'
  ].some(str => apiAccount.name.match(str))) {
    return converCreditCard(apiAccount, baseAccount)
  } else {
    return {
      products: baseAccount.products,
      account: {
        ...baseAccount.account,
        balance: apiAccount.creditRest ? -apiAccount.creditRest : apiAccount.amount ? -apiAccount.amount : 0,
        startBalance: apiAccount.creditRest ? apiAccount.amount : apiAccount.overdraftLimit ? apiAccount.overdraftLimit : 0,
        type: 'loan',
        startDate,
        capitalization: true,
        percent: +apiAccount.percentRate,
        endDateOffsetInterval: endDateInterval.interval,
        endDateOffset: endDateInterval.count,
        payoffInterval: 'month',
        payoffStep: 1
      }
    }
  }
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.eventStatus === -1 || apiTransaction.transactionSum === 0) {
    return null
  }
  const { rrn, authorizationCode } = getApiTransactionReferenceCodes(apiTransaction)
  const currency = apiTransaction.transactionCurrency.length === 3
    ? apiTransaction.transactionCurrency
    : apiTransaction.transactionCurrency.length === 2 ? `0${apiTransaction.transactionCurrency}` : `00${apiTransaction.transactionCurrency}`
  const invoice = {
    instrument: codeToCurrency[currency],
    sum: apiTransaction.transactionType ? apiTransaction.transactionType * apiTransaction.transactionSum : apiTransaction.transactionSum
  }
  const transaction = {
    hold: apiTransaction.eventStatus === 0,
    date: new Date(apiTransaction.eventDate),
    movements: [
      {
        id: apiTransaction.eventId,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument
          ? invoice.sum
          : apiTransaction.accountSum ? apiTransaction.transactionType * apiTransaction.accountSum : null,
        fee: -apiTransaction.commissionSum || 0
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

  const accountLevelEventId = getAccountLevelEventId(apiTransaction, rrn, authorizationCode)
  if (accountLevelEventId) {
    Object.defineProperty(transaction, 'dedupIdentity', {
      value: accountLevelEventId,
      enumerable: false,
      configurable: true
    })
  }

  return transaction
}

function parseComment (transaction, apiTransaction) {
  const transactionName = apiTransaction.transactionName.replace(/\s*null\s*$/ig, '').replace(/^\s*null\s*/ig, '').replace(/null\s*/ig, '')
  const transactionTitle = apiTransaction.merchantPlace?.match(/(.*)\s>\s(.*)\s([A-Z]{3})/i)
  if ([
    /^.*Терминал.*$/i
  ].some(regexp => regexp.test(transactionName))) {
    transaction.merchant = {
      title: transactionTitle ? transactionTitle[1] : transactionName.match(/Терминал: [0-9a-zA-Z]+/i)[0],
      location: null,
      city: transactionTitle ? transactionTitle[2] : null,
      country: transactionTitle ? transactionTitle[3] : transactionName.match(/.*;([a-zA-Z]+)/i)[0].split(';')[1],
      mcc: apiTransaction.mccCode
        ? Number(apiTransaction.mccCode) > 0 ? Number(apiTransaction.mccCode) : null
        : null
    }
    return false
  }
  if ([
    /^.*наличност.*$/i
  ].some(regexp => regexp.test(transactionName))) {
    transaction.comment = transactionName
    return false
  }
  if (apiTransaction.mccCode && apiTransaction.merchantName?.indexOf('SOU BPS-Sberbank') < 0) {
    transaction.merchant = {
      title: apiTransaction.merchantName,
      city: null,
      country: null,
      location: null,
      mcc: apiTransaction.mccCode
        ? Number(apiTransaction.mccCode) > 0 ? Number(apiTransaction.mccCode) : null
        : null
    }
    if (transactionName?.indexOf('Покупка') < 0 || apiTransaction.merchantName === null) {
      transaction.comment = transactionName
    }
  } else {
    transaction.comment = transactionName
  }
  return false
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /^.*на свои карты.*$/i
  ].some(regexp => regexp.test(apiTransaction.transactionName))) {
    transaction.groupKeys = [apiTransaction.souEventId]
    return true
  }
  if ([
    /Дополнительный взнос/i
  ].some(regexp => regexp.test(apiTransaction.transactionName))) {
    transaction.groupKeys = [toISODateString(transaction.date) + '_' + invoice.instrument + '_' + Math.abs(invoice.sum)]
    return true
  }
  if ([
    /P2P SOU Sber/i
  ].some(regexp => regexp.test(apiTransaction.transactionName))) {
    return true
  }
  if ([
    /Пополнение вклада.*\(on-line\).*/i
  ].some(regexp => regexp.test(apiTransaction.transactionName))) {
    const syncIds = apiTransaction.transactionName.match(/\(on-line\) ([\d\w]*)/i)
    transaction.movements.push({
      id: null,
      account: {
        type: apiTransaction.transactionName.match(/вклад/i) ? 'checking' : 'ccard',
        instrument: codeToCurrency[apiTransaction.transactionCurrency],
        company: null,
        syncIds: [syncIds[1]] || null
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
    transaction.groupKeys = [toISODateString(transaction.date) + '_' + invoice.instrument + '_' + Math.abs(invoice.sum)]
    return true
  }
  return false
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /^.*на "чужие" карты.*$/i,
    /^.*Пополнение вклада.*$/i,
    /^P2P.*$/i
  ].some(regexp => regexp.test(apiTransaction.transactionName))) {
    if (!apiTransaction.transactionType) {
      transaction.movements[0].sum = invoice.instrument === account.instrument
        ? -apiTransaction.transactionSum
        : apiTransaction.accountSum ? -apiTransaction.accountSum : null
      if (transaction.movements[0].invoice) {
        transaction.movements[0].invoice.sum = -Math.abs(transaction.movements[0].invoice.sum)
      }
    }
    if ((transaction.movements[0].sum > 0 && invoice.sum < 0) || (transaction.movements[0].sum < 0 && invoice.sum > 0)) {
      invoice.sum = -invoice.sum
    }
    const pan = apiTransaction.transactionName.match(/\d{6}\*{6}\d{4}/i)
    if (!pan || pan[0] !== apiTransaction.cardPAN) {
      transaction.movements.push({
        id: null,
        account: {
          type: apiTransaction.transactionName.match(/вклад/i) ? 'checking' : 'ccard',
          instrument: codeToCurrency[apiTransaction.transactionCurrency],
          company: null,
          syncIds: pan ? [pan[0].substring(12, 16)] : null
        },
        invoice: null,
        sum: -invoice.sum,
        fee: 0
      })
    } else {
      transaction.movements.push({
        id: null,
        account: {
          type: apiTransaction.transactionName.match(/вклад/i) ? 'checking' : 'ccard',
          instrument: codeToCurrency[apiTransaction.transactionCurrency],
          company: null,
          syncIds: pan ? [pan[0].substring(12, 16)] : null
        },
        invoice: null,
        sum: -invoice.sum,
        fee: 0
      })
    }
    return true
  }
  return false
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /^.*наличност.*$/i
  ].some(regexp => regexp.test(apiTransaction.transactionName))) {
    transaction.movements.push({
      id: null,
      account: {
        type: 'cash',
        instrument: codeToCurrency[apiTransaction.transactionCurrency],
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
    return false
  }
  return false
}

function parsePayee (transaction, apiTransaction) {
  return false
}

function getFloatMoneyAmount (amount) {
  return +amount.toFixed(2)
}
