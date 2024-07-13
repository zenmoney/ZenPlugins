import { AccountType, Transaction } from '../../types/zenmoney'
import { AccountBalanceResponse, GetAccountTransactionsResponse, RaiffAccount } from './models'

const FX_SALES_AND_PURCHASE = '286'
const TRANSFER_TRANSACTION_TYPES = [FX_SALES_AND_PURCHASE]

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
    type: AccountType.checking,
    title: id,
    instrument: apiAccount.CurrencyCode,
    balance: apiAccount.AvailableBalance,
    creditLimit: 0,
    syncIds: [id],
    ProductCodeCore: apiAccount.ProductCodeCore
  }
  return account
}

export function convertTransaction (t1: GetAccountTransactionsResponse): Transaction {
  return {
    hold: false,
    date: new Date(t1.ValueDate),
    movements: [
      {
        id: t1.Reference ?? null,
        account: { id: t1.AccountNumber + t1.CurrencyCode },
        invoice: null,
        sum: t1.CreditAmount - t1.DebitAmount,
        fee: 0
      }
    ],
    merchant: {
      fullTitle: t1.DebtorCreditorName ?? t1.Trnben ?? 'Unknown',
      mcc: null,
      location: null
    },
    comment: t1.Description ?? t1.Note
  }
}

export function convertTransfer (t1: GetAccountTransactionsResponse, t2: GetAccountTransactionsResponse): Transaction {
  return {
    hold: false,
    date: new Date(t1.ValueDate),
    movements: [
      {
        id: t1.Reference,
        account: { id: t1.AccountNumber + t1.CurrencyCode },
        invoice: null,
        sum: t1.CreditAmount - t1.DebitAmount,
        fee: 0
      },
      {
        id: t2.Reference,
        account: { id: t2.AccountNumber + t2.CurrencyCode },
        invoice: null,
        sum: t2.CreditAmount - t2.DebitAmount,
        fee: 0
      }
    ],
    merchant: null,
    comment: t1.Description ?? t1.Note ?? t2.Description ?? t2.Note
  }
}

export function convertTransactions (apiTransactions: GetAccountTransactionsResponse[]): Transaction[] {
  const transactions: Transaction[] = []
  for (const apiTransaction of apiTransactions) {
    const hasPairTransaction = apiTransaction.PaymentCode != null && TRANSFER_TRANSACTION_TYPES.includes(apiTransaction.PaymentCode.toString())
    const pairTransactionIndex = hasPairTransaction
      ? apiTransactions.findIndex((t) => apiTransaction.PBO?.endsWith(t.Reference))
      : -1

    if (pairTransactionIndex !== -1) {
      transactions.push(convertTransfer(apiTransaction, apiTransactions[pairTransactionIndex]))
      apiTransactions.splice(pairTransactionIndex, 1)
    } else {
      transactions.push(convertTransaction(apiTransaction))
    }
  }

  return transactions
}
