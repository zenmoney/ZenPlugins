import { Account, AccountType, Transaction } from '../../types/zenmoney'
import type { FetchCardAccount, FetchTransaction } from './types/fetch'

export const convertCardAccount = (fetchAccount: FetchCardAccount): Account => {
  const account: Account = {
    id: '',
    title: '',
    balance: 0,
    instrument: '',
    syncIds: [],
    type: AccountType.ccard
  }

  return account
}

export const convertTransaction = (fetchTransaction: FetchTransaction): Transaction => {
  const transaction: Transaction = {
    hold: null, // fix
    date: new Date(fetchTransaction.paymentDate),
    comment: '' // fix
  }

  return transaction
}
