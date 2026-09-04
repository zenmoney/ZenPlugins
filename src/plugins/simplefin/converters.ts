import { AccountType, Transaction } from '../../types/zenmoney'
import { SimpleFinAccount, SimpleFinAccountSet, SimpleFinAccountWithConnection, SimpleFinConnection, SimpleFinTransaction } from './models'

export function convertAccounts (accountSet: SimpleFinAccountSet): SimpleFinAccountWithConnection[] {
  const connectionsById: Record<string, SimpleFinConnection | undefined> = {}
  for (const connection of accountSet.connections) {
    connectionsById[connection.connId] = connection
  }
  return accountSet.accounts.map(apiAccount => {
    const connection = apiAccount.connId !== undefined ? connectionsById[apiAccount.connId] : undefined
    return {
      account: {
        id: getAccountId(apiAccount),
        type: inferAccountType(apiAccount),
        title: makeAccountTitle(apiAccount, connection),
        instrument: normalizeInstrument(apiAccount.currency),
        syncIds: [
          getSyncId(apiAccount)
        ],
        savings: isSavingsAccount(apiAccount),
        balance: apiAccount.balance,
        available: apiAccount.availableBalance,
        creditLimit: 0
      },
      apiAccount,
      connection
    }
  })
}

export function convertTransactions (apiAccount: SimpleFinAccount): Transaction[] {
  const accountId = getAccountId(apiAccount)
  return apiAccount.transactions.map(transaction => convertTransaction(transaction, accountId))
}

function convertTransaction (transaction: SimpleFinTransaction, accountId: string): Transaction {
  const category = typeof transaction.extra?.category === 'string' ? transaction.extra.category : undefined
  return {
    hold: transaction.pending === true || transaction.posted === 0,
    date: new Date(getTransactionTimestamp(transaction) * 1000),
    movements: [
      {
        id: `${accountId}:${transaction.id}`,
        account: { id: accountId },
        invoice: null,
        sum: transaction.amount,
        fee: 0
      }
    ],
    merchant: transaction.description.length > 0
      ? {
          fullTitle: transaction.description,
          mcc: null,
          location: null,
          ...category !== undefined && { category }
        }
      : null,
    comment: null
  }
}

function getTransactionTimestamp (transaction: SimpleFinTransaction): number {
  return transaction.transactedAt ?? transaction.posted
}

function getAccountId (account: SimpleFinAccount): string {
  return account.connId !== undefined ? `${account.connId}:${account.id}` : account.id
}

function getSyncId (account: SimpleFinAccount): string {
  return `simplefin:${getAccountId(account)}`
}

function makeAccountTitle (account: SimpleFinAccount, connection?: SimpleFinConnection): string {
  const connectionName = connection?.orgName ?? connection?.name ?? account.connName
  return connectionName !== undefined && !account.name.toLowerCase().includes(connectionName.toLowerCase())
    ? `${connectionName} ${account.name}`
    : account.name
}

function inferAccountType (account: SimpleFinAccount): AccountType.ccard | AccountType.checking | AccountType.investment {
  const title = `${account.name} ${String(account.extra?.['account-type'] ?? '')}`.toLowerCase()
  if (/\b(investment|brokerage|portfolio|securities)\b/.test(title)) {
    return AccountType.investment
  }
  if (/\b(credit|card)\b/.test(title) && !/\b(debit|checking)\b/.test(title)) {
    return AccountType.ccard
  }
  return AccountType.checking
}

function isSavingsAccount (account: SimpleFinAccount): boolean {
  return /\bsavings?\b/i.test(`${account.name} ${String(account.extra?.['account-type'] ?? '')}`)
}

function normalizeInstrument (currency: string): string {
  return currency.startsWith('http://') || currency.startsWith('https://')
    ? currency
    : currency.toUpperCase()
}
