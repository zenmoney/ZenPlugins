import { Account, AccountType, Amount, Transaction } from '../../types/zenmoney'
import { getNumber, getOptString, getString, getOptNumber } from '../../types/get'
import { ConvertResult } from './models'

export function convertAccounts (apiAccounts: unknown[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []

  for (const apiAccount of apiAccounts) {
    if (getString(apiAccount, 'no') !== '' && getString(apiAccount, 'name') !== '' && getOptNumber(apiAccount, 'accountBalance') !== undefined) {
      const res = convertAccount(apiAccount, accountsByCba)
      if (res != null) {
        accounts.push(res)
      }
    }
  }
  return accounts
}

function convertAccount (apiAccount: unknown, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = getString(apiAccount, 'no')
  const balance = getNumber(apiAccount, 'accountBalance')
  let newAccount = false
  let account = accountsByCba[cba]
  if (account == null) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: getOptString(apiAccount, 'name') ?? cba,
        instrument: 'VND',
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
    id: getString(apiAccount, 'no'),
    accountType: getString(apiAccount, 'accountType')
  })

  // const pan = getOptString(apiAccount, 'pan')
  // if (pan != null) {
  //   account.account.syncIds.push(pan)
  // }

  // const moneyAmount = getOptNumber(apiAccount, 'moneyAmount.value')
  // if (moneyAmount != null) {
  //   account.account.creditLimit = moneyAmount - balance
  // }
  return newAccount ? account : null
}

export function convertTransaction (apiTransaction: unknown, account: Account): Transaction {
  const description = getOptString(apiTransaction, 'timoDesc2')
  const accountAmount = parseAmount(apiTransaction, 'txnAmount')
  const invoice = parseAmount(apiTransaction, 'txnAmount')

  return {
    hold: getString(apiTransaction, 'txnType') !== 'TRANSACTION',
    date: timoDateToIso(getString(apiTransaction, 'txnTime')),
    movements: [
      {
        id: getOptString(apiTransaction, 'refNo') ?? null,
        account: { id: account.id },
        invoice: accountAmount.instrument === invoice.instrument ? null : invoice,
        sum: invoice.sum,
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
    sum: getNumber(data, `${path}`),
    instrument: 'VND'
  }
}

function timoDateToIso (timoDate: string): Date {
  const [day, month, year] = timoDate.split(' ')[0].split('/').map(Number)
  const [hours, minutes, seconds] = timoDate.split(' ')[1].split(':').map(Number)
  const isoDate = new Date(year, month - 1, day, hours, minutes, seconds)
  return isoDate
}
