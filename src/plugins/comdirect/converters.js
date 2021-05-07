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
      throw new Error(`Error parsing remittance info ${text}. Should've encountered ${controlString} at position ${cursor + 1}. Instead got ${actualString}`)
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

export const convertTransaction = (apiTransaction, accountId) => {
  const value = Number(apiTransaction.amount.value)
  const income = value > 0 ? value : 0
  const outcome = value < 0 ? Math.abs(value) : 0

  const result = {
    id: apiTransaction.reference,
    incomeAccount: accountId,
    outcomeAccount: accountId,
    income,
    outcome,
    date: new Date(apiTransaction.bookingDate),
    hold: apiTransaction.bookingStatus === 'NOTBOOKED',
    comment: getComment(apiTransaction)
  }

  const payeeInfo = apiTransaction.creditor || apiTransaction.remitter
  if (payeeInfo) {
    result.payee = payeeInfo.holderName
  }

  return result
}
