import { Account, AccountType, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAllAccounts, fetchAuthorization, fetchProductTransactions } from './fetchApi'
import { AccountInfo, Preferences, TransactionInfo } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  const session = {
    auth: await fetchAuthorization(preferences)
  }

  const accounts = await fetchAllAccounts(session)

  const transactions: Transaction[] = []
  const processedTransactions = new Set<string>() // Track processed transactions to avoid duplicates

  for (const account of accounts) {
    const startDate = fromDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default to 30 days ago
    const endDate = toDate ?? new Date()

    // Create a unique account ID that includes the currency
    const uniqueAccountId = account.id + '-' + account.instrument

    const accountTransactions = await fetchProductTransactions(uniqueAccountId, session, startDate, endDate)

    for (const transaction of accountTransactions) {
      // Create a unique transaction identifier to avoid duplicates
      const transactionKey = `${transaction.date.getTime()}_${transaction.title}_${transaction.amount}_${transaction.currency}`

      if (!processedTransactions.has(transactionKey)) {
        processedTransactions.add(transactionKey)
        transactions.push(convertTransaction(transaction, account))
      } else {
        console.log(`Skipping duplicate transaction: ${transaction.title}, ${transaction.amount} ${transaction.currency}`)
      }
    }
  }

  return {
    accounts: accounts.map(convertAccount),
    transactions
  }
}

function convertAccount (account: AccountInfo): Account {
  return {
    id: account.id + '-' + account.instrument,
    type: AccountType.ccard,
    title: account.id + '-' + account.instrument,
    instrument: account.instrument,
    syncIds: account.syncIds,
    balance: Math.round(account.balance * 100) / 100
  }
}

function convertTransaction (transaction: TransactionInfo, account: AccountInfo): Transaction {
  return {
    hold: transaction.isPending,
    date: transaction.date,
    movements: [
      {
        id: null,
        account: { id: account.id + '-' + account.instrument },
        invoice: null,
        sum: Math.round(transaction.amount * 100) / 100, // Round to 2 decimal places
        fee: 0
      }
    ],
    merchant: {
      fullTitle: transaction.title,
      mcc: null,
      location: null
    },
    comment: null
  }
}
