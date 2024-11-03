import { Account, AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { AccountInfo, AccountTransaction } from './types'

export function convertAccounts (apiAccounts: AccountInfo[]): AccountOrCard[] {
  return apiAccounts.map(apiAccount => {
    return {
      id: apiAccount.id,
      type: AccountType.ccard,
      title: apiAccount.name,
      instrument: apiAccount.currency,
      balance: apiAccount.balance,
      available: apiAccount.balance,
      creditLimit: 0,
      syncIds: [apiAccount.id]
    }
  })
}

export function convertTransaction (accountTransaction: AccountTransaction, account: Account, hold = false): Transaction {
  let invoice = null

  if (accountTransaction.currency !== account.instrument) {
    invoice = {
      sum: accountTransaction.amount,
      instrument: accountTransaction.currency
    }
  }

  const merchant = {
    fullTitle: accountTransaction.address,
    mcc: null,
    location: null
  }

  return {
    hold,
    date: accountTransaction.date,
    movements: [
      {
        id: accountTransaction.id,
        account: { id: account.id },
        sum: accountTransaction.amount,
        fee: 0,
        invoice
      }
    ],
    merchant,
    comment: null
  }
}
