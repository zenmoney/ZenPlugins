import { Account, AccountType, Amount, Transaction } from '../../types/zenmoney'
import { getNumber, getOptNumber, getOptString, getString, getBoolean } from '../../types/get'
import { ConvertResult, Account as CredoAccount, AccountType as CredoAccountType, Transaction as CredoTransaction, TransactionType as CredoTransactionType } from './models'

export function convertAccounts (apiAccounts: CredoAccount[]): Account[] {
  const accounts: Account[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccount (apiAccount: CredoAccount): Account {
  const accountId = getNumber(apiAccount, 'accountId').toString()
  const apiAccountType = getString(apiAccount, 'type')
  const accountType = apiAccountType === CredoAccountType.current.valueOf() ? AccountType.ccard : AccountType.deposit
  const accountNumber = getString(apiAccount, 'accountNumber')
  const currency = getString(apiAccount, 'currency')
  const syncId = [accountNumber, currency].join('')
  const availableBalance = getNumber(apiAccount, 'availableBalance')
  /* Deposit or loan */
  const startDate = new Date('2022-01-01')
  const startBalance = 0
  const capitalization = false
  const percent = 3
  const endDateOffsetInterval = 'month'
  const endDateOffset = 1
  const payoffInterval = null
  const payoffStep = 1
  // TODO: AccountType.loan!

  if (accountType === AccountType.ccard) {
    return {
      id: accountId,
      type: accountType,
      title: syncId,
      instrument: currency,
      syncIds: [syncId],
      savings: apiAccountType === CredoAccountType.saving,
      balance: availableBalance,
      available: availableBalance
    }
  } else {
    /* Deposit or loan */
    return {
      id: accountId,
      type: accountType,
      title: syncId,
      instrument: currency,
      syncIds: [syncId],
      balance: availableBalance,
      startDate,
      startBalance,
      capitalization,
      percent,
      endDateOffsetInterval,
      endDateOffset,
      payoffInterval,
      payoffStep
    }
  }
}

export function convertTransaction (apiTransaction: CredoTransaction, account: Account): Transaction {
  const description = getOptString(apiTransaction, 'description')
  const credit = getNumber(apiTransaction, 'credit')
  const debit = getNumber(apiTransaction, 'debit')
  const amount = credit ? credit : -1*debit
  const invoice = getAmountFromDescription(description)  // TODO: rewrite getAmountFromDescription
  const isCardBlock = getBoolean(apiTransaction, 'isCardBlock')

  return {
    hold: isCardBlock,
    date: new Date(getString(apiTransaction, 'operationTime')),
    movements: [
      {
        id: getOptString(apiTransaction, 'id') ?? null,
        account: { id: account.id },
        invoice: invoice ? invoice : null,
        sum: amount,
        fee: 0
      }
    ],
    merchant: description != null
      ? {
          fullTitle: strippDescription(description),
          mcc: null,
          location: null
        }
      : null,
    comment: null
  }
}

export function strippDescription(description: string): string {
  /* cleanup description from invoice data, date and non-meaningful info */
  const spaceDashSeparatorRegex = / - /g;
  const separatorFound = description.match(spaceDashSeparatorRegex)

  if(!separatorFound) {
    return description
  }

  const valuebleDescription = description.split(' - ')[1]
  const amountIntsrumentDataRegex = /\d+\.\d{2} [A-Z]{3} \d{2}\.\d{2}\.\d{4}/g;
  const amountInstrumentDataFound = valuebleDescription.match(amountIntsrumentDataRegex)
  if (amountInstrumentDataFound) {
    return valuebleDescription.split(' ').slice(0, -3).join(' ')
  }
  return valuebleDescription
}

export function getAmountFromDescription (description: string | undefined): Amount | null {
  if(!description) {
    return null
  };

  const amountAndInstrumentRegexp = /([0-9]+\.[0-9]{2}) ([A-Z]{3})/g;
  const found = description.match(amountAndInstrumentRegexp)
  if(found) {
    const found_items = found[0].split(' ')
    const sum = parseFloat(found_items[0])
    const instrument = found_items[1]
    return {
      sum: sum,
      instrument: instrument,
    }
  }
  return null
}
