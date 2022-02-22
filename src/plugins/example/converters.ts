import { Account, AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import get from '../../types/get'

export interface Product {
  id: string
  transactionNode: string
}

export interface ConvertResult {
  products: Product[]
  account: AccountOrCard
}

export function convertAccounts (apiAccounts: unknown[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []
  for (const apiAccount of apiAccounts) {
    const cba = get(apiAccount, 'cba') as string
    const balance = get(apiAccount, 'accountBalance.value') as number
    const product: Product = {
      id: get(apiAccount, 'id') as string,
      transactionNode: get(apiAccount, 'transactionNode') as string
    }

    let account = accountsByCba[cba]
    if (!account) {
      account = {
        products: [],
        account: {
          id: cba,
          type: AccountType.ccard,
          title: (get(apiAccount, 'product') || cba) as string,
          instrument: get(apiAccount, 'currency.shortName') as string,
          balance,
          creditLimit: 0,
          syncIds: [
            cba
          ]
        }
      }
      accounts.push(account)
      accountsByCba[cba] = account
    }
    account.products.push(product)

    const pan = get(apiAccount, 'pan')
    if (pan) {
      account.account.syncIds.push(pan as string)
    }
    const moneyAmount = get(apiAccount, 'moneyAmount.value')
    if (moneyAmount) {
      account.account.creditLimit = (moneyAmount as number) - balance
    }
  }
  return accounts
}

export function convertTransaction (apiTransaction: unknown, account: Account): Transaction {
  const description = get(apiTransaction, 'description')
  return {
    hold: get(apiTransaction, 'type') !== 'TRANSACTION',
    date: new Date(get(apiTransaction, 'operationTime') as string),
    movements: [
      {
        id: (get(apiTransaction, 'id', null)) as (string | null),
        account: { id: account.id },
        invoice: get(apiTransaction, 'accountAmount.currency.shortName') === get(apiTransaction, 'amount.currency.shortName')
          ? null
          : {
              sum: get(apiTransaction, 'amount.value') as number,
              instrument: get(apiTransaction, 'amount.currency.shortName') as string
            },
        sum: get(apiTransaction, 'accountAmount.value') as number,
        fee: 0
      }
    ],
    merchant: description
      ? {
          fullTitle: description as string,
          mcc: null,
          location: null
        }
      : null,
    comment: null
  }
}
