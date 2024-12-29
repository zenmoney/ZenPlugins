import { Account, AccountType, Transaction } from '../../types/zenmoney'
import { getOptNumber, getOptString } from '../../types/get'
import { ConvertResult, OtpAccount, OtpTransaction } from './models'

export function convertAccounts (apiAccounts: OtpAccount[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount, accountsByCba)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccount (apiAccount: OtpAccount, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = apiAccount.accountNumber
  const balance = apiAccount.balance
  let newAccount = false
  let account = accountsByCba[cba]
  if (!account) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: apiAccount.description ?? cba,
        instrument: apiAccount.currencyCode,
        balance,
        creditLimit: 0,
        syncIds: [cba]
      }
    }
    accountsByCba[cba] = account
    newAccount = true
  }
  account.products.push({
    id: apiAccount.accountNumber,
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

export function convertTransaction (apiTransaction: OtpTransaction, account: Account): Transaction {
  const description = apiTransaction.title

  return {
    hold: false,
    date: apiTransaction.date,
    movements: [
      {
        id: getOptString(apiTransaction, 'id') ?? null,
        account: { id: account.id },
        invoice: null,
        sum: apiTransaction.amount,
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
