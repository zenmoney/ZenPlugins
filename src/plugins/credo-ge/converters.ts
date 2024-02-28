import { Account, AccountType, Amount, ExtendedTransaction } from '../../types/zenmoney'
import { getNumber, getOptString, getString, getBoolean } from '../../types/get'
import {
  Account as CredoAccount,
  AccountType as CredoAccountType,
  Deposit as CredoDeposit,
  Loan as CredoLoan,
  Card as CredoCard,
  Transaction as CredoTransaction,
  TransactionType,
  OperationType
} from './models'

export function getAccountNumberToAccountMapping (accounts: Account[]): Map <string, Account> {
  const numberToId = new Map()
  for (const account of accounts) {
    for (const syncId of account.syncIds) {
      numberToId.set(syncId, account)
    }
  }
  return numberToId
}

function getAccountToCardMapping (cards: CredoCard[]): Map<string, string> {
  const accountToCardMapping = new Map()
  for (const card of cards) {
    accountToCardMapping.set(card.accountNumber, card.cardNumber)
  }
  return accountToCardMapping
}

function getCssAccountToDepositMapping (deposits: CredoDeposit[]): Map<number, CredoDeposit> {
  const cssAccountToDepositMapping = new Map()
  for (const deposit of deposits) {
    cssAccountToDepositMapping.set(deposit.cssAccountId, deposit)
  }
  return cssAccountToDepositMapping
}

function getDepositsWithoutAccounts (accountToDepositMapping: Map<number, CredoDeposit>): Account[] {
  const deposits: Account[] = []

  for (const deposit of accountToDepositMapping.values()) {
    deposits.push(convertDeposit(deposit))
  }
  return deposits
}

function convertDeposit (deposit: CredoDeposit): Account {
  return {
    id: deposit.cssAccountId.toString(),
    type: AccountType.deposit,
    title: deposit.contractN,
    instrument: deposit.depositCurrency,
    syncIds: [deposit.cssAccountId.toString(), deposit.contractN],
    balance: deposit.depositBalance + deposit.accruedInterestAmount,
    startDate: new Date(deposit.openningDate),
    startBalance: deposit.depositBalance,
    capitalization: true,
    percent: deposit.depositInterestRate,
    endDateOffsetInterval: 'month',
    endDateOffset: 1,
    payoffInterval: 'month',
    payoffStep: 1
  }
}

export function convertAccounts (apiAccounts: CredoAccount[], cards: CredoCard[], deposits: CredoDeposit[], loans: CredoLoan[]): Account[] {
  console.log('>>> Converting accounts')
  console.log('>> cards:', cards)
  console.log('>> deposits:', deposits)
  const accounts: Account[] = []
  const accountToCardNumber = getAccountToCardMapping(cards)
  console.log('accountToCardNumber:', accountToCardNumber)
  const accountToDepositMapping = getCssAccountToDepositMapping(deposits)

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount, accountToCardNumber, accountToDepositMapping)
    accounts.push(res)
    accountToDepositMapping.delete(apiAccount.cssAccountId)
  }
  const depositsWithoutAccount = getDepositsWithoutAccounts(accountToDepositMapping)
  return accounts.concat(depositsWithoutAccount)
}

function convertAccount (
  apiAccount: CredoAccount,
  accountToCardNumber: Map<string, string>,
  cssAccountToDeposits: Map<number, CredoDeposit>,
  loans?: CredoLoan[]
): Account {
  const accountId = getNumber(apiAccount, 'accountId').toString()
  const apiAccountType = getString(apiAccount, 'type')
  const accountType = apiAccountType === CredoAccountType.current.valueOf() ? AccountType.ccard : AccountType.deposit
  const accountNumber = getString(apiAccount, 'accountNumber')
  const currency = getString(apiAccount, 'currency')
  const accountSyncId = [accountNumber, currency].join('')
  const cardNumber = accountToCardNumber.get(accountNumber)
  const syncIds = [accountSyncId, accountId]
  console.log('accountId:', accountId, 'accountNumber:', accountNumber, 'cardNumber:', cardNumber)
  if (cardNumber !== null && cardNumber !== undefined) { syncIds.push(cardNumber) }
  const availableBalance = getNumber(apiAccount, 'availableBalance')
  /* Deposit or loan */
  const deposit = cssAccountToDeposits.get(apiAccount.cssAccountId)
  const depositNickName = getOptString(deposit, 'depositNickName')

  if (accountType === AccountType.ccard) {
    return {
      id: accountId,
      type: accountType,
      title: accountSyncId,
      instrument: currency,
      syncIds,
      savings: apiAccountType === CredoAccountType.saving,
      balance: availableBalance,
      available: availableBalance
    }
  } else {
    /* Deposit or loan */
    // TODO: AccountType.loan!
    const startDate = deposit !== null && deposit !== undefined ? new Date(deposit.openningDate) : new Date('2000-01-01')
    const startBalance = 0
    const capitalization = false
    const percent = deposit !== null && deposit !== undefined ? deposit.depositInterestRate : 1
    const endDateOffsetInterval = 'month'
    const endDateOffset = 1
    const payoffInterval = 'month'
    const payoffStep = 1
    return {
      id: accountId,
      type: accountType,
      title: depositNickName !== undefined ? depositNickName + ' ' + accountSyncId : accountSyncId,
      instrument: currency,
      syncIds,
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
  const transactionType = getOptString(apiTransaction, 'transactionType')
  const operationDateTime = getString(apiTransaction, 'operationDateTime')
  const operationType = getOptString(apiTransaction, 'operationType')
  const isConversion = operationType === OperationType.ConversionKa || operationType === OperationType.ConversionEn || operationType === OperationType.ConversionRu
  const isMovement = transactionType === TransactionType.Transferbetweenownaccounts || transactionType === TransactionType.CurrencyExchange || isConversion
  const description = getOptString(apiTransaction, 'description') ?? ''
  const strippedDescription = strippDescription(description)
  let comment = null
  let merchant = null

  const groupKeys = []
  if (isConversion && operationDateTime !== undefined) {
    const timestamp = new Date(operationDateTime).getTime()
    groupKeys.push('conversion_' + timestamp.toString())
  } else if (isMovement) {
    groupKeys.push(transactionId)
  } else {
    groupKeys.push(null)
  }

  if (
    transactionType === null ||
    transactionType === undefined ||
    transactionType === TransactionType.Otherexpenses ||
    transactionType === TransactionType.Transferbetweenownaccounts ||
    transactionType === TransactionType.CurrencyExchange
  ) {
    comment = operationType ?? description
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
    if (!isMovement) {
      comment = comment + ' | ' + description
    }
  } else {
    debit = getNumber(apiTransaction, 'debit')
    amount = -1 * debit
  }
  const invoice = getAmountFromDescription(description, Math.sign(amount)) // TODO: rewrite getAmountFromDescription
  const isCardBlock = getBoolean(apiTransaction, 'isCardBlock')

  console.log(transactionId, 'isMovement:', isMovement, 'transactionType:', transactionType)

  const convertedTransaction: ExtendedTransaction = {
    hold: isCardBlock,
    date: new Date(operationDateTime),
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
    groupKeys
  }

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
