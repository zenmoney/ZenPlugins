import { Account, AccountType, Amount, Transaction } from '../../types/zenmoney'
import { getNumber, getOptNumber, getOptString, getString } from '../../types/get'
import { ConvertResult } from './models'

export function convertAccounts (apiAccounts: unknown[]): ConvertResult[] {
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

function convertAccount (apiAccount: unknown, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = getString(apiAccount, 'cba')
  const balance = getNumber(apiAccount, 'accountBalance.value')
  let newAccount = false
  let account = accountsByCba[cba]
  if (account == null) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: getOptString(apiAccount, 'product') ?? cba,
        instrument: getString(apiAccount, 'currency.shortName'),
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
    id: getString(apiAccount, 'id'),
    transactionNode: getString(apiAccount, 'transactionNode')
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

export function convertTransaction (apiTransaction: unknown, account: Account): Transaction {
  const description = getOptString(apiTransaction, 'description')
  const accountAmount = parseAmount(apiTransaction, 'accountAmount')
  const invoice = parseAmount(apiTransaction, 'amount')

  return {
    hold: getString(apiTransaction, 'type') !== 'TRANSACTION',
    date: new Date(getString(apiTransaction, 'operationTime')),
    movements: [
      {
        id: getOptString(apiTransaction, 'id') ?? null,
        account: { id: account.id },
        invoice: accountAmount.instrument === invoice.instrument ? null : invoice,
        sum: accountAmount.sum,
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

function parseAmount (data: unknown, path: string): Amount {
  return {
    sum: getNumber(data, `${path}.value`),
    instrument: getString(data, `${path}.currency.shortName`)
  }
}
