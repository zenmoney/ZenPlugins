import { AccountOrCard, AccountReferenceById, AccountType, Merchant, Movement, Transaction } from '../../types/zenmoney'
import { AccountData, BunqPayment, DateTimeString } from './models'
import { flatten, isNull, isObject, isString } from 'lodash'

export function convertAccount (apiAccount: AccountData): AccountOrCard {
  return {
    id: String(apiAccount.id),
    balance: Number(apiAccount.balance.value),
    syncIds: [String(apiAccount.id), ...apiAccount.alias.map((alias) => alias.value)],
    instrument: apiAccount.currency,
    title: apiAccount.description,
    type: AccountType.checking
  }
}

export function convertTransactions (apiTransactions: BunqPayment[], accounts: AccountData[]): Transaction[] {
  const accountAliases: Array<[string, AccountData]> = flatten(accounts.map(
    account => account.alias.map<[string, AccountData]>(alias => ([alias.value, account]))))
  const accountsMap: Map<string, AccountData> = new Map(accountAliases)

  const transactions: Transaction[] = apiTransactions.map((transaction) => convertTransaction(transaction, accountsMap))

  return mergeTransfers(transactions)
}

export function convertTransaction (apiTransaction: BunqPayment, ownAccounts: Map<string, AccountData>): Transaction {
  const id = String(apiTransaction.id)
  const accountId = String(apiTransaction.monetary_account_id)
  const description = apiTransaction.description
  const mmc = apiTransaction.counterparty_alias.merchant_category_code
  const reference = apiTransaction.merchant_reference
  const counterIban = apiTransaction.counterparty_alias.iban
  const mainMovement: Movement = {
    id,
    account: { id: accountId },
    invoice: null,
    sum: Number(apiTransaction.amount.value),
    fee: 0
  }

  const isSepaTransfer = apiTransaction.type === 'EBA_SCT' && apiTransaction.sub_type === 'SCT'
  const isMastercardPayment = apiTransaction.type === 'MASTERCARD' && apiTransaction.sub_type === 'PAYMENT'
  const isIgnoreTypeName = isSepaTransfer || isMastercardPayment
  const merchantName = isIgnoreTypeName ? apiTransaction.counterparty_alias.display_name : `${apiTransaction.type} ${apiTransaction.sub_type}: ${apiTransaction.counterparty_alias.display_name}`
  const merchant: Merchant = {
    title: merchantName,
    mcc: isString(mmc) ? Number(mmc) : null,
    category: reference ?? undefined,
    location: null,
    city: null,
    country: null
  }

  const ownCounter = !isNull(counterIban) && ownAccounts.get(counterIban)
  const isOwnCounter = isObject(ownCounter)

  const alterMovement: Movement = {
    id: null,
    fee: 0,
    sum: -Number(apiTransaction.amount.value),
    invoice: null,
    account: { id: (isOwnCounter && String(ownCounter.id)) || '' }
  }

  const movementsWithAlter: [Movement, Movement] = [mainMovement, alterMovement]
  return {
    hold: false,
    date: formatDate(apiTransaction.created),
    movements: isOwnCounter ? movementsWithAlter : [mainMovement],
    merchant: isOwnCounter ? null : merchant,
    comment: description
  }
}

function mergeTransfers (transactions: Transaction[]): Transaction[] {
  const filteredTransactions: Transaction[] = []
  const transfersHash: {[accountId: string]: {[sumValue: string]: {[timeStamp: string]: Movement | undefined}}} = {}

  for (const transaction of transactions) {
    const isTransfer = transaction.movements.length === 2

    if (!isTransfer) {
      filteredTransactions.push(transaction)
      continue
    }

    const mainMovement = transaction.movements[0]
    const mainMovementAccountId = (mainMovement.account as AccountReferenceById).id
    const mainSumString = String(mainMovement.sum)
    const mainDateString = transaction.date.toLocaleDateString() + transaction.date.toLocaleTimeString()

    const isSaved = isObject(transfersHash[mainMovementAccountId]?.[mainSumString]?.[mainDateString])

    if (isSaved) {
      transfersHash[mainMovementAccountId][mainSumString][mainDateString] = undefined
      continue
    }

    filteredTransactions.push(transaction)

    const altMovement = transaction.movements[1] as Movement
    const altAccountId = (altMovement.account as AccountReferenceById).id
    const altSumString = String(altMovement.sum)
    const altDateString = transaction.date.toLocaleDateString() + transaction.date.toLocaleTimeString()

    transfersHash[altAccountId] = transfersHash[altAccountId] ?? {}
    transfersHash[altAccountId][altSumString] = transfersHash[altAccountId][altSumString] ?? {}
    transfersHash[altAccountId][altSumString][altDateString] = altMovement
  }

  return filteredTransactions
}

// We need to behave dates as they are given in UTC timestamp
function formatDate (dateString: DateTimeString): Date {
  const localDate = new Date(dateString)
  const utcDate = Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    localDate.getHours(),
    localDate.getMinutes(),
    localDate.getSeconds(),
    localDate.getMilliseconds()
  )

  return new Date(utcDate)
}
