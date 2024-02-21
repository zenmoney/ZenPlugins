import { Account, AccountType, Amount, Transaction } from '../../types/zenmoney'
import { getNumber, getOptString, getString, getBoolean } from '../../types/get'
import { Account as CredoAccount, AccountType as CredoAccountType, Transaction as CredoTransaction } from './models'

export function convertAccounts (apiAccounts: CredoAccount[]): Account[] {
  console.log('>>> Converting accounts')
  const accounts: Account[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount)
    accounts.push(res)
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
      syncIds: [accountId, syncId],
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
      syncIds: [accountId, syncId],
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
  let amount = 0
  let credit = null
  let debit = null
  if (apiTransaction.credit !== null) {
    credit = getNumber(apiTransaction, 'credit')
    amount = credit
  } else {
    debit = getNumber(apiTransaction, 'debit')
    amount = -1 * debit
  }
  const invoice = getAmountFromDescription(description) // TODO: rewrite getAmountFromDescription
  const isCardBlock = getBoolean(apiTransaction, 'isCardBlock')

  return {
    hold: isCardBlock,
    date: new Date(getString(apiTransaction, 'operationDateTime')),
    movements: [
      {
        id: getOptString(apiTransaction, 'transactionId') ?? null,
        account: { id: account.id },
        invoice,
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

export function strippDescription (description: string): string {
  /* cleanup description from invoice data, date and non-meaningful info */
  const spaceDashSeparatorRegex = / - /g
  const separatorFound = description.match(spaceDashSeparatorRegex)

  if (separatorFound === null) {
    return description
  }

  const valuebleDescription = description.split(' - ')[1]
  const amountIntsrumentDataRegex = /\d+\.\d{2} [A-Z]{3} \d{2}\.\d{2}\.\d{4}/g
  const amountInstrumentDataFound = valuebleDescription.match(amountIntsrumentDataRegex)
  if (amountInstrumentDataFound === null) {
    return valuebleDescription.split(' ').slice(0, -3).join(' ')
  }
  return valuebleDescription
}

export function getAmountFromDescription (description: string | undefined): Amount | null {
  if (description == null || description === undefined) {
    return null
  }

  const amountAndInstrumentRegexp = /([0-9]+\.[0-9]{2}) ([A-Z]{3})/g
  const found = description.match(amountAndInstrumentRegexp)
  if (found != null) {
    const foundItems = found[0].split(' ')
    const sum = parseFloat(foundItems[0])
    const instrument = foundItems[1]
    return { sum, instrument }
  }
  return null
}
