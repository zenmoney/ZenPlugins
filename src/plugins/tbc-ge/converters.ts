import { AccountType, Amount, ExtendedTransaction, Merchant, Movement } from '../../types/zenmoney'
import {
  CardProductV2,
  CardsAndAccounts,
  createCashMovement,
  FetchHistoryV2Data,
  PreparedAccountV2,
  PreparedCardV2,
  TransactionBlockedV2, TransactionCustomMobileV2,
  TransactionsByDateV2,
  TransactionStandardMovementV2, TransactionTaxV2,
  TransactionTransferV2
} from './models'
import { padStart } from 'lodash'

export function convertAccountsV2 (cardsAndAccounts: CardsAndAccounts): PreparedAccountV2[] {
  const accounts: PreparedAccountV2[] = []
  for (const apiAccount of cardsAndAccounts.accountsAndDebitCards) {
    if (apiAccount.type === 'Card') {
      continue
    }
    const account: PreparedAccountV2 = {
      account: {
        id: (apiAccount.id != null) ? apiAccount.id.toString() : apiAccount.iban,
        type: AccountType.checking,
        title: apiAccount.name,
        instrument: apiAccount.currency,
        syncIds: [apiAccount.iban],
        balance: apiAccount.amount
      },
      iban: apiAccount.iban
    }
    accounts.push(account)
  }
  return accounts
}

export function convertCardsV2 (apiAccounts: CardProductV2[]): PreparedCardV2[] {
  const accounts: PreparedCardV2[] = []
  for (const apiAccount of apiAccounts) {
    const mainCard = apiAccount.cards[0]
    for (const account of apiAccount.accounts) {
      const card: PreparedCardV2 = {
        account: {
          id: account.id.toString(),
          type: AccountType.ccard,
          title: `${apiAccount.typeText} ${account.currency}`,
          instrument: account.currency,
          syncIds: [apiAccount.iban, mainCard.numberSuffix],
          balance: account.balance
        },
        code: mainCard.numberSuffix,
        id: account.id,
        iban: apiAccount.iban
      }
      accounts.push(card)
    }
  }
  return accounts
}
export function convertTransactionsV2 (transactionRecordsByDate: TransactionsByDateV2[], fromDate: Date, data: FetchHistoryV2Data): ExtendedTransaction[] {
  const transactions: ExtendedTransaction[] = []
  for (const transactionRecords of transactionRecordsByDate) {
    for (const transactionRecord of transactionRecords.transactions) {
      if (transactionRecord.currency !== data.currency) {
        continue
      }
      let amount: number
      let merchant: Merchant | null = null
      let secondMovement: Movement | null = null
      let comment: string | null = null
      let invoice: Amount | null = null
      let id: string
      let dateNum: number | null = null
      if (transactionRecord.entryType === 'BlockedTransaction') {
        const blockedTransaction = new TransactionBlockedV2(transactionRecord, transactionRecords.date)
        id = blockedTransaction.id
        amount = blockedTransaction.amount
        // TODO add invoice
        if (blockedTransaction.isCash()) {
          secondMovement = createCashMovement(blockedTransaction.transaction.currency, -amount)
        } else {
          merchant = {
            city: blockedTransaction.city,
            country: blockedTransaction.countryCode,
            title: blockedTransaction.merchant,
            mcc: null,
            location: null
          }
        }
      } else {
        amount = transactionRecord.amount
        id = transactionRecord.movementId!
        if (TransactionTransferV2.isTransfer(transactionRecord)) {
          const transfer = new TransactionTransferV2(transactionRecord)
          comment = transfer.transaction.title
          merchant = null
        } else if (TransactionCustomMobileV2.isCustomMobile(transactionRecord)) {
          const mobile = new TransactionCustomMobileV2(transactionRecord)
          id = transactionRecord.movementId!
          amount = mobile.amount
          merchant = {
            city: null,
            country: mobile.merchantCountry,
            title: mobile.merchant,
            mcc: null,
            location: null
          }
        } else if (TransactionTaxV2.isTax(transactionRecord)) {
          const tax = new TransactionTaxV2(transactionRecord)
          id = tax.transaction.movementId!
          amount = tax.transaction.amount
          comment = tax.transaction.title
          merchant = tax.merchant
        } else {
          const movement = new TransactionStandardMovementV2(transactionRecord)
          dateNum = movement.date.getTime()
          if (movement.needInvoice()) {
            invoice = movement.invoice!
          }
          if (movement.isCash()) {
            secondMovement = createCashMovement(movement.transaction.currency, -amount)
          } else {
            merchant = {
              city: null,
              country: null,
              title: movement.merchant,
              mcc: Number.isNaN(movement.mcc) ? null : movement.mcc,
              location: null
            }
          }
        }
      }

      let movements: [Movement] | [Movement, Movement]

      const firstMovement: Movement = {
        id,
        account: { id: data.account.id },
        invoice,
        sum: amount,
        fee: 0
      }
      if (secondMovement != null) {
        movements = [
          firstMovement,
          secondMovement
        ]
      } else {
        movements = [
          firstMovement
        ]
      }

      if (dateNum == null || Number.isNaN(dateNum)) {
        dateNum = transactionRecords.date
      }

      const date = new Date(dateNum)

      if (date < fromDate) {
        continue
      }

      const transaction: ExtendedTransaction = {
        hold: transactionRecord.dispute ?? false,
        date,
        movements,
        merchant,
        comment,
        groupKeys: []
      }
      transactions.push(transaction)
    }
  }
  return transactions
}
export function parsePOSDateString (dateString: string): Date {
  const dateParts = dateString.trim().split(/\s+/)
  assert(dateParts.length === 4, 'cant parse pos date', dateString)
  const [month, date, year, time] = dateParts
  const [hours, minutes] = parsePOSTime(time)
  const isoString = `${year}-` +
    `${padStart(parsePOSMonth(month).toString(), 2, '0')}-` +
    `${padStart(date, 2, '0')}T` +
    `${padStart(hours.toString(), 2, '0')}:` +
    `${padStart(minutes.toString(), 2, '0')}:` +
    '00.000+04:00'
  return new Date(isoString)
}

function parsePOSTime (time: string): [number, number] {
  const timeMatch = time.match(/^(\d{1,2}):(\d{1,2})(PM|AM)$/)
  assert(timeMatch != null, 'cant parse pos time', time)
  const [hoursRaw, minutes, dayTime] = timeMatch.slice(1)
  let hours = hoursRaw
  if (hours === '12') {
    hours = '0'
  }
  if (dayTime === 'PM') {
    return [parseInt(hours) + 12, parseInt(minutes)]
  } else if (dayTime === 'AM') {
    return [parseInt(hours), parseInt(minutes)]
  } else {
    assert(false)
  }
}

function parsePOSMonth (month: string): number {
  switch (month) {
    case 'Jan':
      return 1
    case 'Feb':
      return 2
    case 'Mar':
      return 3
    case 'Apr':
      return 4
    case 'May':
      return 5
    case 'Jun':
      return 6
    case 'Jul':
      return 7
    case 'Aug':
      return 8
    case 'Sep':
      return 9
    case 'Oct':
      return 10
    case 'Nov':
      return 11
    case 'Dec':
      return 12
    default:
      assert(false, 'cant parse pos month', month)
  }
}
