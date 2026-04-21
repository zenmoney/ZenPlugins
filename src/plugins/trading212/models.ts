export interface Preferences {
  apiKey: string
  apiSecret: string
}

export interface AccountSummary {
  id: number
  currency: string
  totalValue: number
}

export interface ApiTransaction {
  type: 'WITHDRAW' | 'DEPOSIT' | 'FEE' | 'TRANSFER'
  amount: number
  reference: string
  dateTime: string
}

export interface TransactionHistoryPage {
  items: ApiTransaction[]
  nextPaghPath: string | null
}
