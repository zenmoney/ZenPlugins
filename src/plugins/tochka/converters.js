export function convertAccount (apiAccount) {
  return {
    id: apiAccount.code,
    type: 'checking',
    title: apiAccount.code,
    syncID: [apiAccount.code],
    instrument: 'RUB'
  }
}

export function convertTransaction (apiTransaction, account) {
  const transaction = {
    id: apiTransaction.payment_bank_system_id,
    date: apiTransaction.payment_date,
    incomeAccount: account.id,
    outcomeAccount: account.id,
    payee: apiTransaction.counterparty_name || null,
    comment: apiTransaction.payment_purpose || null
  }
  if (apiTransaction.payment_amount > 0) {
    transaction.income = Number(apiTransaction.payment_amount)
    transaction.outcome = 0
  } else {
    transaction.income = 0
    transaction.outcome = -Number(apiTransaction.payment_amount)
  }
  return transaction
}
