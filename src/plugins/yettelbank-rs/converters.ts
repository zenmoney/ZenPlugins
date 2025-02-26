import { Account, AccountType, Transaction } from '../../types/zenmoney'
import { getOptNumber, getOptString } from '../../types/get'
import { AccountInfo, ConvertResult, TransactionInfo } from './models'

export function convertAccount (account: AccountInfo): Account {
  return {
    id: account.id,
    type: AccountType.ccard,
    title: account.title,
    instrument: account.instrument,
    syncIds: account.syncIds,
    balance: account.balance
  }
}

export function convertAccounts (apiAccounts: AccountInfo[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccountInternal(apiAccount, accountsByCba)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccountInternal (apiAccount: AccountInfo, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = apiAccount.id
  const balance = apiAccount.balance
  let newAccount = false
  let account = accountsByCba[cba]
  if (!account) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: apiAccount.title ?? cba,
        instrument: apiAccount.instrument,
        balance,
        creditLimit: 0,
        syncIds: [
          cba
        ]
      }
    }
    accountsByCba[cba] = account
    newAccount = true
  }
  account.products.push({
    id: apiAccount.id,
    transactionNode: ''
  })

  const pan = getOptString(apiAccount, 'pan')
  if (pan != null) {
    account.account.syncIds.push(pan)
  }

  const moneyAmount = getOptNumber(apiAccount, 'moneyAmount.value')
  if (moneyAmount != null) {
    account.account.creditLimit = moneyAmount - balance
  }
  return newAccount ? account : null
}

export function convertTransaction (transaction: TransactionInfo, apiAccount: AccountInfo): Transaction {
  return {
    hold: transaction.isPending,
    date: transaction.date,
    movements: [
      {
        id: null,
        account: { id: apiAccount.id },
        invoice: null,
        sum: transaction.amount,
        fee: 0
      }
    ],
    merchant: {
      fullTitle: transaction.title,
      mcc: null,
      location: null
    },
    comment: null
  }
}

export function convertAccountWithCba (apiAccount: AccountInfo, cba: string): Account {
  return {
    id: apiAccount.id,
    type: AccountType.ccard,
    title: apiAccount.title ?? cba,
    instrument: apiAccount.instrument,
    syncIds: apiAccount.syncIds,
    balance: apiAccount.balance
  }
}
