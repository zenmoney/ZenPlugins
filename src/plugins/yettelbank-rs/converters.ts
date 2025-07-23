import { Account, AccountType, Transaction } from '../../types/zenmoney'
import { getOptNumber, getOptString } from '../../types/get'
import { AccountInfo, ConvertResult, TransactionInfo } from './models'

export function convertAccount (account: AccountInfo): Account {
  return {
    id: account.id,
    type: AccountType.ccard,
    title: account.name,
    instrument: account.currency,
    syncIds: [account.id]
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
  if (account == null) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: apiAccount.name ?? cba,
        instrument: apiAccount.currency,
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

export function convertTransaction (apiTransaction: TransactionInfo, account: Account): Transaction {
  const description = apiTransaction.title
  const amount = apiTransaction.amount

  return {
    hold: apiTransaction.isPending,
    date: apiTransaction.date,
    movements: [
      {
        id: getOptString(apiTransaction, 'id') ?? null,
        account: { id: account.id },
        invoice: null,
        sum: amount,
        fee: 0
      }
    ],
    merchant: description != null
      ? {
          fullTitle: description,
          mcc: null,
          location: null
        }
      : null,
    comment: null
  }
}
