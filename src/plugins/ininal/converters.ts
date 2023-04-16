import { Account, AccountType, AccountOrCard, Transaction } from '../../types/zenmoney'
import { AccountInfo, AccountTransaction } from './models'

export function convertAccount(apiAccount: AccountInfo): AccountOrCard {
  return {
    id: apiAccount.number,
    type: AccountType.ccard,
    title: apiAccount.name,
    instrument: apiAccount.currency,
    balance: apiAccount.balance,
    creditLimit: 0,
    syncIds: [
      apiAccount.number,
      ...apiAccount.cardNumbers,
    ]
  }
}

export function convertTransaction(accountTransaction: AccountTransaction, account: Account): Transaction {
  return {
    hold: false,
    date: accountTransaction.date,
    movements: [
      {
        id: accountTransaction.reference,
        account: { id: account.id },
        sum: accountTransaction.amount,
        fee: 0,
        invoice: null
      }
    ],
    merchant: null,
    comment: accountTransaction.description
  }
}
