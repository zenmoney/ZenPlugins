import { Account, AccountType, Amount, ExtendedTransaction } from '../../types/zenmoney'
import { getNumber, getOptString, getString, getBoolean } from '../../types/get'
import { Account as CredoAccount, AccountType as CredoAccountType, Transaction as CredoTransaction, TransactionType } from './models'

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
  const payoffInterval = 'month'
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

export function convertTransaction (apiTransaction: CredoTransaction, account: Account): ExtendedTransaction {
  const transactionId = getOptString(apiTransaction, 'transactionId') ?? null
  const transactionType = getOptString(apiTransaction, 'transactionType') as TransactionType
  const isMovement = transactionType === TransactionType.Transferbetweenownaccounts || transactionType === TransactionType.CurrencyExchange
  let description = getOptString(apiTransaction, 'description')
  description = description ? description : ''
  const strippedDescription = strippDescription(description)
  let comment = null
  let merchant = null

  if (
    !transactionType ||
    transactionType === TransactionType.Otherexpenses ||
    transactionType === TransactionType.Transferbetweenownaccounts ||
    transactionType === TransactionType.CurrencyExchange
  ) {
    comment = description
  } else {
    merchant = {
      fullTitle: strippedDescription,
      mcc: null,
      location: null
    }
  }

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
  const invoice = getAmountFromDescription(description, Math.sign(amount)) // TODO: rewrite getAmountFromDescription
  const isCardBlock = getBoolean(apiTransaction, 'isCardBlock')

  console.log(transactionId, 'isMovement:', isMovement, 'apiTransType:', apiTransaction.transactionType, 'transactionType:', transactionType)

  const convertedTransaction = {
    hold: isCardBlock,
    date: new Date(getString(apiTransaction, 'operationDateTime')),
    movements: [
      {
        id: transactionId,
        account: { id: account.id },
        invoice,
        sum: amount,
        fee: 0
      }
    ],
    merchant,
    comment,
    groupKeys: isMovement ? [transactionId] : [null]
  } as ExtendedTransaction

  console.log('> convertedTransaction: ', convertedTransaction)
  return convertedTransaction
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
  if (amountInstrumentDataFound !== null) {
    return valuebleDescription.split(' ').slice(0, -3).join(' ')
  }
  return valuebleDescription
}

export function getAmountFromDescription (description: string | undefined, sumSign: number): Amount | null {
  if (description == null || description === undefined) {
    return null
  }

  const amountAndInstrumentRegexp = /([0-9]+\.[0-9]{2}) ([A-Z]{3})/g
  const found = description.match(amountAndInstrumentRegexp)
  if (found != null) {
    const foundItems = found[0].split(' ')
    const sum = parseFloat(foundItems[0]) * sumSign
    const instrument = foundItems[1]
    return { sum, instrument }
  }
  return null
}
