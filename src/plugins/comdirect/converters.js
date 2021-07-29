export const convertAccount = (apiAccount) => {
  const { iban } = apiAccount.account

  const checkingAccountTypes = ['CA']
  const savingsAccountTypes = ['DAS', 'SA']
  const supportedAccountTypes = [...checkingAccountTypes, ...savingsAccountTypes]

  const accountType = apiAccount.account.accountType.key
  if (!(supportedAccountTypes.includes(accountType))) {
    console.log(`Unsupported account type: ${accountType} - ${apiAccount.account.accountType.text}`)
    return null
  }

  const result = {
    id: iban || apiAccount.accountId,
    title: `${apiAccount.account.accountType.text} (***${iban.slice(-4)})`,
    syncID: [iban, apiAccount.accountId].filter(Boolean),
    instrument: apiAccount.account.currency,
    type: 'checking',
    balance: Number(apiAccount.balance.value),
    startBalance: 0
  }

  if (savingsAccountTypes.includes(accountType)) {
    result.savings = true
  }

  const creditLimit = Number(apiAccount.account.creditLimit.value)
  if (creditLimit > 0) {
    result.creditLimit = Number(creditLimit)
  }

  return result
}

const parseRemittance = (text) => {
  const NUM_FIELD_CHARS = 2
  const TEXT_FIELD_CHARS = 35
  let result = ''

  let cursor = 0
  let fieldCount = 0

  while (cursor < text.length) {
    fieldCount += 1
    const actualString = text.substr(cursor, NUM_FIELD_CHARS)
    const controlString = (fieldCount < 10 ? '0' : '') + fieldCount

    if (controlString !== actualString) {
      // throw new Error(`Error parsing remittance info ${text}. Should've encountered ${controlString} at position ${cursor + 1}. Instead got ${actualString}`)
    }

    cursor += NUM_FIELD_CHARS
    result += text.substr(cursor, TEXT_FIELD_CHARS)
    cursor += TEXT_FIELD_CHARS
  }

  const edge = result.indexOf('End-to-End-Ref')
  if (edge >= 0) {
    result = result.substring(0, edge)
  }
  result = result.trim()

  result = result.replace(/\s\s+/g, ' | ')

  return result
}

const getComment = (apiTransaction) => {
  return `[${apiTransaction.transactionType.text}] ${parseRemittance(apiTransaction.remittanceInfo)}`
}

function parseDate (apiTransaction) {
  let date = new Date(apiTransaction.bookingDate)
  let dateInfo = ''
  if (apiTransaction.bookingStatus === 'NOTBOOKED') {
    dateInfo = apiTransaction.remittanceInfo?.match(/(.*)\s(\d{4}-\d{2}-\d{2}T\d+:\d+:\d+)/i)
    // date = dateInfo ? new Date(dateInfo[2]) : new Date(apiTransaction.bookingDate)
  } else if (apiTransaction.bookingStatus === 'BOOKED') {
    dateInfo = apiTransaction.remittanceInfo?.match(/(.*)\s*\d{2}(\d{4}-\d{2}-\d{2}T\d+:\d+:\d+)/i)
    // date = dateInfo ? new Date(dateInfo[2]) : new Date(apiTransaction.bookingDate)
  }
  if (dateInfo && dateInfo[2]) {
    date = new Date(dateInfo[2] + '.000Z')
  }
  return date
}

export function convertTransaction (apiTransaction, account) {
  const invoice = {
    instrument: apiTransaction.amount.unit,
    sum: Number(apiTransaction.amount.value)
  }
  const transaction = {
    hold: apiTransaction.bookingStatus === 'BOOKED',
    date: parseDate(apiTransaction),
    movements: [
      {
        id: apiTransaction.reference !== ' ' ? apiTransaction.reference : null,
        account: { id: account.id },
        invoice: invoice.instrument !== account.instrument ? invoice : null,
        sum: invoice.instrument !== account.instrument ? invoice.sum : invoice.sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: getComment(apiTransaction)
  };
  [
    parsePayee,
    parseOuterTransfer,
    parseCashTransfer
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /TRANSFER/i,
    /CARD_TRANSACTION/i
  ].some(regex => regex.test(apiTransaction.transactionType?.key))) {
    return false
  }

  const syncIds = apiTransaction.creditor?.iban
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      instrument: invoice.instrument,
      syncIds: syncIds ? [syncIds] : null,
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
    /ATM_WITHDRAWAL/i
  ].some(regex => regex.test(apiTransaction.transactionType?.key))) {
    return false
  }

  transaction.movements.push({
    id: null,
    account: {
      company: null,
      instrument: invoice.instrument,
      syncIds: null,
      type: 'cash'
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })

  return true
}

function parsePayee (transaction, apiTransaction) {
  const fullTitle = apiTransaction.creditor?.holderName || apiTransaction.remitter?.holderName
  if (fullTitle) {
    transaction.merchant = {
      fullTitle: fullTitle,
      location: null,
      mcc: null
    }
  }
  let remittanceInfo = ''
  if (apiTransaction.bookingStatus === 'NOTBOOKED') {
    remittanceInfo = apiTransaction.remittanceInfo?.match(/(.*)\s((\d{4}-\d{2}-\d{2})T\d+:\d+:\d+)/i)
    transaction.comment = null
  } else if (apiTransaction.bookingStatus === 'BOOKED') {
    remittanceInfo = apiTransaction.remittanceInfo?.match(/(.*)\s*\d{2}(\d{4}-\d{2}-\d{2}T\d+:\d+:\d+)/i)
  } else {
    remittanceInfo = apiTransaction.remittanceInfo?.match(/^\d{2}(.*)\/\/.*/i)
  }
  if (remittanceInfo) {
    transaction.merchant = {
      fullTitle: remittanceInfo[1].trim(),
      location: null,
      mcc: null
    }
    transaction.comment = null
  }
  // return true
}
