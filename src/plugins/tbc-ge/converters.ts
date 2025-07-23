import { Account, AccountType, Amount, ExtendedTransaction, Merchant, Movement, Transaction } from '../../types/zenmoney'
import {
  CardProductV2,
  LoanProductV2,
  CardsAndAccounts,
  createCashMovement,
  FetchHistoryV2Data,
  PreparedAccountV2,
  PreparedCardV2,
  PreparedLoanV2,
  TransactionBlockedV2,
  TransactionUtilPayV2,
  TransactionsByDateV2,
  TransactionStandardMovementV2,
  TransactionTaxV2,
  TransactionTransferV2,
  DepositDataV2,
  DepositStatementV2
} from './models'
import { padStart } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { getOptString } from '../../types/get'

export function convertAccountsV2 (cardsAndAccounts: CardsAndAccounts | null): PreparedAccountV2[] {
  const accounts: PreparedAccountV2[] = []
  if (cardsAndAccounts == null) {
    return accounts
  }
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

export function convertStatementV2 (statement: DepositStatementV2, account: Account): Transaction {
  const movement: Movement = {
    id: Buffer.from(`${account.id}:${statement.depositAmount}:${statement.movementDate}`).toString('base64'),
    account: {
      id: account.id
    },
    sum: statement.depositAmount,
    fee: 0,
    invoice: null
  }
  return {
    date: new Date(statement.movementDate),
    movements: [movement],
    merchant: null,
    hold: false,
    comment: null
  }
}

export function convertDepositV2 (apiAccount: DepositDataV2): Account {
  const coreAccountId = apiAccount.deposit.externalAccountId
  const startDate = new Date(apiAccount.details.depositDetails.startDate)
  const endDate = new Date(apiAccount.details.depositDetails.endDate)
  const { interval: endDateOffsetInterval, count: endDateOffset } = getIntervalBetweenDates(startDate, endDate)
  return {
    id: coreAccountId.toString(),
    type: AccountType.deposit,
    title: apiAccount.deposit.friendlyName,
    instrument: apiAccount.deposit.currency,
    syncIds: [
      apiAccount.deposit.accountNo
    ],
    balance: apiAccount.deposit.currentAmount,
    startDate,
    startBalance: apiAccount.details.interestCalculationUponCancellation.amount,
    capitalization: true,
    percent: apiAccount.details.depositDetails.existingEffectiveInterestRate,
    endDateOffsetInterval,
    endDateOffset,
    payoffInterval: 'month',
    payoffStep: 1
  }
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

export function convertLoansV2 (apiLoans: LoanProductV2[]): PreparedLoanV2[] {
  const loans: PreparedLoanV2[] = []
  for (const apiLoan of apiLoans) {
    const startDate = new Date(apiLoan.approvementDate)
    const endDate = new Date(apiLoan.endDate)
    const { interval: endDateOffsetInterval, count: endDateOffset } = getIntervalBetweenDates(startDate, endDate)

    const loan: PreparedLoanV2 = {
      account: {
        id: apiLoan.id,
        type: AccountType.loan, // replace with actual constant for 'loan'
        title: apiLoan.friendlyName ?? apiLoan.typeText,
        instrument: apiLoan.currencyCode,
        syncIds: [apiLoan.id],
        balance: -apiLoan.outstandingPrincipalAmount,
        startDate,
        startBalance: apiLoan.totalLoanAmount,
        capitalization: true,
        percent: 0, // TBC API does not return interest rate for loans but it is required
        endDateOffsetInterval,
        endDateOffset,
        payoffInterval: 'month',
        payoffStep: 1
      }
    }
    loans.push(loan)
  }
  return loans
}

export function convertTransactionsV2 (transactionRecordsByDate: TransactionsByDateV2[], fromDate: Date, data: FetchHistoryV2Data): ExtendedTransaction[] {
  const transactions: ExtendedTransaction[] = []
  for (const transactionRecords of transactionRecordsByDate) {
    for (const transactionRecord of transactionRecords.transactions) {
      if (transactionRecord.currency !== data.currency) {
        continue
      }
      let amount: number | null = null
      let merchant: Merchant | null = null
      let secondMovement: Movement | null = null
      let comment: string | null = null
      let invoice: Amount | null = null
      let id: string | null = null
      let dateNum: number | null = null
      let groupKeys: string[] = []
      try {
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
          id = transactionRecord.movementId as string
          if (TransactionTransferV2.isTransfer(transactionRecord)) {
            const transfer = new TransactionTransferV2(transactionRecord)
            comment = transfer.transaction.title
            merchant = null
            groupKeys = [
              transactionRecord.transactionId.toString(),
              transactionRecord.title
            ]
          } else if (TransactionUtilPayV2.isUtilPay(transactionRecord)) {
            const utilPayV2 = new TransactionUtilPayV2(transactionRecord)
            id = transactionRecord.movementId as string
            amount = utilPayV2.amount
            merchant = {
              city: null,
              country: utilPayV2.merchantCountry,
              title: utilPayV2.merchant,
              mcc: null,
              location: null
            }
          } else if (TransactionTaxV2.isTax(transactionRecord)) {
            const tax = new TransactionTaxV2(transactionRecord)
            id = tax.transaction.movementId as string
            amount = tax.transaction.amount
            comment = tax.transaction.title
            merchant = tax.merchant
          } else {
            const movement = new TransactionStandardMovementV2(transactionRecord, transactionRecords.date)
            dateNum = movement.date.getTime()
            if (movement.needInvoice()) {
              invoice = movement.invoice as Amount
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
      } catch (err) {
        // use default values
        console.error(getOptString(err, 'message') ?? 'unknown error')
        if (id == null) {
          const idLine = `${transactionRecord.title}${transactionRecord.subTitle}${transactionRecord.amount}${transactionRecord.categoryCode ?? 'null'}${transactionRecord.subCategoryCode}`
          id = Buffer.from(idLine).toString('base64')
        }
        if (amount == null) {
          amount = transactionRecord.amount
        }
        if (comment == null) {
          comment = transactionRecord.title
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

      if ((merchant != null) && (merchant.title === undefined || merchant.title === '')) {
        merchant = null
      }

      const transaction: ExtendedTransaction = {
        hold: transactionRecord.dispute ?? false,
        date,
        movements,
        merchant,
        comment,
        groupKeys
      }
      transactions.push(transaction)
    }
  }
  return transactions
}

export function isInvoiceString (invoiceString: string): boolean {
  const invoiceRegex = /\d+\.\d{2} [A-Z]{3}$/
  return invoiceRegex.test(invoiceString)
}

export function isPOSDateCorrect (dateString: string): boolean {
  const posDateTimeRegex = /^[A-Za-z]{3}\s+\d{1,2}\s+\d{4}\s+\s*\d{1,2}:\d{2}(AM|PM)$/
  return posDateTimeRegex.test(dateString)
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
