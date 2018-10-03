import { sanitizeSyncId } from '../../common/accounts'

export function convertAccount (apiAccount) {
  return {
    id: sanitizeSyncId(apiAccount.account_code),
    type: 'checking',
    title: apiAccount.account_code,
    syncID: [apiAccount.account_code]
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
