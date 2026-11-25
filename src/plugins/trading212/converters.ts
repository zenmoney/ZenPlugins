import { AccountOrCard, AccountType, Movement, Transaction } from '../../types/zenmoney'
import { AccountSummary, ExportOperation, Preferences } from './models'

export function convertAccount (accountSummary: AccountSummary): { account: AccountOrCard, card: AccountOrCard } {
  const id = accountSummary.id.toString()
  const rawCardBalance =
    accountSummary.totalValue -
    accountSummary.investments.currentValue -
    accountSummary.cash.availableToTrade -
    accountSummary.cash.reservedForOrders -
    accountSummary.cash.inPies
  const cardBalance = Math.max(0, Number(rawCardBalance.toFixed(2)))
  const accountBalance = Number((accountSummary.totalValue - cardBalance).toFixed(2))
  return {
    account: {
      id,
      type: AccountType.investment,
      title: 'Trading212',
      instrument: accountSummary.currency,
      balance: accountBalance,
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

export function convertTransactions (
  operations: ExportOperation[],
  accountId: string,
  cardId: string,
  accountCurrency: string,
  preferences: Preferences
): Transaction[] {
  return operations.flatMap(op => convertTransaction(op, accountId, cardId, accountCurrency, preferences))
}

function convertTransaction (
  op: ExportOperation,
  accountId: string,
  cardId: string,
  accountCurrency: string,
  preferences: Preferences
): Transaction[] {
  const isCardDebit = op.Action === 'Card debit'
  const isCardCashback = op.Action === 'Spending cashback' && !preferences.investCashback
  const isCardTransaction = isCardDebit || isCardCashback
  const time = 'Time (UTC)' in op ? op['Time (UTC)'] : op.Time
  const date = new Date('Time (UTC)' in op ? time : `${time}+00:00`)
  const amount = Number('Total' in op ? op.Total : op['Gross Total'])
  const currency = ('Total' in op ? op['Currency (Total)'] : op['Currency (Gross Total)']).trim()

  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid Trading212 operation amount for ${op.ID}`)
  }
  if (currency === '') {
    throw new Error(`Missing Trading212 operation currency for ${op.ID}`)
  }

  console.log('Converting operation', op)

  const isSameCurrency = currency === accountCurrency
  const localMovement: Movement = {
    id: op.ID,
    account: { id: isCardTransaction ? cardId : accountId },
    invoice: isSameCurrency ? null : { sum: amount, instrument: currency },
    sum: isSameCurrency ? amount : null,
    fee: 0
  }

  const isExternalTransfer = (op.Action === 'Deposit' || op.Action === 'Withdrawal') && amount !== 0
  const movements: Transaction['movements'] = isExternalTransfer
    ? [
        localMovement,
        {
          id: null,
          account: {
            type: null,
            instrument: currency,
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: -amount,
          fee: 0
        }
      ]
    : [localMovement]

  const notes = op.Notes?.trim()
  const comment = notes != null && notes !== '' && notes !== op.Action
    ? `${op.Action}: ${notes}`
    : op.Action

  const transactions: Transaction[] = [
    {
      hold: false,
      date,
      movements,
      comment,
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

  if (preferences.roundUpTransactions && isCardDebit && localMovement.sum !== null) {
    const roundedSum = Math.ceil(Math.abs(localMovement.sum))
    const roundUpAmount = +(roundedSum - Math.abs(localMovement.sum)).toPrecision(5)
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
