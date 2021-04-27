export const convertAccount = (apiAccount) => {
  const { iban } = apiAccount.account

  return {
    id: iban || apiAccount.accountId,
    title: `${apiAccount.account.accountType.text} (***${iban.slice(-4)})`,
    syncID: [iban, apiAccount.accountId].filter(Boolean),
    instrument: apiAccount.account.currency,
    type: 'checking',
    balance: Number(apiAccount.balance.value),
    startBalance: 0
  }
}

const parseRemittance = (text) => {
  const NUM_FIELD_CHARS = 2
  const TEXT_FIELD_CHARS = 35
  let result = ''

  let cursor = 0
  let fieldCount = 0

  while (cursor < text.length) {
    fieldCount += 1
    const verificationNumber = parseInt(text.substr(cursor, NUM_FIELD_CHARS), 10)
    if (verificationNumber !== fieldCount) {
      throw new Error(`Error parsing remittance info ${text}`)
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
  return `${apiTransaction.transactionType.text} ${parseRemittance(apiTransaction.remittanceInfo)}`
}

export const convertTransaction = (apiTransaction, accountId) => {
  const value = Number(apiTransaction.amount.value)
  const income = value > 0 ? value : 0
  const outcome = value < 0 ? Math.abs(value) : 0

  return {
    id: apiTransaction.reference,
    incomeAccount: accountId,
    outcomeAccount: accountId,
    income,
    outcome,
    payee: (apiTransaction.creditor || apiTransaction.remitter || {}).holderName,
    date: apiTransaction.bookingDate,
    hold: apiTransaction.bookingStatus === 'NOTBOOKED',
    comment: getComment(apiTransaction)
  }
}
