import { AccountType, Account, Transaction } from '../../types/zenmoney'
import { SplitwiseExpense } from './models'

export function convertAccounts (expenses: SplitwiseExpense[]): Account[] {
  // Get currencies only from expenses where user was involved
  const currencies = new Set(expenses
    .filter((expense) => expense.users.some((user) => parseFloat(user.owed_share) > 0))
    .map((expense) => expense.currency_code))

  // Calculate balances from expenses
  const balances: Record<string, number> = {}
  for (const expense of expenses) {
    for (const user of expense.users) {
      const owedShare = parseFloat(user.owed_share)
      if (owedShare > 0) {
        balances[expense.currency_code] = (balances[expense.currency_code] ?? 0) - owedShare
      }
    }
  }

  return Array.from(currencies).map((currency) => ({
    id: currency,
    type: AccountType.checking,
    title: `Splitwise ${currency}`,
    instrument: currency,
    balance: balances[currency] ?? 0,
    syncIds: [`SW${currency.padEnd(4, '0')}`]
  }))
}

export function convertTransaction (expense: SplitwiseExpense, currentUserId: number): Transaction | null {
  const currentUser = expense.users.find((user) => user.user_id === currentUserId)

  if (!currentUser) {
    return null
  }

  const owedShare = parseFloat(currentUser.owed_share)

  // Only create transaction if user owes money
  if (owedShare <= 0) {
    return null
  }

  return {
    hold: false,
    date: new Date(expense.date),
    movements: [{
      id: expense.id.toString(),
      account: { id: expense.currency_code },
      sum: -owedShare, // Negative because it's an expense
      fee: 0,
      invoice: null
    }],
    merchant: {
      fullTitle: expense.description,
      mcc: null,
      location: null
    },
    comment: expense.description
  }
}
