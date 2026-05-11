import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { AccountSummary, ApiTransaction } from './models'

export function convertAccount (accountSummary: AccountSummary): AccountOrCard {
  const id = accountSummary.id.toString()
  return {
    id,
    type: AccountType.investment,
    title: 'Trading212',
    instrument: accountSummary.currency,
    balance: accountSummary.totalValue,
    syncIds: [id]
  }
}

export function convertTransactions (apiTransactions: ApiTransaction[], accountId: string): Transaction[] {
  return apiTransactions.map(tr => convertTransaction(tr, accountId))
}

function convertTransaction (tr: ApiTransaction, accountId: string): Transaction {
  let comment: string = ''
  if (tr.type === 'TRANSFER') {
    comment = 'Internal transfer'
  } else if (tr.type === 'DEPOSIT') {
    comment = 'Deposit'
  } else if (tr.type === 'FEE') {
    comment = 'Transaction fee'
  } else if (tr.type === 'WITHDRAW') {
    comment = 'Withdrawal'
  }

  return {
    hold: false,
    date: new Date(tr.dateTime),
    movements: [{
      id: tr.reference,
      account: { id: accountId },
      invoice: null,
      sum: tr.amount,
      fee: 0
    }],
    comment,
    merchant: null
  }
}
