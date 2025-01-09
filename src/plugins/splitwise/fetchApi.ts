import { Auth, SplitwiseExpense, SplitwiseUser } from './models'

async function fetchApi (path: string, auth: Auth, params: Record<string, string | number> = {}): Promise<unknown> {
  const queryString = new URLSearchParams(params as Record<string, string>).toString()
  const url = `https://secure.splitwise.com/api/v3.0${path}${queryString ? '?' + queryString : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })

  if (response.status === 401) {
    throw new Error('Unauthorized: Invalid token')
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

function formatDate (date: Date): string {
  // Ensure we have a valid date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date()
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

export async function fetchCurrentUser (auth: Auth): Promise<SplitwiseUser> {
  const response = await fetchApi('/get_current_user', auth)
  return (response as { user: SplitwiseUser }).user
}

export async function fetchExpenses (auth: Auth, fromDate: Date, toDate: Date): Promise<SplitwiseExpense[]> {
  const params: Record<string, string | number> = {
    dated_after: formatDate(fromDate),
    dated_before: formatDate(toDate),
    limit: 0
  }

  const response = await fetchApi('/get_expenses', auth, params)
  const expenses = (response as { expenses: SplitwiseExpense[] }).expenses
  return expenses.length > 0 ? expenses : []
}

export async function fetchBalances (auth: Auth): Promise<Record<string, number>> {
  const response = await fetchApi('/get_groups', auth)
  const groups = (response as { groups: Array<{ group_id: number, members: Array<{ balance: Array<{ currency_code: string, amount: string }> }> }> }).groups
  const balances: Record<string, number> = {}
  for (const group of groups) {
    for (const member of group.members) {
      for (const balance of member.balance) {
        if (balance.currency_code !== '') {
          const amount = parseFloat(balance.amount)
          balances[balance.currency_code] = (balances[balance.currency_code] ?? 0) + amount
        }
      }
    }
  }

  return balances
}
