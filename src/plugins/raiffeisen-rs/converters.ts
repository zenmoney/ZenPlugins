import { AccountType, Amount, Transaction } from '../../types/zenmoney'
import { AccountBalanceResponse, GetAccountTransactionsResponse, RaiffAccount } from './models'
import moment from 'moment'

const TRANSFER_TRANSACTION_TYPES = ['ExchSell', 'ExchBuy']
const CASH_TRANSACTION_TYPES = ['IncomeCash', 'ATM', 'Other'] // 'PmtDom',

export function convertAccounts (apiAccounts: AccountBalanceResponse[]): RaiffAccount[] {
  const accounts: RaiffAccount[] = []
  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccount (apiAccount: AccountBalanceResponse): RaiffAccount | null {
  // Add CurrencyCode for multicurrency accounts
  const id = apiAccount.AccountNumber + apiAccount.CurrencyCode
  const account: RaiffAccount = {
    id,
    type: AccountType.ccard,
    title: apiAccount.Description ?? id,
    instrument: apiAccount.CurrencyCode,
    balance: apiAccount.AvailableBalance,
    creditLimit: 0, // TODO: add credit card support
    syncIds: [id],
    ProductCodeCore: apiAccount.ProductCodeCore
  }
  return account
}

export function convertTransaction (t1: GetAccountTransactionsResponse): Transaction {
  const description = t1.TransactionType !== 'PmtDom' ? t1.Description : t1.TransactionBeneficiary
  const details = t1.Details
  const invoice = makeInvoice(t1)
  return {
    hold: false,
    date: details?.c_Date_tx !== null && details?.c_Date_tx?.length > 0
      ? new Date(details.c_Date_tx)
      : new Date(t1.ProcessedDate),
    movements: [
      {
        id: t1.TransactionID ?? null,
        account: { id: t1.AccountNumber + t1.CurrencyCode },
        invoice,
        sum: t1.CreditAmount - t1.DebitAmount,
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
    comment: t1.TransactionType === 'PmtDom'
      ? t1.Description
      : details !== undefined && description !== details.s_Note_st
        ? details.s_Note_st
        : null
  }
}

export function convertCashTransaction (t1: GetAccountTransactionsResponse): Transaction {
  const description = t1.Description
  const details = t1.Details
  const invoice = makeInvoice(t1)
  return {
    hold: false,
    date: details?.c_Date_tx !== null && details?.c_Date_tx?.length > 0
      ? new Date(details.c_Date_tx)
      : new Date(t1.ProcessedDate),
    movements: [
      {
        id: t1.TransactionID ?? null,
        account: { id: t1.AccountNumber + t1.CurrencyCode },
        invoice,
        sum: t1.CreditAmount - t1.DebitAmount,
        fee: 0
      },
      {
        id: t1.TransactionID ?? null,
        account: {
          type: AccountType.cash,
          instrument: invoice === null ? t1.CurrencyCode : invoice.instrument,
          syncIds: null,
          company: null
        },
        invoice: null,
        sum: invoice === null ? t1.DebitAmount - t1.CreditAmount : -invoice.sum,
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
    comment: details !== undefined && description !== details.s_Note_st ? details.s_Note_st : null
  }
}

function makeInvoice (t: GetAccountTransactionsResponse): Amount | null {
  const details = t.Details
  const isRefund = t.CreditAmount > t.DebitAmount
  return details?.c_CurrencyCode_tx !== null &&
    details?.c_CurrencyCode_tx?.length > 0 &&
    details?.c_CurrencyCode_tx !== details?.s_CurrencyCode
    ? {
        sum: isRefund ? (details.c_Amount_tx ?? 0) : -(details.c_Amount_tx ?? 0),
        instrument: details.c_CurrencyCode_tx
      }
    : null
}

export function convertTransfer (t1: GetAccountTransactionsResponse, t2: GetAccountTransactionsResponse): Transaction {
  const description = t1.Description
  return {
    hold: false,
    date: t1.Details.c_Date_tx !== null && t1.Details.c_Date_tx.length > 0
      ? new Date(t1.Details.c_Date_tx)
      : new Date(t1.ProcessedDate),
    movements: [
      {
        id: t1.TransactionID ?? null,
        account: { id: t1.AccountNumber + t1.CurrencyCode },
        invoice: null,
        sum: t1.CreditAmount - t1.DebitAmount,
        fee: 0
      },
      {
        id: t2.TransactionID ?? null,
        account: { id: t2.AccountNumber + t2.CurrencyCode },
        invoice: null,
        sum: t2.CreditAmount - t2.DebitAmount,
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
    comment: description !== t1.Details.s_Note_st ? t1.Details.s_Note_st : null
  }
}

export function convertTransactionInProgress (transaction: string[], accountNumber: string): Transaction {
  enum RESPONSE_FIELDS {
    FIELD_1 = 0,
    DATE,
    DESCRIPTON,
    AMOUNT,
    CURRENCY_CODE,
    CURRENCY_CODE_NUM,
    FIELD_6,
    FIELD_7,
    FIELD_8
  }
  const description = transaction[RESPONSE_FIELDS.DESCRIPTON]
  return {
    hold: true,
    date: moment(transaction[RESPONSE_FIELDS.DATE], 'DD.MM.YYYY hh:mm:ss').toDate(),
    movements: [
      {
        id: null,
        account: { id: accountNumber + transaction[RESPONSE_FIELDS.CURRENCY_CODE] },
        invoice: null,
        sum: -transaction[RESPONSE_FIELDS.AMOUNT],
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

export function convertTransactions (apiTransactions: GetAccountTransactionsResponse[]): Transaction[] {
  const transactions: Transaction[] = []
  for (const apiTransaction of apiTransactions) {
    const hasPairTransaction = TRANSFER_TRANSACTION_TYPES.includes(apiTransaction.TransactionType) &&
      apiTransaction.Details.DebtorAccount !== null &&
      apiTransaction.Details.DebtorAccount?.length > 0
    const pairTransactionIndex = hasPairTransaction
      ? apiTransactions.findIndex((t) => t.TransactionID !== apiTransaction.TransactionID &&
          t.Details?.s_OrderNumber === apiTransaction.Details?.s_OrderNumber)
      : -1

    if (pairTransactionIndex !== -1) {
      transactions.push(convertTransfer(apiTransaction, apiTransactions[pairTransactionIndex]))
      apiTransactions.splice(pairTransactionIndex, 1)
    } else if (CASH_TRANSACTION_TYPES.includes(apiTransaction.TransactionType)) {
      transactions.push(convertCashTransaction(apiTransaction))
    } else {
      transactions.push(convertTransaction(apiTransaction))
    }
  }

  return transactions
}
