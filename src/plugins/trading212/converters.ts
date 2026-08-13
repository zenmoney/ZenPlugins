import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { AccountSummary, ExportOperation, Preferences } from './models'

export function convertAccount (accountSummary: AccountSummary): { account: AccountOrCard, card: AccountOrCard } {
  const id = accountSummary.id.toString()
  const cardBalance = accountSummary.totalValue - accountSummary.investments.currentValue - accountSummary.cash.availableToTrade
  return {
    account: {
      id,
      type: AccountType.investment,
      title: 'Trading212',
      instrument: accountSummary.currency,
      balance: accountSummary.totalValue - cardBalance,
      syncIds: [id]
    },
    card: {
      id: id + '-card',
      type: AccountType.ccard,
      title: 'Trading212 Card',
      instrument: accountSummary.currency,
      balance: cardBalance,
      syncIds: [id + '-card']
    }
  }
}

export function convertTransactions (operations: ExportOperation[], accountId: string, cardId: string, preferences: Preferences): Transaction[] {
  return operations.flatMap(op => convertTransaction(op, accountId, cardId, preferences))
}

function convertTransaction (op: ExportOperation, accountId: string, cardId: string, preferences: Preferences): Transaction[] {
  const isCardDebit = op.Action === 'Card debit'
  const isCardCashback = op.Action === 'Spending cashback' && !preferences.investCashback
  const isCardTransaction = isCardDebit || isCardCashback
  const time = op['Time (UTC)'] ?? op.Time
  const date = new Date(op['Time (UTC)'] != null && time != null ? `${time.replace(' ', 'T')}Z` : time ?? '')
  const sum = Number(op.Total ?? op['Gross Total'])

  console.log('Converting operation', op)

  const transactions: Transaction[] = [
    {
      hold: false,
      date,
      movements: [{
        id: op.ID,
        account: { id: isCardTransaction ? cardId : accountId },
        invoice: null,
        sum,
        fee: 0
      }],
      comment: op.Action,
      merchant: op['Merchant name'] != null
        ? {
            fullTitle: op['Merchant name'],
            category: op['Merchant category'],
            mcc: null,
            location: null
          }
        : null
    }
  ]

  if (preferences.roundUpTransactions && isCardDebit) {
    const roundedSum = Math.ceil(Math.abs(sum))
    const roundUpAmount = +(roundedSum - Math.abs(sum)).toPrecision(5)
    if (roundUpAmount > 0) {
      transactions.push({
        hold: false,
        date,
        movements: [
          {
            id: null,
            account: { id: cardId },
            invoice: null,
            sum: -roundUpAmount,
            fee: 0
          },
          {
            id: null,
            account: { id: accountId },
            invoice: null,
            sum: roundUpAmount,
            fee: 0
          }
        ],
        comment: 'Round up',
        merchant: null
      })
    }
  }

  return transactions
}
