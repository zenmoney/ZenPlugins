export interface Preferences {
  apiKey: string
  apiSecret: string
  roundUpTransactions: boolean
  investCashback: boolean
}

export interface AccountSummary {
  id: number
  currency: string
  totalValue: number
  cash: {
    availableToTrade: number
    reservedForOrders: number
    inPies: number
  }
  investments: {
    currentValue: number
    totalCost: number
    realizedProfitLoss: number
    unrealizedProfitLoss: number
  }
}

export interface ExportRequest {
  reportId: number
}

export interface ExportData {
  reportId: number
  dataIncluded: {
    includeOrders: boolean
    includeDividends: boolean
    includeInterest: boolean
    incudeTransactions: boolean
  }
  timeFrom: string
  timeTo: string
  status: 'Queued' | 'Processing' | 'Running' | 'Canceled' | 'Failed' | 'Finished'
  downloadLink: string
}

export type ExportOperation = {
  ID: string
  Action: string
  Notes?: string
  'Merchant name'?: string
  'Merchant category'?: string
  'Currency conversion from amount'?: string
  'Currency (Currency conversion from amount)'?: string
  'Currency conversion to amount'?: string
  'Currency (Currency conversion to amount)'?: string
  'Currency conversion fee'?: string
  'Currency (Currency conversion fee)'?: string
} & ({
  'Time (UTC)': string
  Total: string
  'Currency (Total)': string
} | {
  Time: string
  'Gross Total': string
  'Currency (Gross Total)': string
})
