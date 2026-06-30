import { AccountOrCard, AccountType, ExtendedTransaction } from '../../types/zenmoney'
import { AccountInfo, AccountTransaction } from './types'

export function convertAccounts (apiAccounts: AccountInfo[]): AccountOrCard[] {
  return apiAccounts.map(account => ({
    id: account.iban,
    type: AccountType.checking,
    title: account.name,
    instrument: account.currency,
    balance: account.balance,
    syncIds: [account.iban, account.accountNumber]
  }))
}

export function convertTransaction (apiTransaction: AccountTransaction, account: AccountInfo): ExtendedTransaction | null {
  if (apiTransaction.amount === 0) {
    return null
  }

  const transaction: ExtendedTransaction = {
    hold: false,
    date: apiTransaction.date,
    movements: [
      {
        id: apiTransaction.id,
        account: { id: account.iban },
        sum: apiTransaction.currency === account.currency ? apiTransaction.amount : null,
        fee: 0,
        invoice: apiTransaction.currency !== account.currency && apiTransaction.currency !== undefined
          ? { sum: apiTransaction.amount, instrument: apiTransaction.currency }
          : null
      }
    ],
    merchant: null,
    comment: null
  }

  if (isCash(apiTransaction.description)) {
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        instrument: apiTransaction.currency ?? account.currency,
        syncIds: null,
        type: AccountType.cash
      },
      invoice: null,
      sum: -apiTransaction.amount,
      fee: 0
    })
    transaction.comment = apiTransaction.description
  } else if (isTransfer(apiTransaction.description)) {
    transaction.comment = apiTransaction.description
  } else {
    transaction.merchant = {
      fullTitle: apiTransaction.description,
      mcc: null,
      location: null
    }
  }

  return transaction
}

function isCash (description: string): boolean {
  return /ATM|Gotovinska/i.test(description)
}

function isTransfer (description: string): boolean {
  return /Interni transfer|Kupovina deviza|Uplata/i.test(description)
}
