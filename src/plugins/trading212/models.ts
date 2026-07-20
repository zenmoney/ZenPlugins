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

export interface ExportOperation {
  ID: string
  Action: string
  'Time (UTC)'?: string
  Time?: string
  Total?: string
  'Gross Total'?: string
  'Currency (Total)'?: string
  'Currency (Gross Total)'?: string
  'Merchant name'?: string
  'Merchant category'?: string
}
