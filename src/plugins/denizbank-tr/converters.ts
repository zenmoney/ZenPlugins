import { Account, AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { AccountInfo, AccountTransaction, CardTransaction } from './api'

export function convertAccounts (apiAccounts: AccountInfo[]): AccountOrCard[] {
  return apiAccounts.map(apiAccount => {
    return {
      id: apiAccount.id,
      type: AccountType.ccard,
      title: apiAccount.name,
      instrument: apiAccount.currency,
      balance: apiAccount.balance,
      available: apiAccount.available,
      creditLimit: 0,
      syncIds: [
        apiAccount.iban
      ]
    }
  })
}

export function convertTransaction (accountTransaction: AccountTransaction, account: Account, cardTransaction?: CardTransaction): Transaction {
  let invoice = null
  if (cardTransaction && cardTransaction.currency !== accountTransaction.currency) {
    invoice = {
      sum: cardTransaction.amount,
      instrument: cardTransaction.currency
    }
  }

  let merchant = null
  if (accountTransaction.description != null) {
    merchant = {
      fullTitle: accountTransaction.description,
      mcc: null,
      location: null
    }
  }

  return {
    hold: false,
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
    comment: cardTransaction ? cardTransaction.description : null
  }
}
